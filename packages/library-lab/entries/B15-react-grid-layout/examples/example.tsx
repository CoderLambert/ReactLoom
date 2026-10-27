import GridLayout,{useContainerWidth,verticalCompactor,type Layout} from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {useMemo,useState} from 'react';
import {initialNarrowCells,keyboardMove,keyboardResize,projectCells,sameGeometry} from './layout-policy';

type Level='basic'|'business'|'advanced';
type Breakpoint='wide'|'narrow';
const defaults:Layout=[
  {i:'headline',x:0,y:0,w:4,h:2,minW:2,maxW:8},
  {i:'feed',x:4,y:0,w:4,h:2,minW:2,maxW:8},
  {i:'queue',x:8,y:0,w:4,h:2,minW:2,maxW:8}
];
const labels:Record<string,string>={
  headline:'新闻总览',feed:'订阅趋势',queue:'待审列表'
};
type LayoutModel={wide:Layout;narrow:Layout;changes:number};
function initialModel():LayoutModel{
  return {wide:defaults.map(item=>({...item})),narrow:initialNarrowCells(defaults),changes:0};
}
export default function GridExample({level}:{level:Level}){
  const [model,setModel]=useState<LayoutModel>(initialModel);
  const [locked,setLocked]=useState(false);
  const {width,containerRef,mounted}=useContainerWidth();
  const breakpoint:Breakpoint=width<640?'narrow':'wide';
  const cols=breakpoint==='narrow'?6:12;
  const frozen=level==='advanced'&&locked?['headline']:[];
  const visibleLayout=useMemo(()=>projectCells(model[breakpoint],cols).map(item=>({
    ...item,static:level==='advanced'&&locked&&item.i==='headline'
  })),[model,breakpoint,cols,level,locked]);
  const interactive=level!=='basic';

  function onChange(next:Layout){
    setModel(previous=>{
      const previousCells=projectCells(previous[breakpoint],cols);
      const clean=next.map(item=>{
        const previousLocked=frozen.includes(item.i)?
          previousCells.find(cell=>cell.i===item.i):undefined;
        return {...item,
          x:previousLocked?.x??item.x,
          y:previousLocked?.y??item.y,
          w:previousLocked?.w??item.w,
          h:previousLocked?.h??item.h,
          static:false};
      });
      if(sameGeometry(previous[breakpoint],clean))return previous;
      return {...previous,[breakpoint]:clean,changes:previous.changes+1};
    });
  }
  function moveByKeyboard(id:string,direction:-1|1){
    setModel(previous=>{
      const cells=projectCells(previous[breakpoint],cols);
      const next=keyboardMove(cells,id,direction,cols,frozen);
      if(next===cells||sameGeometry(cells,next))return previous;
      return {...previous,[breakpoint]:next.map(item=>({...item,static:false})),changes:previous.changes+1};
    });
  }
  function resizeByKeyboard(id:string,direction:-1|1){
    setModel(previous=>{
      const cells=projectCells(previous[breakpoint],cols);
      const next=keyboardResize(cells,id,direction,cols,frozen);
      if(next===cells||sameGeometry(cells,next))return previous;
      return {...previous,[breakpoint]:next.map(item=>({...item,static:false})),changes:previous.changes+1};
    });
  }
  function reset(){
    setLocked(false);
    setModel(previous=>({...initialModel(),changes:previous.changes+1}));
  }
  return <section aria-label="React Grid Layout 实际看板">
    <h2>{level==='basic'?'静态十二列布局':level==='business'?'可编辑阅读仪表盘':'锁定、恢复与键盘替代'}</h2>
    <p>真实 react-grid-layout v2 控制式布局。容器实测 {Math.round(width)}px / {cols} 列，变更记录 {model.changes} 次；宽窄布局独立存储。</p>
    <div className="demo-controls">
      <button type="button" onClick={reset}>重置宽窄布局</button>
      {level==='advanced'&&<label><input type="checkbox" checked={locked} onChange={event=>setLocked(event.target.checked)}/>锁定新闻总览</label>}
    </div>
    <div ref={containerRef} style={{minHeight:270,minWidth:0,background:'#f2f7f1',borderRadius:8,padding:4}}>
      {mounted&&width>0?<GridLayout
        key={breakpoint}
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
          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
            <button className="lab-grid-control" type="button" disabled={!interactive||keyboardMove(visibleLayout,item.i,-1,cols,frozen)===visibleLayout} onClick={()=>moveByKeyboard(item.i,-1)} aria-label={(cols===6?'向上移动':'向左移动')+labels[item.i]}>{cols===6?'↑':'←'}</button>
            <button className="lab-grid-control" type="button" disabled={!interactive||keyboardMove(visibleLayout,item.i,1,cols,frozen)===visibleLayout} onClick={()=>moveByKeyboard(item.i,1)} aria-label={(cols===6?'向下移动':'向右移动')+labels[item.i]}>{cols===6?'↓':'→'}</button>
            <button className="lab-grid-control" type="button" disabled={!interactive||keyboardResize(visibleLayout,item.i,-1,cols,frozen)===visibleLayout} onClick={()=>resizeByKeyboard(item.i,-1)} aria-label={'缩窄'+labels[item.i]}>−宽</button>
            <button className="lab-grid-control" type="button" disabled={!interactive||keyboardResize(visibleLayout,item.i,1,cols,frozen)===visibleLayout} onClick={()=>resizeByKeyboard(item.i,1)} aria-label={'加宽'+labels[item.i]}>＋宽</button>
          </div>
        </div>)}
      </GridLayout>:<p role="status">正在测量容器宽度…</p>}
    </div>
    <h3>可序列化的结构化布局</h3>
    <pre style={{maxHeight:230,overflow:'auto'}}><code>{JSON.stringify(visibleLayout.map(({i,x,y,w,h,static:fixed})=>({i,x,y,w,h,static:!!fixed})),null,2)}</code></pre>
    <p>宽屏键盘左右移动，窄屏键盘上下换位；锁定项不可跨越。宽窄布局互不覆盖、不持久化 localStorage，按钮不作为拖拽句柄。</p>
  </section>;
}
