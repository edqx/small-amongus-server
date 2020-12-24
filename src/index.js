const {code2int} = require("./code");
module.exports=cfg=>{
    const socket = require("dgram").createSocket("udp4");
    const events=new require("events")();
    socket.bind(cfg.port, cfg.ip, () => {
        events.emit("bind");
    });
    const clients = new Map;
    const rooms = {};

    let incr_clientid = 0;

    // Socket 
    const send=(buf,remote)=>new Promise(resolve=>socket.send(buf,remote.port,remote.address,resolve));
    const disconnect=async(client,reason)=>(
        client.disconnected=true,
        client.room&&rem(client),
        reason===null?send(Buffer.from("09","hex"),client.remote)
        : await send(Buffer.from("09010000"+reason.toString(16).padStart(2,"0"), "hex"),client.remote)
    );
    const joinerr=(client,reason)=>(
        write = Buffer.from("01000000040100000000","hex"),
        write.writeUInt16BE(client.nonce,1),
        write.writeInt32LE(reason,6),
        send(write,client.remote)
    );
    const ack=(client,nonce)=>(
        buf = Buffer.from("0a0000","hex"),
        buf.writeUInt16BE(nonce, 1),
        send(buf,client.remote)
    );
    const wpacked=(buf,val,offs=0)=>{
        let i=0;
        do {let b = val & 0xFF;
            if (val>=0x80)b |= 0x80;
            buf.writeUInt8(b,offs+i);
            i++;
            val >>= 7;} while (val > 0);
        return i;
    }
    const rpacked=(buf,offs=0)=>{
        let out = 0, doread = true, i = 0;
        while (doread) {
            const b = buf.readUInt8(offs+i);
            doread = false;
            if (b & 0x80) {
                b ^= 0x80;
                doread = true;
            }
            out |= b << (i * 7);
            i++;
        }
        return [out,i];
    }
    const rem=(client)=>{
        if (client.room) {
            const t="0100000d000400000000000000000000000000";
            const room=rooms[client.room];
            const code=client.room;
            client.room=null;
            if(!room)
                return;
            for (let i = 0; i < room.clients.length;i++){
                const c=room.clients[i];
                if(c.id===client.id){
                    room.clients.splice(i,1);
                    i--;
                }else{
                    const write=Buffer.from(t,"hex");
                    write.writeUInt16BE(++c.nonce,1);
                    write.writeInt32LE(code,6);
                    write.writeUInt32LE(client.id,10);
                    while(room.host===client.id)room.host=room.clients[Math.floor(Math.random()*room.clients.length)].id;
                    write.writeUInt32LE(room.host,14);
                    write.writeUInt8(0,15);
                    send(write,c.remote);
                }
            }
            events.emit("remove",client,room);
        }
    }
    const gen = ()=>[0,0,0,0,0,0].map(_=>String.fromCharCode(65+Math.floor(Math.random()*26))).join("");
    function readPayload(client, tag, buf) {
        switch (tag) {
            case 0: {
                let i = 0;
                while (buf.readUInt8(i)>0x80&&i<4) i++;
                if (i>=4)return;
                const max_players = buf.readUInt8(i + 2);
                const code = code2int(gen());
                const write = Buffer.from("01000004000000000000", "hex");
                write.writeUInt16BE(++client.nonce, 1);
                write.writeInt32LE(code, 6);
                rooms[code] = { code, clients: [], host: -1, max: max_players, started: false };
                send(write, client.remote);
                events.emit("create", client, rooms[code]);
                break;
            }
            case 1: {
                const code = buf.readInt32LE(0);
                const room = rooms[code];
                if (room) {
                    if (room.started)
                        return joinerr(client, 2);
                    if (room.clients.length >= room.max)
                        return joinerr(client, 1);
                    for (let i=0; i<room.clients.length; i++) {
                        const write = Buffer.from("0100000c0001000000000000000000000000", "hex");
                        const c=room.clients[i];
                        write.writeUInt16BE(++c.nonce, 1);
                        write.writeInt32LE(code, 6);
                        write.writeUInt32LE(client.id, 10);
                        write.writeUInt32LE(room.host, 14);
                        send(write,c.remote);
                    }
                    if(room.host===-1)room.host=client.id;
                    const write = Buffer.from("01000000000700000000000000000000000000" + room.clients.map(_=>"00".repeat(wpacked(Buffer.alloc(5),_.id))).join(""),"hex");
                    write.writeUInt16LE(write.byteLength-6,3);
                    write.writeUInt16BE(++client.nonce, 1);
                    write.writeInt32LE(code, 6);
                    write.writeUInt32LE(client.id, 10);
                    write.writeUInt32LE(room.host, 14);
                    let offset=18;
                    offset+=wpacked(write,room.clients.length,offset);
                    for (let i = 0; i < room.clients.length; i++) {
                        offset+=wpacked(write,room.clients[i].id,offset);
                    }
                    room.clients.push(client);
                    client.room=code;
                    send(write,client.remote);
                    events.emit("join",client,room);
                } else return disconnect(client,3);
                break;
            }
        }
        const code = buf.readInt32LE(0)||client.room;
        const room = rooms[code];
        if (!room || !room.clients.find(c=>c.id===client.id))
            return;

        const clone=c=>{
            const rebuild=Buffer.from("010000000000" + "00".repeat(buf.byteLength),"hex");
            rebuild.writeUInt16BE(++c.nonce,1);
            rebuild.writeUInt16LE(buf.byteLength,3);
            rebuild.writeUInt8(tag,5);
            buf.copy(rebuild,6,0);
            return rebuild;
        }

        const broadcast=(b=false)=>{
            for (let i=0;i<room.clients.length;i++){
                const c=room.clients[i];
                if(!c||(c.id===client.id&&!b))continue;
                send(clone(c),c.remote);
            }
        }
        
        switch (tag) {
            case 2: {
                if (room.host===client.id){
                    room.started=true;
                    broadcast(true);
                    events.emit("start",room);
                }
                break;
            }
            case 4: {
                if (room.host===client.id) {
                    const removed = buf.readUInt32LE(4);
                    const reason=buf.readUInt8(8);
                    const client = room.clients.findIndex(c=>c.id===removed);
                    if (!room.clients[client])return;
                    room.clients[client].room=null;
                    disconnect([room.clients[client]],reason);
                    room.clients.splice(room.clients[client],1);
                    broadcast();
                }
                break;
            }
            case 5:
            case 6: {
                let recipid;
                if (tag===6)recipid=rpacked(buf,4)[0];
                const recip=room.clients.find(c=>c.id===recipid);
                if(recip){
                    const rebuild=Buffer.from("010000000000" + "00".repeat(buf.byteLength),"hex");
                    rebuild.writeUInt16BE(++recip.nonce,1);
                    rebuild.writeUInt16LE(buf.byteLength,3);
                    rebuild.writeUInt8(6,5);
                    buf.copy(rebuild,6,0);
                    send(rebuild,recip.remote);
                } else {
                    broadcast();
                }
                break;
            }
            case 8:
                if (room.host===client.id){
                    room.started=false;
                    broadcast(true);
                }
                break;
            case 11: {
                const kickedid=buf.readUInt32LE(4);
                const b=buf.readUInt8(8);
                const client = room.clients.find(c=>c.id===kickedid);
                if (!client)return;
                disconnect(client,6+!b);
                break;
            }
            case 12:
                const recipid=buf.readUInt32LE(4);
                const recip=room.clients.find(c=>c.id===recipid);
                if (recip) send(clone(recip),recip.remote);
                break;
        }
    }
    socket.on("message", (buf, remote) => {
        let client = clients.get(remote.address + ":" + remote.port);
        if (!client) {
            incr_clientid = incr_clientid > 2 ** 32 - 1 ? 1 : incr_clientid + 1;
            client = {remote,id:incr_clientid,identifed: false,disconnected: false,nonce: 1,room: null,fmt:incr_clientid+" ("+remote.address+":"+remote.port+")"};
            clients.set(remote.address + ":" + remote.port, client);
            events.emit("client", client);
        }
        const op = buf.readUInt8(0);
        switch (op) {
            case 8: {
                const nonce = buf.readUInt16BE(1);
                ack(client,nonce);
                const version = buf.readUInt32LE(4);
                let username = "";
                let i = 8;
                while (buf.readUInt8(i)>=0x80&&i<12) i++; // Skip name length
                i++
                if (i>=13)return;
                while (i++ < buf.byteLength) username += String.fromCharCode(buf.readUInt8(i - 1));
                client.identified=true;
                events.emit("identify", client, username, version);
                break;
            }
            case 9:
                if (!client.disconnected){
                    disconnect(client,null);
                }
                clients.delete(client.remote.address+":"+client.remote.port);
                break;
            case 12:
                const nonce = buf.readUInt16BE(1);
                ack(client,nonce);
                break;
        }
        if (!client.identified) return;
        switch (op) {
            case 0: {
                let i = 1;
                while (i < buf.byteLength) {
                    const length = buf.readUInt16LE(i);
                    const tag = buf.readUInt8(i + 2);
                    const pbuf = buf.slice(i + 3, i + 3 + length);
                    i += 3 + length;
                    readPayload(client, tag, pbuf);
                }
                break;
            }
            case 1:
                const nonce = buf.readUInt16BE(1);
                ack(client,nonce);
                let i = 3;
                while (i < buf.byteLength) {
                    const length = buf.readUInt16LE(i);
                    const tag = buf.readUInt8(i + 2);
                    const pbuf = buf.slice(i + 3, i + 3 + length);
                    i += 3 + length;
                    readPayload(client, tag, pbuf);
                }
                break;
        }
    });
    events.on("graceful", async ()=>{
        for(let [,cl] of clients) {
            await disconnect(cl,0);
        }
        socket.close(() => {
            events.emit("shutdown");
        });
    });
    return events;
}