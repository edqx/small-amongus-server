"use strict";
let s=require("dgram").createSocket("udp4"),cl={},g={},B=Buffer,incr=0,v4p=_=>65+Math.floor(Math.random()*26),co,ga,ba,b2,ar,b,wi=i=>B.from([i,i>>8,i>>16,i>>24]),pa=i=>{ar=[];do{b=i&0xff;i>=0x80&&(b|=0x80);ar.push(b);i>>>=7}while(i>0);return B.from(ar)},_pl=(c,t,bu)=>s.send((b2=B.from([,,,t,...bu]),b2.writeUInt16LE(B.from(bu).byteLength,1),b2),c.r.port,c.r.address);
s.on("message",(b,r)=>{
    let f=r.address+r.port,c=cl[f]||(cl[f]={r,i:++incr,id:false,d:false,g:0,f}),send=b=>s.send(B.from(b),r.port,r.address),l=_=>(ga=g[c.g])&&(ga.cl.splice(ga.cl.indexOf(c),1),!ga.cl.length?g[c.g]=0:(ga.h==c.i&&(ga.h=ga.cl[0].i)),ga.cl.forEach(cl=>_pl(cl,4,[...wi(c.g),...wi(c.i),...wi(g.h)]))),d=_=>(g[c.g]&&l(),send(B.from([9]))),pl=(t,bu)=>_pl(c,t,bu),br=(g,t,bu,ex)=>g&&g.cl.forEach(cl=>cl!=ex&&_pl(cl,t,bu)),i=b[0]?3:1;
	[1,8,12].includes(b[0])&&send([10,b[1],b[2],255]);
    b[0]==8?c.id=true:b[0]==9&&(c.d||d(),cl[f]=0);
    if(b[0]<2)while(i<b.byteLength){
        let l=b[i]<<8|b[i+1],t=b[i+2],p=b.slice(i+3,i+3+l);
        t==0&&(co=v4p()<<24|v4p()<<16|v4p()<<8|v4p(),g[co]={h:-1,s:0,cl:[]},pl(0,wi(co)));
		t==1&&(co=p.readInt32LE(0),(ga=g[co])?ga.s!=1?(ga.h==-1?ga.h=c.i:0,c.g=co,ba=[...wi(co),...wi(c.i),...wi(ga.h)],br(ga,1,ba,c),pl(7,[...ba,...pa(ga.cl.length),...ga.cl.map(c=>[...pa(c.i)]).flat()]),ga.cl.push(c)):pl(1,[,,,2]):pl(1,[,,,3]));
		t>1&&(br(g[c.g],t,p,...(t==5||t==6?[c]:[])));
		+=3+l;
    }
}).bind(22023);