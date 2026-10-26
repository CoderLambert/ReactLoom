import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import pulse from './pulse.json';

type Level = 'basic' | 'business' | 'advanced';
type Player = Parameters<NonNullable<ComponentProps<typeof DotLottieReact>['dotLottieRefCallback']>>[0];
const SOURCE = JSON.stringify(pulse);
function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const refresh = () => setReduced(query.matches);
    query.addEventListener('change', refresh); return () => query.removeEventListener('change', refresh);
  }, []);
  return reduced;
}
export default function DotLottieExample({ level }: { level: Level }) {
  const reduced = useReducedMotion();
  const [player, setPlayer] = useState<Player>(null);
  const [playing, setPlaying] = useState(false);
  const [override, setOverride] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [visible, setVisible] = useState(() => !document.hidden);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [outcome, setOutcome] = useState<'idle'|'pending'|'success'>('idle');
  const pending = useRef<number | null>(null);
  useEffect(() => { setPlaying(false); setOverride(false); setSpeed(1); setOutcome('idle'); }, [level]);
  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
  useEffect(() => {
    if (!player) { setLoaded(false); return; }
    const onLoad = () => { setLoaded(true); setError(''); };
    const onError = () => { setLoaded(false); setError('动画解析失败，业务状态仍可查看'); };
    player.addEventListener('load', onLoad);
    player.addEventListener('loadError', onError);
    player.addEventListener('renderError', onError);
    if (player.isLoaded) onLoad();
    return () => {
      player.removeEventListener('load', onLoad);
      player.removeEventListener('loadError', onError);
      player.removeEventListener('renderError', onError);
      player.pause();
    };
  }, [player]);
  useEffect(() => {
    if (!player || !loaded) return;
    player.setSpeed(speed);
    if (playing && visible && (!reduced || override)) player.play();
    else { player.pause(); if (reduced && !override) player.setFrame(0); }
  }, [player, loaded, speed, playing, visible, reduced, override]);
  useEffect(() => () => { if (pending.current !== null) window.clearTimeout(pending.current); }, []);
  function finishLocalAction() {
    if (pending.current !== null) window.clearTimeout(pending.current);
    setOutcome('pending'); setPlaying(false);
    pending.current = window.setTimeout(() => {
      pending.current = null;
      setOutcome('success'); setPlaying(true);
    }, 650);
  }
  return <section aria-label="dotLottie React 播放器">
    <h2>{level === 'basic' ? '本地脉冲动画' : level === 'business' ? '订阅完成后的反馈' : '可控动效与节能策略'}</h2>
    <p>真实 DotLottieReact，资源来自仓库 `examples/pulse.json`（不是远程资产）。默认不自动播放；播放状态不决定业务是否成功。</p>
    <figure style={{display:'grid',justifyItems:'center',background:'#f7faf5',borderRadius:12,padding:15}}>
      <DotLottieReact data={SOURCE} loop={true} autoplay={false} style={{width:185,height:155}}
        aria-hidden="true" tabIndex={-1} dotLottieRefCallback={setPlayer}
        renderConfig={{ autoResize:true, devicePixelRatio:Math.min(window.devicePixelRatio || 1,2) }}/>
      <figcaption>{loaded?'矢量动画资源已加载':'等待资源加载'} · 业务状态由下方文字提供</figcaption>
    </figure>
    {error && <p role="alert">{error}</p>}
    <div className="demo-controls">
      <button type="button" disabled={!loaded} onClick={()=>setPlaying(v=>!v)}>{playing?'暂停':'播放'}</button>
      <button type="button" disabled={!loaded} onClick={()=>{setPlaying(false);player?.stop();}}>停止并回到首帧</button>
      {level !== 'basic' && <button type="button" onClick={finishLocalAction}>模拟本地订阅确认</button>}
      {level==='advanced' && <>
        <label>速度 <select value={speed} onChange={e=>setSpeed(Number(e.target.value))}>
          {[0.5,1,1.5].map(n=><option key={n} value={n}>{n}×</option>)}
        </select></label>
        <label><input type="checkbox" checked={override} onChange={e=>setOverride(e.target.checked)}/> 明确允许在减少动态下播放</label>
      </>}
    </div>
    <p role="status">业务：{outcome==='idle'?'尚未提交':outcome==='pending'?'本地处理中':'操作成功'}；
      播放：{playing?'已请求播放':'暂停'}；页面：{visible?'可见':'隐藏'}；减少动态：{reduced?'开启':'关闭'}。</p>
    {reduced&&!override&&<p>尊重系统减少动态偏好：显示静态首帧。只有高级层显式开启才允许覆盖。</p>}
    {level==='advanced'&&<p>页面隐藏、关闭Tab或播放器卸载都会停止播放，并解除事件监听/超时任务。无CSS动画或网络请求作为后备。</p>}
  </section>;
}
