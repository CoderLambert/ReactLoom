import {useEffect,useRef,useState} from 'react';
import {FFmpeg} from '@ffmpeg/ffmpeg';
import {makeToneWav} from './wav';
type Level='basic'|'business'|'advanced';
const ALLOWED:Record<string,string>={'audio/wav':'wav','audio/x-wav':'wav','audio/mpeg':'mp3','audio/webm':'webm','video/webm':'webm','video/mp4':'mp4'};
const MAX_FILE_BYTES=4*1024*1024;
export default function FFmpegExample({level}:{level:Level}){
 const engine=useRef<FFmpeg|null>(null),session=useRef(0),out=useRef<string|null>(null);
 const [loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false);
 const [status,setStatus]=useState('引擎尚未加载；不会自动下载WASM或访问远端媒体');
 const [input,setInput]=useState<File|null>(null),[result,setResult]=useState(''),[log,setLog]=useState('');
 function clearOutput(){if(out.current){URL.revokeObjectURL(out.current);out.current=null}setResult('')}
 useEffect(()=>()=>{session.current++;engine.current?.terminate();engine.current=null;
  if(out.current)URL.revokeObjectURL(out.current);},[]);
 async function load(){
  const id=++session.current;setBusy(true);setStatus('正在从本站加载隔离的FFmpeg核心资源…');
  const ffmpeg=new FFmpeg();engine.current=ffmpeg;
  ffmpeg.on('log',({message})=>{if(engine.current===ffmpeg)setLog(message.slice(0,500))});
  const base=new URL(`${import.meta.env.BASE_URL}ffmpeg-core/`,window.location.origin);
  try{
   await ffmpeg.load({coreURL:new URL('ffmpeg-core.js',base).href,wasmURL:new URL('ffmpeg-core.wasm',base).href});
   if(id!==session.current){ffmpeg.terminate();return}
   setLoaded(true);setStatus('FFmpeg引擎加载完成，点击执行本地转换');
  }catch(error){ffmpeg.terminate();if(engine.current===ffmpeg)engine.current=null;
   if(id===session.current){setLoaded(false);setStatus(`核心加载失败：${String(error)}。请PLATFORM在本站配置同版ffmpeg-core资源和CSP`)}
  }finally{if(id===session.current)setBusy(false)}
 }
 function cancel(){
  session.current++;engine.current?.terminate();engine.current=null;setLoaded(false);setBusy(false);
  clearOutput();setStatus('已终止Worker；如需继续，必须重新加载引擎');
 }
 async function convert(){
  const ffmpeg=engine.current;if(!ffmpeg||!loaded)return;
  const id=++session.current;setBusy(true);clearOutput();setStatus('开始真正FFmpeg转换…');
  let ext='wav';let bytes:Uint8Array;
  if(level!=='basic'&&input){
   if(input.size>MAX_FILE_BYTES||!ALLOWED[input.type]){setStatus('仅接受4MiB内指定音视频MIME');setBusy(false);return}
   ext=ALLOWED[input.type];
  }
  const sourceName=`input.${ext}`;
  try{
   bytes=level!=='basic'&&input?new Uint8Array(await input.arrayBuffer()):makeToneWav();
   if(id!==session.current)return;
   await ffmpeg.writeFile(sourceName,bytes);
   const exit=await ffmpeg.exec(['-hide_banner','-y','-i',sourceName,'-vn','-ac','1','-ar','16000','-t',level==='advanced'?'0.5':'2','-f','wav','output.wav'],12000);
   if(exit!==0)throw new Error(`ffmpeg exec退出码${exit}`);
   const output=await ffmpeg.readFile('output.wav');
   if(typeof output==='string')throw new Error('FFmpeg返回非二进制输出');
   if(id!==session.current)return;
   const blob=new Blob([new Uint8Array(output)],{type:'audio/wav'});
   const url=URL.createObjectURL(blob);out.current=url;setResult(url);
   setStatus(`真实FFmpeg编码完成：${blob.size} bytes，16kHz mono WAV`);
  }catch(error){if(id===session.current)setStatus(`转换失败：${String(error)}`)}
  finally{
   try{await ffmpeg.deleteFile(sourceName)}catch{}
   try{await ffmpeg.deleteFile('output.wav')}catch{}
   if(id===session.current)setBusy(false);
  }
 }
 return <section aria-label="FFmpeg wasm隔离转换实验">
  <h2>{level==='basic'?'原创PCM转换':level==='business'?'本地小文件音频标准化':'超时、取消和Worker终止'}</h2>
  <p>仅在点击后从同源 /ffmpeg-core/ 加载大型WASM；不依赖公共 CDN。需要PLATFORM单独部署 @ffmpeg/core 的esm产物并校验CSP和版本。</p>
  <div className="demo-controls">
   <button type="button" disabled={busy||loaded} onClick={()=>void load()}>显式加载WASM引擎</button>
   {level!=='basic'&&<label>本机音视频（上限4MiB）<input type="file" accept="audio/wav,audio/mpeg,audio/webm,video/mp4,video/webm" onChange={e=>{setInput(e.target.files?.[0]??null);e.currentTarget.value=''}}/></label>}
   <button type="button" disabled={!loaded||busy} onClick={()=>void convert()}>执行转换</button>
   {level==='advanced'&&<button type="button" onClick={cancel}>立即取消并终止Worker</button>}
  </div>
  <p role="status">{status}</p>
  {result&&<audio src={result} controls aria-label="真实转换产生的WAV"/>}
  {level==='advanced'&&<><p>高级处理最长0.5秒输入；超时并非可靠资源隔离。取消通过 terminate 结束实例，不能使用已终止引擎。</p><pre style={{whiteSpace:'pre-wrap'}}>{log}</pre></>}
 </section>;
}
