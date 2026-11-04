import {useEffect,useRef,useState} from 'react';
import Hls from 'hls.js';
type Level='basic'|'business'|'advanced';
const TEST_HLS='https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
export default function HlsExample({level}:{level:Level}){return <HlsSession key={level} level={level}/>;}
function HlsSession({level}:{level:Level}){
 const videoRef=useRef<HTMLVideoElement>(null);const hlsRef=useRef<Hls|null>(null);
 const generation=useRef(0);const [status,setStatus]=useState('未加载：演示不会自动联网');
 const [qualities,setQualities]=useState<{index:number;label:string}[]>([]);
 const [selected,setSelected]=useState(-1);
 function stop(){
  generation.current++;hlsRef.current?.destroy();hlsRef.current=null;
  const video=videoRef.current;if(video){video.onerror=null;video.pause();video.removeAttribute('src');video.load();}
  setQualities([]);setSelected(-1);setStatus('已停止并清理媒体实例');
 }
 useEffect(()=>()=>{generation.current++;hlsRef.current?.destroy();const v=videoRef.current;if(v){v.onerror=null;v.pause();v.removeAttribute('src');v.load()}},[]);
 function load(){
  const video=videoRef.current;if(!video)return;stop();const run=++generation.current;
  setStatus('用户已选择访问公开测试流，等待清单…');
  video.onerror=()=>{if(run!==generation.current)return;
   setStatus(`浏览器媒体解码/资源错误：${video.error?.message||'请检查网络、CORS与媒体编码'}`);
  };
  if(Hls.isSupported()){
   const hls=new Hls({enableWorker:false,maxBufferLength:12});hlsRef.current=hls;
   hls.on(Hls.Events.MEDIA_ATTACHED,()=>{if(run===generation.current)hls.loadSource(TEST_HLS)});
   hls.on(Hls.Events.MANIFEST_PARSED,(_,info)=>{
    if(run!==generation.current)return;
    setQualities(hls.levels.map((q,index)=>({index,label:`${q.height||'?'}p · ${Math.round(q.bitrate/1000)} kbps`})));
    setStatus(`已读取真实HLS清单（${info.levels.length}层），请点击播放器原生播放按钮`);
   });
   hls.on(Hls.Events.ERROR,(_,err)=>{
    if(run!==generation.current)return;
    setStatus(`HLS错误：${err.type}/${err.details}${err.fatal?' (fatal)':''}`);
    if(err.fatal){
     generation.current++; // invalidate late callbacks from this failed HLS session
     hls.destroy();if(hlsRef.current===hls)hlsRef.current=null;
     video.onerror=null;video.pause();video.removeAttribute('src');video.load();
     setQualities([]);setSelected(-1);
    }
   });
   hls.attachMedia(video);
  }else if(video.canPlayType('application/vnd.apple.mpegurl')){
   video.src=TEST_HLS;setStatus('浏览器采用原生 HLS；不是 hls.js MSE 模式');
  }else setStatus('当前浏览器不支持 MSE/原生 HLS，未发出媒体请求');
 }
 function quality(index:number){const hls=hlsRef.current;if(!hls)return;
  if(index!==-1&&!qualities.some(item=>item.index===index))return;
  hls.currentLevel=index;setSelected(index);}
 return <section aria-label="hls.js真实播放引擎">
  <h2>{level==='basic'?'HLS支持检测与加载':level==='business'?'自适应码率与观测':'错误回退与实例销毁'}</h2>
  <p>只有点击加载才访问官方文档示例中的公开 test-streams.mux.dev 测试资源；数据不上传。流由外部提供，无法离线解码；无 CORS/网络时显示真实错误而非伪装成功。</p>
  <div className="demo-controls"><button type="button" onClick={load}>加载公开 HLS 测试流（外部请求）</button>
   <button type="button" onClick={stop}>停止并销毁</button>
   {level!=='basic'&&<label>质量<select disabled={!hlsRef.current} value={selected} onChange={e=>quality(Number(e.target.value))}><option value={-1}>自动</option>{qualities.map(q=><option value={q.index} key={q.index}>{q.label}</option>)}</select></label>}
  </div>
  <video controls playsInline ref={videoRef} style={{width:'100%',maxWidth:640,background:'#192821'}}/>
  <p role="status">{status}</p>
  {level==='advanced'&&<p>fatal error后重新点击“加载”必须新建Hls实例；销毁旧Worker/MSE缓冲，不自动无界重试，也不绕过CORS。</p>}
 </section>;
}
