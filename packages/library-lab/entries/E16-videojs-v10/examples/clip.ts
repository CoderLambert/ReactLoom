export async function createLocalClip(variant: 'light'|'dark'='light',signal?:AbortSignal):Promise<Blob>{
 if(typeof MediaRecorder==='undefined')throw new Error('此浏览器没有MediaRecorder；可以在进阶层选择本地MP4/WebM');
 const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;
 const context=canvas.getContext('2d');if(!context)throw new Error('Canvas 2D不可用');
 if(!canvas.captureStream)throw new Error('此浏览器不支持Canvas视频捕获');
 const candidates=['video/webm;codecs=vp8','video/webm'];const mimeType=candidates.find(x=>MediaRecorder.isTypeSupported(x));
 if(!mimeType)throw new Error('浏览器不能录制WebM；请改用本地文件输入');
 const stream=canvas.captureStream(12);
 let recorder:MediaRecorder;
 try{recorder=new MediaRecorder(stream,{mimeType});}
 catch(error){stream.getTracks().forEach(track=>track.stop());throw error;}
 const chunks:BlobPart[]=[];let frame=0,finished=false;let timeout:number|undefined;
 const draw=()=>{context.fillStyle=variant==='light'?'#e7f0e8':'#273b36';context.fillRect(0,0,320,180);
 context.fillStyle=variant==='light'?'#205843':'#e9f5e6';
 context.font='bold 30px sans-serif';context.fillText('Library Lab',27,74);
 context.fillRect(27+(frame%60)*3,105,48,10);frame++;};
 draw();const ticker=window.setInterval(draw,80);
 const abort=()=>{if(finished)return;finished=true;
  try{if(recorder.state!=='inactive')recorder.stop()}catch{}
  failure?.(new DOMException('录制已取消','AbortError'));};
 let failure:((reason:unknown)=>void)|null=null;
 try{return await new Promise<Blob>((resolve,reject)=>{
  failure=reject;
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
  recorder.onerror=()=>{if(finished)return;finished=true;reject(new Error('MediaRecorder失败'))};
  recorder.onstop=()=>{if(finished)return;finished=true;const blob=new Blob(chunks,{type:mimeType});blob.size?resolve(blob):reject(new Error('录制产物为空'))};
  if(signal?.aborted){abort();return}
  signal?.addEventListener('abort',abort,{once:true});
  try{recorder.start(100)}catch(error){finished=true;reject(error)}
  timeout=window.setTimeout(()=>{if(recorder.state!=='inactive')recorder.stop()},1450);
 });}
 finally{if(timeout!==undefined)window.clearTimeout(timeout);
  signal?.removeEventListener('abort',abort);
  window.clearInterval(ticker);stream.getTracks().forEach(track=>track.stop())}
}
