import {useEffect,useRef,useState} from 'react';
import WaveSurfer from 'wavesurfer.js';
import {makeLabWave} from './wav';
type Level='basic'|'business'|'advanced';
export default function WaveformExample({level}:{level:Level}){return <WaveformSession key={level} level={level}/>;}
function WaveformSession({level}:{level:Level}){
 const mount=useRef<HTMLDivElement>(null);
 const wave=useRef<WaveSurfer|null>(null);
 const [ready,setReady]=useState(false);
 const [playing,setPlaying]=useState(false);
 const [status,setStatus]=useState('正在创建波形…');
 const [seconds,setSeconds]=useState(0);
 const [rate,setRate]=useState(1);
 useEffect(()=>{
  if(!mount.current)return;
  let alive=true;
  const url=URL.createObjectURL(makeLabWave());
  const w=WaveSurfer.create({
   container:mount.current,
   waveColor:'#8cae99',progressColor:'#2c6c4b',cursorColor:'#265841',
   height:100,normalize:false,
  });
  wave.current=w;
  const unsubs=[
   w.on('ready',()=>{if(alive){setReady(true);setStatus('真实WAV已解码，可以播放');}}),
   w.on('timeupdate',t=>{if(alive)setSeconds(t)}),
   w.on('play',()=>{if(alive)setPlaying(true)}),
   w.on('pause',()=>{if(alive)setPlaying(false)}),
   w.on('finish',()=>{if(alive){setPlaying(false);setStatus('播放结束');}}),
   w.on('error',e=>{if(alive)setStatus('波形加载错误：'+String(e))}),
  ];
  void w.load(url).catch(error=>{if(alive&&!(error instanceof DOMException&&error.name==='AbortError'))setStatus('解码失败：'+String(error));});
  return ()=>{
   alive=false;for(const unsubscribe of unsubs)unsubscribe();
   if(wave.current===w)wave.current=null;
   w.destroy();URL.revokeObjectURL(url);
  };
 },[]);
 const seek=(s:number)=>{const w=wave.current;if(w&&ready)w.setTime(Math.min(s,w.getDuration()));};
 const changeRate=(value:number)=>{wave.current?.setPlaybackRate(value);setRate(value);};
 return <section aria-label="wavesurfer真实音频实验">
  <h2>{level==='basic'?'波形与播放':level==='business'?'音频定位':'播放速率与缩放'}</h2>
  <p>生成1.6秒8kHz本地PCM波形。仅在启动Demo后初始化实例，页面卸载立即destroy并revoke URL。</p>
  <div ref={mount} aria-label="音频波形图" style={{minHeight:105}}/>
  <p role="status">{status}</p><p>播放位置：{seconds.toFixed(2)}s / 1.60s</p>
  <div className="demo-controls"><button type="button" disabled={!ready} onClick={()=>{const instance=wave.current;if(!instance)return;
    void instance.playPause().catch(error=>{if(wave.current===instance)setStatus('播放失败：'+String(error))});}}>{playing?'暂停':'播放'}</button>
   {level!=='basic'&&<button type="button" disabled={!ready} onClick={()=>seek(.8)}>跳到0.8秒</button>}
   {level==='advanced'&&<><label>倍速<select value={rate} disabled={!ready} onChange={e=>changeRate(Number(e.target.value))}><option value={1}>1×</option><option value={1.5}>1.5×</option></select></label><button type="button" disabled={!ready} onClick={()=>wave.current?.zoom(120)}>放大波形</button><button type="button" disabled={!ready} onClick={()=>wave.current?.zoom(0)}>复原</button></>}
  </div>
  {level==='advanced'&&<p>v8 destroy是终态，离开Tab后必须新建WaveSurfer实例；新load替代旧load时要处理AbortError。</p>}
 </section>;
}
