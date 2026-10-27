import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {shouldAnimate} from './animation-policy';

type Level='basic'|'business'|'advanced';
type Runtime={renderer:THREE.WebGLRenderer;scene:THREE.Scene;camera:THREE.PerspectiveCamera;mesh:THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>;draw:(time:number)=>void;frame:()=>void;geometry:THREE.BufferGeometry;syncAnimation:()=>void};
function buildGeometry(shape:'box'|'sphere') {
  return shape==='sphere'?new THREE.SphereGeometry(1.05,32,16):new THREE.BoxGeometry(1.65,1.65,1.65);
}
export default function ThreeExample({level}:{level:Level}){
  const host=useRef<HTMLDivElement>(null);
  const runtime=useRef<Runtime|null>(null);
  const [shape,setShape]=useState<'box'|'sphere'>('box');
  const [speed,setSpeed]=useState(0.7);
  const [playing,setPlaying]=useState(true);
  const [reducedMotion,setReducedMotion]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [overrideMotion,setOverrideMotion]=useState(false);
  const [visible,setVisible]=useState(()=>!document.hidden);
  const [error,setError]=useState('');
  const [color,setColor]=useState('#227b68');
  const playingRef=useRef(playing);
  const reducedRef=useRef(reducedMotion);
  const overrideRef=useRef(overrideMotion);
  const currentSpeed=useRef(speed);
  useEffect(()=>{currentSpeed.current=speed;},[speed]);
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange=()=>setReducedMotion(media.matches);
    media.addEventListener('change',onChange);
    return()=>media.removeEventListener('change',onChange);
  },[]);
  useEffect(()=>{
    const container=host.current;
    if(!container)return;
    const scene=new THREE.Scene();
    scene.background=new THREE.Color('#eaf0e9');
    const camera=new THREE.PerspectiveCamera(50,1,0.1,100);
    camera.position.set(0,0,5);
    let renderer:THREE.WebGLRenderer;
    try {renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});}
    catch(cause){setError(cause instanceof Error?cause.message:'WebGL 无法初始化');return;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    renderer.domElement.style.cssText='width:100%;height:100%;display:block;';
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    const geometry=buildGeometry('box');
    const material=new THREE.MeshStandardMaterial({color:'#227b68',roughness:0.5,metalness:0.18});
    const mesh=new THREE.Mesh(geometry,material);
    scene.add(mesh);
    scene.add(new THREE.HemisphereLight(0xffffff,0x5a695f,2));
    const light=new THREE.DirectionalLight(0xffffff,2.5);
    light.position.set(3,4,5);scene.add(light);
    let last=0;
    const frame=()=>renderer.render(scene,camera);
    const draw=(time:number)=>{
      const delta=last?Math.min((time-last)/1000,0.1):0;
      last=time;mesh.rotation.y+=delta*currentSpeed.current;
      mesh.rotation.x+=delta*currentSpeed.current*0.45;
      frame();
    };
    const data:Runtime={renderer,scene,camera,mesh,draw,frame,geometry,syncAnimation:()=>{}};
    runtime.current=data;
    const resize=()=>{
      if(runtime.current!==data)return;
      const width=Math.max(1,container.clientWidth);
      const height=Math.max(1,container.clientHeight);
      camera.aspect=width/height;camera.updateProjectionMatrix();
      renderer.setSize(width,height,false);frame();
    };
    const observer=new ResizeObserver(resize);
    observer.observe(container);resize();
    const syncAnimation=()=>{
      if(runtime.current!==data)return;
      const active=shouldAnimate({
        playing:playingRef.current,visible:!document.hidden,
        reducedMotion:reducedRef.current,overrideMotion:overrideRef.current,
      });
      renderer.setAnimationLoop(active?draw:null);
      if(!active)frame();
      setVisible(!document.hidden);
    };
    data.syncAnimation=syncAnimation;
    document.addEventListener('visibilitychange',syncAnimation);
    syncAnimation();
    return()=>{
      renderer.setAnimationLoop(null);
      observer.disconnect();
      document.removeEventListener('visibilitychange',syncAnimation);
      scene.remove(mesh);mesh.geometry.dispose();material.dispose();
      renderer.dispose();renderer.forceContextLoss();
      renderer.domElement.remove();
      if(runtime.current===data)runtime.current=null;
    };
  },[]);
  useEffect(()=>{
    playingRef.current=playing;
    reducedRef.current=reducedMotion;
    overrideRef.current=overrideMotion;
    runtime.current?.syncAnimation();
  },[playing,reducedMotion,overrideMotion]);
  useEffect(()=>{
    const r=runtime.current;if(!r)return;
    if(r.mesh.geometry!==r.geometry)r.geometry=r.mesh.geometry;
    const next=buildGeometry(level==='advanced'?shape:'box');
    const previous=r.mesh.geometry;r.mesh.geometry=next;r.geometry=next;
    previous.dispose();
    r.mesh.material.color.set(color);
    if(!shouldAnimate({playing,visible:!document.hidden,reducedMotion,overrideMotion}))r.frame();
  },[shape,color,level,playing,reducedMotion,overrideMotion]);
  return <section aria-label="Three.js 真实三维场景">
    <h2>{level==='basic'?'真实3D网格':level==='business'?'新闻产品状态模型':'GPU资源、暂停与网格替换'}</h2>
    <p>真实 Three.js WebGLRenderer + Scene + Mesh；没有远程模型或材质请求。</p>
    <div className="demo-controls">
      <label>转速 <input type="range" min="0" max="3" step="0.1" value={speed} onChange={e=>setSpeed(Number(e.target.value))}/>{speed.toFixed(1)}</label>
      <label>材质颜色 <select value={color} onChange={e=>setColor(e.target.value)}><option value="#227b68">绿色</option><option value="#c07b37">橙色</option><option value="#4b63aa">蓝色</option></select></label>
      {level==='advanced'&&<>
        <label>几何体<select value={shape} onChange={e=>setShape(e.target.value as 'box'|'sphere')}><option value="box">盒体</option><option value="sphere">球体</option></select></label>
        <button type="button" aria-pressed={playing} onClick={()=>setPlaying(v=>!v)}>{playing?'暂停动画':'继续动画'}</button>
        <label><input type="checkbox" checked={overrideMotion} onChange={e=>setOverrideMotion(e.target.checked)}/>允许显式覆盖减少动态偏好</label>
      </>}
    </div>
    <div ref={host} role="img" aria-label="可旋转的三维几何体；下方提供当前参数"
      style={{height:280,background:'#eaf0e9',borderRadius:10,overflow:'hidden'}}/>
    {error&&<p role="alert">WebGL不可用：{error}。可从下方读取参数。</p>}
    <p role="status">网格：{level==='advanced'?shape:'box'}；颜色：{color}；角速度：{speed}；动画：{shouldAnimate({playing,visible,reducedMotion,overrideMotion})?'运行':'暂停'}；减少动态：{reducedMotion?'开启':'关闭'}。</p>
    <p>窗口和容器变化自动resize；后台和系统减少动态时停止动画循环，保留静态帧；仅高级操作可显式覆盖减少动态。退出Tab后停止动画、断开监听并dispose几何体、材质和渲染器。</p>
  </section>;
}
