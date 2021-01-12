"use strict";
let s=require("dgram").createSocket("udp4"), // create socket
	cl={},g={},B=Buffer,incr=0, // create data vars for clients, games, buffer alias and incrementing client ID respectively
    v4p=_=>65+Math.floor(Math.random()*26), // create random uppercase char
	co,ga,ba,b2,ar,b, // initialise vars
	wi=i=>B.from([i,i>>8,i>>16,i>>24]), // write a 32 bit integer
	pa=i=>{ar=[];do{b=i&0xff;i>=0x80&&(b|=0x80);ar.push(b);i>>>=7}while(i>0);return B.from(ar)}, // write a packed uint32
    _pl=(c,t,bu)=>s.send((b2=B.from([,,,t,...bu]),
		b2.writeUInt16LE(B.from(bu).byteLength,1),b2), // write payload length
		c.r.port,c.r.address);
s.on("message",(b,r)=>{
    let f=r.address+r.port, // remote's formatted address:port
        c=cl[f]||(cl[f]={r,i:++incr,id:false,d:false,g:0,f}), // create the client if it doesn't exist with { r: remote, i: clientid, id: identified, d: disconnected, g: game, f: formatted address }
        send=b=>s.send(B.from(b),r.port,r.address), // send a packet to the client
		l=_=>(ga=g[c.g])&&( // Does game exist?
			ga.cl.splice(ga.cl.indexOf(c),1), // remove client from game
			!ga.cl.length? // is the game now empty?
				g[c.g]=0: // destroy game
				(ga.h==c.i&&( // was the client the host?
					ga.h=ga.cl[0].i)), // select a new host
			ga.cl.forEach(cl=>_pl(cl,4,[...wi(c.g),...wi(c.i),...wi(g.h)]))), // send remove player with the new host to every other client
        d=_=>(g[c.g]&&l(),send(B.from([9]))), // disconnect the client w/ a reason
        pl=(t,bu)=>_pl(c,t,bu), // send a payload to the client
        br=(g,t,bu,ex)=>g&&g.cl.forEach(cl=>cl!=ex&&_pl(cl,t,bu)), // broadcast a packet to all clients a game
        i=b[0]?3:1; // the current index depending on whether or not it has a nonce
	[1,8,12].includes(b[0])&&send([10,b[1],b[2],255]); // acknowlege reliable packets
    b[0]==8?c.id=true:b[0]==9&&(c.d||d(),cl[f]=0); // handle hello and disconnect packets
    if(b[0]<2)while(i<b.byteLength){ // handle normal packets
        let l=b[i]<<8|b[i+1], // length of payload
			t=b[i+2], // payload tag
			p=b.slice(i+3,i+3+l); // payload data
        t==0&&( // create game request
			co=v4p()<<24|v4p()<<16|v4p()<<8|v4p(), // generate a random 4 letter code
			g[co]={h:-1,s:0,cl:[]}, // create the game, with { h: host, s: state, cl: clients }
			pl(0,wi(co))); // send code to client
        t==1&&( // join game request
			co=p.readInt32LE(0), // read code
			(ga=g[co])? // game exists?
				ga.s!=1?( // game started?
					ga.h==-1?ga.h=c.i:0, // set host if no host
					c.g=co, // update the clients current game
					ba=[...wi(co),...wi(c.i),...wi(ga.h)], // base payload that join game & joined game can extend from
					br(ga,1,ba,c), // broadcast join game to all clients in game
					pl(7,[...ba,...pa(ga.cl.length), // send joined game to joining client
						...ga.cl.map(c=>[...pa(c.i)]).flat()]), // write all client IDs as packed uint32s
					ga.cl.push(c)) // add client to game
				:pl(1,[,,,2]) // join error: game started
			:pl(1,[,,,3])); // join error: game not found
		t>1&&( // any other payload	
			br(g[c.g],t,p, // broadcast every other payload
				...(t==5||t==6?[c]:[]))); // dont broadcast to sender if the payload is gamedata
        i+=3+l; // skip payload to read next payload
    }
}).bind(22023);
