import {useEffect,useMemo,useRef,useState} from 'react';
import {Deck} from '@deck.gl/core';
import {ScatterplotLayer} from '@deck.gl/layers';
import {measuredDeckSize,needsDeckResize} from './deck-size';

type Level='basic'|'business'|'advanced';
type Location={id:string;name:string;position:[number,number];healthy:boolean;volume:number};
const SITES:Location[]=[
  {id:'b1',name:'北京',position:[116.4,39.9],healthy:true,volume:42},
  {id:'t1',name:'天津',position:[117.2,39.13],healthy:false,volume:31},
  {id:'sjz',name:'石家庄',position:[114.5,38.05],healthy:true,volume:24},
  {id:'ty',name:'太原',position:[112.55,37.87],healthy:true,volume:39},
];
function sample(seed:number):Location[]{
  return Array.from({length:Math.min(1200,seed)},(_,index)=>({
    id:'local-'+index,name:'样本 '+(index+1),
    position:[112.0+(index*97%1000)/180,36.5+(index*31%1000)/250],
    healthy:index%4!==0,volume:10+(index*13%90)
  }));
}
function layers(rows:Location[],size:number){
  return [new ScatterplotLayer<Location>({
    id:'library-sites',data:rows,getPosition:d=>d.position,
    getFillColor:d=>d.healthy?([32,129,103,225] as [number,number,number,number]):([196,125,51,225] as [number,number,number,number]),
    getRadius:d=>Math.max(5,Math.sqrt(d.volume)*size),
    radiusUnits:'pixels',radiusMinPixels:4,radiusMaxPixels:28,
    stroked:true,getLineColor:[255,255,255],lineWidthMinPixels:1,
    pickable:true,updateTriggers:{getRadius:size},
  })];
}
export default function DeckGlExample({level}:{level:Level}){
  const container=useRef<HTMLDivElement>(null);
  const deckRef=useRef<Deck|null>(null);
  const [error,setError]=useState('');
  const [ready,setReady]=useState(false);
  const [healthyOnly,setHealthyOnly]=useState(false);
  const [dense,setDense]=useState(false);
  const [radius,setRadius]=useState(1.5);
  const [picked,setPicked]=useState('');
  const data=useMemo(()=>level==='advanced'&&dense?[...SITES,...sample(1200)]:level==='basic'?SITES.slice(0,2):SITES,[level,dense]);
  const visible=useMemo(()=>data.filter(d=>!healthyOnly||d.healthy),[data,healthyOnly]);
  useEffect(()=>{
    const node=container.current;if(!node)return;
    const probe=document.createElement('canvas');
    const probeGl=probe.getContext('webgl2');
    if(!probeGl){setError('WebGL2不可用，改用下面的可访问数据表');return;}
    // Feature probing creates a real GPU context. Release it before opening Deck's context.
    probeGl.getExtension('WEBGL_lose_context')?.loseContext();
    let disposed=false;
    const initialSize=measuredDeckSize(node.clientWidth,node.clientHeight)??{width:1,height:1};
    let currentSize=initialSize;
    let deck:Deck;
    try{
      deck=new Deck({
        parent:node,...initialSize,
        initialViewState:{longitude:116.1,latitude:39,zoom:6,pitch:0,bearing:0},
        controller:true,layers:layers(SITES,1.5),
        getTooltip:info=>info.object&&typeof info.object.name==='string'?info.object.name:null,
        onClick:info=>{const item=info.object as Location|undefined;if(item)setPicked(item.id);},
        onError:cause=>{if(!disposed)setError(String(cause));},
      });
    }catch(cause){setError(cause instanceof Error?cause.message:'deck.gl 无法启动');return;}
    deckRef.current=deck;setReady(true);
    let frame=0;
    const observer=new ResizeObserver(()=>{
      cancelAnimationFrame(frame);
      frame=requestAnimationFrame(()=>{
        const nextSize=measuredDeckSize(node.clientWidth,node.clientHeight);
        if(deckRef.current===deck&&needsDeckResize(currentSize,nextSize)){
          currentSize=nextSize;
          deck.setProps(nextSize);
        }
      });
    });
    observer.observe(node);
    return()=>{
      disposed=true;
      observer.disconnect();cancelAnimationFrame(frame);
      deck.finalize();if(deckRef.current===deck)deckRef.current=null;
    };
  },[]);
  useEffect(()=>{deckRef.current?.setProps({layers:layers(visible,radius)});},[visible,radius]);
  return <section aria-label="deck.gl 实际GPU地理点层">
    <h2>{level==='basic'?'真实GPU地理点图层':level==='business'?'资讯来源地理监测':'大量点数据和资源回收'}</h2>
    <p>采用真实 Deck + ScatterplotLayer；没有地图瓦片、第三方地理编码、外部API或付费服务。</p>
    <div className="demo-controls">
      {level!=='basic'&&<label><input type="checkbox" checked={healthyOnly} onChange={e=>setHealthyOnly(e.target.checked)}/>仅看健康站点</label>}
      <label>半径倍数<input type="range" min="0.5" max="3" step="0.25" value={radius} onChange={e=>setRadius(Number(e.target.value))}/>{radius}</label>
      {level==='advanced'&&<><label><input type="checkbox" checked={dense} onChange={e=>setDense(e.target.checked)}/>添加1200个本地数据点</label><button type="button" onClick={()=>{setDense(false);setHealthyOnly(false);setRadius(1.5);}}>重置数据</button></>}
    </div>
    <div ref={container} role="img" aria-label="GPU经纬度点图；下方数据表可供键盘和读屏使用" style={{width:'100%',height:330,position:'relative',background:'#edf2ec',borderRadius:8,overflow:'hidden'}}/>
    {error&&<p role="alert">{error}</p>}
    <p role="status">运行状态：{error?'GPU不可用':ready?'Deck已初始化':'初始化中'}；可见点：{visible.length}；拾取：{visible.find(item=>item.id===picked)?.name||'未选择'}。</p>
    <table><caption>选定的资讯地理点（全量数量见上方）</caption><thead><tr><th>名称</th><th>状态</th><th>数量</th><th>操作</th></tr></thead>
      <tbody>{visible.slice(0,12).map(item=><tr key={item.id}><th scope="row">{item.name}</th><td>{item.healthy?'健康':'暂停'}</td><td>{item.volume}</td><td><button type="button" aria-pressed={picked===item.id} onClick={()=>setPicked(item.id)}>选择</button></td></tr>)}</tbody></table>
    <p>在数据变化时调用 deck.setProps；切换Tab或卸载调用 deck.finalize，而不是仅隐藏Canvas。</p>
  </section>;
}
