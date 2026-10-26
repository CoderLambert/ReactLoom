import {useEffect,useRef,useState} from 'react';
import gsap from 'gsap';
type Props={level:'basic'|'business'|'advanced'};
export default function GsapTimelineWorkshop({level}:Props){
  const scope=useRef<HTMLDivElement>(null);
  const timeline=useRef<gsap.core.Timeline|null>(null);
  const [generation,setGeneration]=useState(0);
  const [progress,setProgress]=useState(0);
  const [paused,setPaused]=useState(false);
  const [reduce,setReduce]=useState(false);
  useEffect(()=>{
    const host=scope.current;if(!host)return;
    const query=window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync=()=>setReduce(query.matches);
    sync();query.addEventListener('change',sync);
    return()=>query.removeEventListener('change',sync);
  },[]);
  useEffect(()=>{
    const host=scope.current;if(!host)return;
    const context=gsap.context(()=>{
      gsap.set('.gsap-lab-item',{clearProps:'all'});
      if(reduce){setProgress(100);return;}
      const tl=gsap.timeline({paused:false,onUpdate:()=>setProgress(Math.round(tl.progress()*100))});
      tl.fromTo('.gsap-lab-item',
        {autoAlpha:0,y:level==='basic'?12:32},
        {autoAlpha:1,y:0,duration:.48,ease:'power2.out',stagger:level==='basic'?0:.12})
        .fromTo('.gsap-lab-detail',{autoAlpha:0},{autoAlpha:1,duration:.2},'-=.12');
      timeline.current=tl;setPaused(false);
    },host);
    return()=>{timeline.current=null;context.revert();};
  },[level,generation,reduce]);
  const pauseOrResume=()=>{
    const tl=timeline.current;if(!tl)return;
    if(tl.paused()){tl.play();setPaused(false);}else{tl.pause();setPaused(true);}
  };
  return <section ref={scope} aria-label="GSAP timeline 实战">
    <h2>{level==='basic'?'GSAP 缓动入场':level==='business'?'新闻卡片时间线':'动画生命周期与播放控制'}</h2>
    <p>每个示例使用独立 gsap.context 绑定自身DOM；卸载时 revert，避免动画修改其他实验。</p>
    <div className="demo-controls">
      <button type="button" onClick={()=>setGeneration(x=>x+1)}>重播动画</button>
      {level==='advanced'&&<>
        <button type="button" disabled={reduce} onClick={pauseOrResume}>{paused?'继续':'暂停'}</button>
        <button type="button" disabled={reduce} onClick={()=>timeline.current?.reverse()}>反向播放</button>
      </>}
    </div>
    {reduce&&<p role="status">系统启用减少动态效果：直接显示内容，不启动动画。</p>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(125px,1fr))',gap:12}}>
      {(level==='basic'?['最新进展','阅读精选']:['每日摘要','需要关注','收藏热点','后续行动']).map((name,index)=>
        <article className="gsap-lab-item" key={name}
          style={{border:'1px solid #acc9b7',padding:16,borderRadius:10,background:'#f4f8f1'}}>
          <small>模块 {index+1}</small><h3>{name}</h3><p>可用键盘正常浏览的内容</p>
        </article>)}
    </div>
    <p className="gsap-lab-detail">GSAP 通过目标元素样式推进，而不是每帧更新 React 状态；这里只在onUpdate更新进度展示。</p>
    <label>播放进度 <progress max={100} value={reduce?100:progress} style={{width:'100%'}}/></label>
  </section>;
}
