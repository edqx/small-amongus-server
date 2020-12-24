const V2Map=[25,21,19,10,8,11,12,13,22,15,16,6,24,23,18,7,0,3,9,4,14,20,1,2,5,17];
const V2="QWXRTYLPESDFGHUJKZOCVBINMA";
module.exports.code2int=function(code){
    return ((V2Map[code.charCodeAt(1)-65]+26*V2Map[code.charCodeAt(1)-65])&0x3FF|(((V2Map[code.charCodeAt(2)-65]+26*(V2Map[code.charCodeAt(3)-65]+26*(V2Map[code.charCodeAt(4)-65]+26*V2Map[code.charCodeAt(5)-65])))<<10)&0x3FFFFC00)|0x80000000);
}
module.exports.int2code=function(int){
    const a=int & 0x3FF;
    const b=(int >> 10) & 0xFFFFF;

    return V2[a % 26] +
        V2[~~(a / 26)] +
        V2[b % 26] +
        V2[~~(b / 26 % 26)] +
        V2[~~(b / (26 * 26) % 26)] +
        V2[~~(b / (26 * 26 * 26) % 26)];
}