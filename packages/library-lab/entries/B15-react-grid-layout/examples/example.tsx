import GridLayout,{useContainerWidth,verticalCompactor,type Layout} from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {useMemo,useState} from 'react';

type Level='basic'|'business'|'advanced';
const defaults:Layout=[
  {i:'headline',x:0,y:0,w:4,h:2,minW:2,maxW:8},
  {i:'feed',x:4,y:0,w:4,h:2,minW:2,maxW:8},
  {i:'queue',x:8,y:0,w:4,h:2,minW:2,maxW:8}
];
const labels:Record<string,string>={
  headline:'新闻总览',feed:'订阅趋势',queue:'待审列表'
};
function cloneLayout(layout:Layout):Layout{return layout.map(item=>({...item}));}
function normalizeLayout(layout:Layout,cols:number):Layout{
  return layout.map(item=>{
    const w=Math.max(1,Math.min(cols,item.w));
    return {...item,w,x:Math.max(0,Math.min(item.x,cols-w))};
  });
}
export default function GridExample({level}:{level:Level}){
  const [layout,setLayout]=useState<Layout>(()=>cloneLayout(defaults));
  const [locked,setLocked]=useState(false);
  const [changes,setChanges]=useState(0);
  const {width,containerRef,mounted}=useContainerWidth();
  const cols=width<640?6:12;
  const visibleLayout=useMemo(()=>normalizeLayout(layout,cols).map(item=>
    item.i==='headline'&&level==='advanced'?{...item,static:locked}:item),[layout,cols,level,locked]);
  const interactive=level!=='basic';
  function onChange(next:Layout){
    const nextData=cloneLayout(next);
    if(JSON.stringify(nextData)===JSON.stringify(visibleLayout))return;
    setLayout(nextData);
    setChanges(n=>n+1);
  }
  function moveByKeyboard(id:string,direction:-1|1){
    setLayout(old=>old.map(item=>
      item.i===id&&!item.static?{...item,x:Math.max(0,Math.min(cols-item.w,item.x+direction))}:item
    ));
    setChanges(n=>n+1);
  }
  return <section aria-label="React Grid Layout 实际看板">
    <h2>{level==='basic'?'静态十二列布局':level==='business'?'可编辑阅读仪表盘':'锁定、恢复与键盘替代'}</h2>
    <p>真实 react-grid-layout v2 控制式布局。容器实测 {Math.round(width)}px / {cols} 列，变更记录 {changes} 次。</p>
    <div className="demo-controls">
      <button type="button" onClick={()=>{setLayout(cloneLayout(defaults));setChanges(n=>n+1);}}>重置布局</button>
      {level==='advanced'&&<label><input type="checkbox" checked={locked} onChange={event=>setLocked(event.target.checked)}/>锁定新闻总览</label>}
    </div>
    <div ref={containerRef} style={{minHeight:270,minWidth:260,background:'#f2f7f1',borderRadius:8,padding:4}}>
      {mounted&&width>0?<GridLayout
        width={width}
        layout={visibleLayout}
        onLayoutChange={onChange}
        gridConfig={{cols,rowHeight:78,margin:[10,10]}}
        dragConfig={{enabled:interactive,handle:'.lab-grid-handle',bounded:true}}
        resizeConfig={{enabled:interactive,handles:['se']}}
        compactor={verticalCompactor}
      >
        {visibleLayout.map(item=><div key={item.i} style={{borderRadius:9,background:'#fff',border:'1px solid #c4d8c7',padding:12,overflow:'hidden'}}>
          <div className="lab-grid-handle" style={{cursor:interactive&&!item.static?'grab':'default',fontWeight:650,borderBottom:'1px solid #e5eae4',paddingBottom:7}}>
            {labels[item.i]} {item.static?'🔒':''}
          </div>
          <p style={{fontSize:12,margin:'8px 0'}}>位置 {item.x}/{item.y}；占用 {item.w}×{item.h}</p>
          <div style={{display:'flex',gap:4}}>
            <button className="lab-grid-control" type="button" disabled={!interactive||item.static} onClick={()=>moveByKeyboard(item.i,-1)} aria-label={'向左移动'+labels[item.i]}>←</button>
            <button className="lab-grid-control" type="button" disabled={!interactive||item.static} onClick={()=>moveByKeyboard(item.i,1)} aria-label={'向右移动'+labels[item.i]}>→</button>
          </div>
        </div>)}
      </GridLayout>:<p role="status">正在测量容器宽度…</p>}
    </div>
    <h3>可序列化的结构化布局</h3>
    <pre style={{maxHeight:230,overflow:'auto'}}><code>{JSON.stringify(visibleLayout.map(({i,x,y,w,h,static:fixed})=>({i,x,y,w,h,static:!!fixed})),null,2)}</code></pre>
    <p>键盘按钮是拖拽的替代输入。示例不自动持久化 localStorage，也不写其他库数据。</p>
  </section>;
}
