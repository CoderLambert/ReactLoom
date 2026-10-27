import {useEffect,useRef,useState} from 'react';
import {Canvas,useFrame} from '@react-three/fiber';
import type {Mesh} from 'three';
import {boundedFrameDelta, shouldRunFrames} from './frame-policy';

type Level='basic'|'business'|'advanced';
type Shape='box'|'sphere';
function useReducedMotion(){
  const [reduced,setReduced]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setReduced(media.matches);media.addEventListener('change',change);return()=>media.removeEventListener('change',change);},[]);
  return reduced;
}
function useDocumentVisibility(){
  const [visible,setVisible]=useState(()=>
    typeof document==='undefined'||document.visibilityState==='visible');
  useEffect(()=>{
    const change=()=>setVisible(document.visibilityState==='visible');
    change();
    document.addEventListener('visibilitychange',change);
    return()=>document.removeEventListener('visibilitychange',change);
  },[]);
  return visible;
}
function ObjectMesh({shape,color,speed,paused,onSelect}:{shape:Shape;color:string;speed:number;paused:boolean;onSelect:()=>void}){
  const mesh=useRef<Mesh>(null);
  const [hover,setHover]=useState(false);
  useFrame((_state,delta)=>{
    if(paused||!mesh.current)return;
    const safeDelta=boundedFrameDelta(delta);
    mesh.current.rotation.y+=safeDelta*speed;
    mesh.current.rotation.x+=safeDelta*speed*0.25;
  });
  return <mesh ref={mesh} rotation={[0.15,0.2,0]} onClick={onSelect}
      onPointerOver={()=>setHover(true)} onPointerOut={()=>setHover(false)} scale={hover?1.1:1}>
    {shape==='box'?<boxGeometry args={[1.7,1.7,1.7]}/>:<sphereGeometry args={[1,32,20]}/>}
    <meshStandardMaterial color={color} roughness={0.48} metalness={0.16}/>
  </mesh>;
}
export default function FiberExample({level}:{level:Level}){
  const reduced=useReducedMotion();
  const visible=useDocumentVisibility();
  const [paused,setPaused]=useState(false);
  const [speed,setSpeed]=useState(0.9);
  const [shape,setShape]=useState<Shape>('box');
  const [active,setActive]=useState(false);
  const [sceneKey,setSceneKey]=useState(0);
  const running=shouldRunFrames({paused,reducedMotion:reduced,visible,speed});
  const effectivePaused=!running;
  return <section aria-label="React Three Fiber 实战">
    <h2>{level==='basic'?'JSX驱动三维场景':level==='business'?'新闻业务3D状态切换':'帧预算、减少动画和恢复'}</h2>
    <p>真实 @react-three/fiber Canvas / useFrame；数据状态由React管理，三维对象由Fiber协调，不自己创建全局Renderer。</p>
    <div className="demo-controls">
      <label>角速度 <input type="range" min="0" max="2" step="0.1" value={speed} onChange={e=>setSpeed(Number(e.target.value))}/>{speed.toFixed(1)}</label>
      <button type="button" aria-pressed={active} onClick={()=>setActive(v=>!v)}>{active?'设为未处理':'设为已处理'}</button>
      {level==='advanced'&&<>
        <label>几何体<select value={shape} onChange={e=>setShape(e.target.value as Shape)}><option value="box">盒体</option><option value="sphere">球体</option></select></label>
        <button type="button" aria-pressed={paused} onClick={()=>setPaused(v=>!v)}>{paused?'继续':'暂停'}</button>
        <button type="button" onClick={()=>{setSceneKey(k=>k+1);setActive(false);setPaused(false);}}>重新挂载场景</button>
      </>}
    </div>
    <div style={{height:300,background:'#eaf0e9',borderRadius:9}}>
      <Canvas key={sceneKey} frameloop={running?'always':'demand'} dpr={[1,1.5]}
        gl={{antialias:true,powerPreference:'low-power'}}
        camera={{position:[0,0,5],fov:50}}
        fallback={<p role="alert">不支持WebGL，下面有可访问的场景状态文本。</p>}>
        <color attach="background" args={['#eaf0e9']}/>
        <ambientLight intensity={1.3}/>
        <directionalLight intensity={2.5} position={[3,3,4]}/>
        <ObjectMesh shape={level==='advanced'?shape:'box'} speed={speed} paused={effectivePaused}
          color={active?'#c47b37':'#267c6b'} onSelect={()=>setActive(v=>!v)}/>
      </Canvas>
    </div>
    <p role="status">模型：{level==='advanced'?shape:'box'}；处理状态：{active?'已处理':'未处理'}；动画：{effectivePaused?'暂停（含系统减少动画）':'运行'}。</p>
    <p>所有层级均提供HTML键盘按钮。离开前台、停止转动或开启系统减动时切为按需渲染；React负责状态，useFrame仅修改Mesh transform。</p>
  </section>;
}
