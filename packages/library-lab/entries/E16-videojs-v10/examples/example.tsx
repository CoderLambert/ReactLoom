import {useEffect,useRef,useState} from 'react';
import {VideoPlayer,VideoSkin,Video} from '@videojs/react/video';
import '@videojs/react/video/skin.css';
import {createLocalClip} from './clip';
type Level='basic'|'business'|'advanced';
const MAX_FILE=8*1024*1024;
export default function VideoJsExample({level}:{level:Level}){
 const [url,setUrl]=useState('');const [status,setStatus]=useState('未创建视频；不会自动访问外部资源');
 const [busy,setBusy]=useState(false);const generation=useRef(0);const current=useRef<string|null>(null);
 const recording=useRef<AbortController|null>(null);
 const retiredUrls=useRef<string[]>([]);
 const update=(blob:Blob,id:number)=>{if(id!==generation.current)return;
  const next=URL.createObjectURL(blob);if(current.current)retiredUrls.current.push(current.current);
  current.current=next;setUrl(next);setStatus(`已加载本地素材：${(blob.size/1024).toFixed(1)} KiB`);};
 // Revoke previous Blob URLs only after React has committed the new player/source.
 useEffect(()=>{const old=retiredUrls.current.splice(0);for(const value of old)URL.revokeObjectURL(value)},[url]);
 useEffect(()=>()=>{generation.current++;recording.current?.abort();if(current.current)URL.revokeObjectURL(current.current);for(const old of retiredUrls.current)URL.revokeObjectURL(old);retiredUrls.current=[]},[]);
 async function build(variant:'light'|'dark'){
  recording.current?.abort();const controller=new AbortController();recording.current=controller;
  const id=++generation.current;setBusy(true);setStatus('正在录制原创 Canvas 片段…');
  try{const blob=await createLocalClip(variant,controller.signal);update(blob,id)}
  catch(error){if(id===generation.current)setStatus(`录制失败：${String(error)}`)}
  finally{if(recording.current===controller)recording.current=null;if(id===generation.current)setBusy(false)}
 }
 async function open(file:File|null){if(!file)return;
  recording.current?.abort();const id=++generation.current;setBusy(false);
  if(!['video/webm','video/mp4'].includes(file.type)||file.size>MAX_FILE){setStatus('仅接受不超过8MiB的WebM/MP4');return}
  update(file,id);
 }
 function remove(){generation.current++;recording.current?.abort();recording.current=null;if(current.current){retiredUrls.current.push(current.current);current.current=null}setUrl('');setBusy(false);setStatus('素材已移除')}
 return <section aria-label="Video.js v10真实播放器">
  <h2>{level==='basic'?'本地生成视频与播放器':level==='business'?'切换两段本地新闻片头':'本地视频导入、停止与销毁'}</h2>
  <p>使用稳定版 @videojs/react/video 的 VideoPlayer/VideoSkin/Video，而不是旧版 video.js@8。生成小型 WebM 只走 Canvas/MediaRecorder，不上传文件。</p>
  <div className="demo-controls"><button type="button" disabled={busy} onClick={()=>void build('light')}>制作本地片头</button>
   {level!=='basic'&&<button type="button" disabled={busy} onClick={()=>void build('dark')}>切换深色片头</button>}
   {level==='advanced'&&<label>导入本地视频<input type="file" accept="video/mp4,video/webm" onChange={e=>{void open(e.target.files?.[0]??null);e.currentTarget.value=''}}/></label>}
   <button type="button" onClick={remove}>移除与释放</button>
  </div>
  <p role="status">{status}</p>
  {url?<VideoPlayer key={url}><VideoSkin style={{width:'100%',maxWidth:600,aspectRatio:'16 / 9'}}><Video src={url} playsInline/></VideoSkin></VideoPlayer>:
   <p className="notice">尚未加载媒体。点击制作原创片头或手动选择本地文件。不会自动拉取第三方素材。</p>}
  {level==='advanced'&&<p>切换 source 时重新挂载 VideoPlayer；Blob URL 及时 revoke。需要测试 iOS MediaRecorder 缺失、视频编码不支持和卸载后的网络/资源。</p>}
 </section>;
}
