/** 1 second of locally generated 16kHz mono PCM, no downloaded fixtures. */
export function makeToneWav(){
 const rate=16000,count=rate,buffer=new ArrayBuffer(44+count*2),view=new DataView(buffer);
 function label(offset:number,value:string){for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i))}
 label(0,'RIFF');view.setUint32(4,36+count*2,true);label(8,'WAVE');label(12,'fmt ');
 view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
 view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);
 label(36,'data');view.setUint32(40,count*2,true);
 for(let i=0;i<count;i++){const envelope=Math.min(1,i/1200,(count-i)/1200);
  view.setInt16(44+i*2,Math.round(Math.sin(2*Math.PI*440*i/rate)*12000*Math.max(0,envelope)),true)}
 return new Uint8Array(buffer);
}
