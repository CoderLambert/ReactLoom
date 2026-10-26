import {Graph} from '@antv/g6';
import {useEffect,useRef,useState} from 'react';

type Level='basic'|'business'|'advanced';
type Step={id:string;label:string};
const core:Step[]=[
  {id:'source',label:'RSS来源'},
  {id:'parse',label:'正文解析'},
  {id:'index',label:'内容索引'}
];

function dataset(level:Level,extended:boolean){
  const nodes:Step[]=extended&&level!=='basic'?
    [core[0],core[1],{id:'review',label:'质量审校'},core[2]]:core;
  const positions=nodes.map((item,index)=>({
    id:item.id,
    data:{label:item.label},
    style:{x:100+index*142,y:index%2?160:110,labelText:item.label}
  }));
  const edges=nodes.slice(1).map((item,index)=>({
    id:'edge-'+nodes[index].id+'-'+item.id,source:nodes[index].id,target:item.id
  }));
  return {nodes:positions,edges};
}

export default function G6Example({level}:{level:Level}){
  const hostRef=useRef<HTMLDivElement|null>(null);
  const [extended,setExtended]=useState(level!=='basic');
  const [revision,setRevision]=useState(0);
  const [status,setStatus]=useState('尚未渲染');
  const data=dataset(level,extended);

  useEffect(()=>{
    const host=hostRef.current;
    if(!host)return;
    let disposed=false;
    setStatus('正在建立真实 G6 Graph');
    const graph=new Graph({
      container:host,
      width:Math.max(360,Math.floor(host.getBoundingClientRect().width)),
      height:330,
      data:dataset(level,extended),
      node:{type:'circle',style:{size:42,fill:'#d9e7df',stroke:'#326b57',lineWidth:2}},
      edge:{type:'line',style:{stroke:'#6c9380',lineWidth:2,endArrow:true}},
      behaviors:['drag-canvas','zoom-canvas']
    });
    const observer=new ResizeObserver(entries=>{
      if(disposed)return;
      const width=entries[0]?.contentRect.width??0;
      if(width>0)graph.setSize(Math.max(360,Math.floor(width)),330);
    });
    // StrictMode also runs setup/cleanup twice; each effect owns exactly one graph.
    void graph.render().then(()=>{
      if(disposed)return;
      observer.observe(host);
      setStatus('已渲染：拖动画布、滚轮缩放，或调整窗口宽度');
    }).catch(error=>{
      if(!disposed)setStatus('Graph 渲染失败：'+String(error));
    });
    return()=>{
      disposed=true;
      observer.disconnect();
      graph.destroy();
    };
  },[level,extended,revision]);

  return <section aria-label="AntV G6 实际图谱示例">
    <h2>{level==='basic'?'最小数据依赖图':level==='business'?'NewsHub 内容处理拓扑':'动态拓扑与资源释放'}</h2>
    <p>节点与边是本地教学数据。真实调用 @antv/g6 Graph 的构造、render、setSize 和 destroy。</p>
    <div className="demo-controls">
      {level!=='basic'&&<label><input type="checkbox" checked={extended} onChange={event=>setExtended(event.target.checked)}/>启用审校节点</label>}
      {level==='advanced'&&<button type="button" onClick={()=>setRevision(value=>value+1)}>重新创建图实例</button>}
    </div>
    <p role="status">{status}</p>
    <div ref={hostRef} style={{height:330,width:'100%',background:'#f7faf6',border:'1px solid #d8e4d9',borderRadius:10}} aria-label="拖动及缩放的关系图画布"/>
    <h3>图数据的无障碍文本等价物</h3>
    <ol>{data.nodes.map(node=><li key={node.id}>{node.data.label}（{node.id}）</li>)}</ol>
    <p>有向边：{data.edges.map(edge=>edge.source+' → '+edge.target).join('、')}</p>
    {level==='advanced'&&<p>触发重建应先 destroy 旧实例。观察 ResizeObserver 是否断开，不能使用旧 Graph 操作已销毁的画布。</p>}
  </section>;
}
