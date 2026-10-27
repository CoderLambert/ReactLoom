import {useEffect,useId,useRef,useState} from 'react';
import {draggable,dropTargetForElements,monitorForElements} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import {combine} from '@atlaskit/pragmatic-drag-and-drop/combine';
import {canReorderAroundPinned} from './pinned-order';

type Level='basic'|'business'|'advanced';
type Item={id:string;title:string;locked?:boolean};
const INITIAL:Item[]=[
  {id:'ai',title:'AI / 模型'}, {id:'frontend',title:'前端工程'},
  {id:'opensource',title:'开源趋势'},{id:'global',title:'国际资讯',locked:true},
  {id:'deep',title:'深度阅读'},
];
function ItemRow({item,scope,move,index,canMoveUp,canMoveDown}:{item:Item;scope:string;move:(id:string,offset:number)=>void;index:number;canMoveUp:boolean;canMoveDown:boolean}){
  const ref=useRef<HTMLLIElement>(null);
  const handleRef=useRef<HTMLSpanElement>(null);
  const [dragging,setDragging]=useState(false);
  useEffect(()=>{
    const element=ref.current,dragHandle=handleRef.current;if(!element||!dragHandle||item.locked)return;
    return combine(
      draggable({
        element,dragHandle,
        getInitialData:()=>({scope,type:'reactloom-entry',id:item.id}),
        onDragStart:()=>setDragging(true),
        onDrop:()=>setDragging(false),
      }),
      dropTargetForElements({
        element,
        getData:()=>({scope,type:'reactloom-target',id:item.id}),
        canDrop:({source})=>source.data.scope===scope&&source.data.type==='reactloom-entry',
      }),
    );
  },[item.id,item.locked,scope]);
  return <li ref={ref} data-state={dragging?'dragging':'idle'} style={{padding:12,marginBottom:8,border:'1px solid #bac9bc',borderRadius:8,background:dragging?'#e2efe8':'white',display:'flex',alignItems:'center',gap:9}}>
    <span ref={handleRef} aria-hidden="true" title="仅指针拖动，键盘请使用上下按钮"
      style={{cursor:item.locked?'not-allowed':'grab',touchAction:'none',minWidth:32,minHeight:32,display:'inline-flex',alignItems:'center',justifyContent:'center'}}>⠿</span>
    <span style={{flex:1}}>{index+1}. {item.title}</span>
    {item.locked&&<span>🔒固定</span>}
    <button type="button" aria-label={'上移 '+item.title} disabled={!canMoveUp} onClick={()=>move(item.id,-1)}>↑</button>
    <button type="button" aria-label={'下移 '+item.title} disabled={!canMoveDown} onClick={()=>move(item.id,1)}>↓</button>
  </li>;
}
export default function PragmaticExample({level}:{level:Level}){
  const scope=useId();
  const [items,setItems]=useState<Item[]>(INITIAL);
  const itemsRef=useRef<Item[]>(INITIAL);
  const undoRef=useRef<Item[]|null>(null);
  const [undoable,setUndoable]=useState(false);
  const [status,setStatus]=useState('拖动项目到另一个未锁定项目，或用上下按钮。');
  const shown=level==='basic'?items.slice(0,3):items;
  const shownRef=useRef(shown);shownRef.current=shown;
  function commit(next:Item[],message:string){
    undoRef.current=itemsRef.current;setUndoable(true);
    itemsRef.current=next;setItems(next);setStatus(message);
  }
  function reorder(sourceId:string,targetId:string){
    const all=itemsRef.current;
    const visible=level==='basic'?all.slice(0,3):all;
    const source=visible.findIndex(x=>x.id===sourceId),target=visible.findIndex(x=>x.id===targetId);
    if(source<0||target<0||source===target)return;
    if(!canReorderAroundPinned(visible,source,target)){setStatus('固定频道不可移动，也不能被跨越；顺序未改变');return;}
    const reordered=visible.slice();const [value]=reordered.splice(source,1);
    reordered.splice(target,0,value);
    commit(level==='basic'?[...reordered,...all.slice(3)]:reordered,visible[source].title+' → 第'+(target+1)+'位');
  }
  const reorderRef=useRef(reorder);reorderRef.current=reorder;
  useEffect(()=>{
    const detach=monitorForElements({
      canMonitor:({source})=>source.data.scope===scope&&source.data.type==='reactloom-entry',
      onDrop:({source,location})=>{
        const target=location.current.dropTargets[0];
        if(target?.data.scope!==scope||target.data.type!=='reactloom-target')return;
        const from=source.data.id,to=target.data.id;
        if(typeof from==='string'&&typeof to==='string')reorderRef.current(from,to);
      },
    });
    return detach;
  },[scope]);
  function move(id:string,offset:number){
    const source=shown.findIndex(x=>x.id===id),target=source+offset;
    if(source<0||target<0||target>=shown.length)return;
    reorder(id,shown[target].id);
  }
  function undo(){
    if(!undoRef.current)return;
    const old=undoRef.current;itemsRef.current=old;setItems(old);
    undoRef.current=null;setUndoable(false);setStatus('已撤销上次排序');
  }
  return <section aria-label="Pragmatic drag and drop 实践">
    <h2>{level==='basic'?'原生拖放':level==='business'?'新闻频道排序':'锁定、撤销与隔离事件监听'}</h2>
    <p>真实 Atlassian draggable/dropTargetForElements/monitorForElements；每个列表使用独立scope，避免拖进其他示例。</p>
    <ol style={{listStyle:'none',padding:0}}>{shown.map((item,index)=><ItemRow key={item.id} item={item} scope={scope} move={move} index={index}
      canMoveUp={index>0&&canReorderAroundPinned(shown,index,index-1)}
      canMoveDown={index<shown.length-1&&canReorderAroundPinned(shown,index,index+1)}/>)}</ol>
    {level==='advanced'&&<div className="demo-controls">
      <button type="button" disabled={!undoable} onClick={undo}>撤销排序</button>
      <button type="button" onClick={()=>commit(INITIAL,'已恢复原始次序')}>重置频道</button>
    </div>}
    <p role="status">{status}</p>
    <output className="demo-output">{shown.map(x=>x.id).join(' → ')}</output>
    <p>原生Drag需指针设备，键盘用户使用上下按钮；这不是由库自动提供的完整拖拽无障碍能力。</p>
  </section>;
}
