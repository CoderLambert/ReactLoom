/** Original 1.6-second mono 8kHz PCM WAV; no audio download or third-party asset. */
export function makeLabWave():Blob{
 const rate=8000,frames=rate*1.6,bytes=44+frames*2;
 const data=new ArrayBuffer(bytes),view=new DataView(data);
 const str=(p:number,v:string)=>{for(let i=0;i<v.length;i++)view.setUint8(p+i,v.charCodeAt(i));};
 str(0,'RIFF');view.setUint32(4,bytes-8,true);str(8,'WAVE');str(12,'fmt ');
 view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
 view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);
 view.setUint16(32,2,true);view.setUint16(34,16,true);
 str(36,'data');view.setUint32(40,frames*2,true);
 for(let i=0;i<frames;i++){
  const t=i/rate;
  const fade=Math.min(1,t*7,(1.6-t)*7);
  const carrier=Math.sin(2*Math.PI*(t<.8?330:440)*t);
  view.setInt16(44+i*2,Math.round(Math.max(0,fade)*carrier*9000),true);
 }
 return new Blob([data],{type:'audio/wav'});
}
