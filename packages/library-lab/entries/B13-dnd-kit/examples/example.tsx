import {useState} from 'react';
import {DndContext,KeyboardSensor,PointerSensor,closestCenter,useSensor,useSensors,type DragEndEvent} from '@dnd-kit/core';
import {SortableContext,arrayMove,sortableKeyboardCoordinates,useSortable,verticalListSortingStrategy} from '@dnd-kit/sortable';
type Props={level:'basic'|'business'|'advanced'};
type Item={id:string;title:string;locked?:boolean};
const INITIAL:Item[]=[
  {id:'tech',title:'技术快讯'},{id:'ai',title:'AI 新模型'},
  {id:'oss',title:'开源趋势'},{id:'news',title:'国际资讯',locked:true},
  {id:'read',title:'深度阅读'},{id:'later',title:'稍后阅读'},
];
function SortableRow({item,index,total,move,lockable}:{item:Item;index:number;total:number;move:(id:string,direction:number)=>void;lockable:boolean}){
  const {attributes,listeners,setNodeRef,setActivatorNodeRef,transform,transition,isDragging}=useSortable({id:item.id,disabled:item.locked});
  const style:React.CSSProperties={
    transform:transform?'translate3d('+transform.x+'px,'+transform.y+'px,0) scale('+transform.scaleX+','+transform.scaleY+')':undefined,
    transition,opacity:isDragging?0.45:1,display:'flex',alignItems:'center',gap:10,padding:12,
    border:'1px solid #b5ccbd',borderRadius:8,background:'white',marginBottom:8,
  };
  return <li ref={setNodeRef} style={style}>
    <span style={{color:'#6a7770'}}>{index+1}.</span>
    <button ref={setActivatorNodeRef} type="button" disabled={item.locked}
      {...attributes} {...listeners} aria-label={'拖动 '+item.title}
      style={{cursor:item.locked?'not-allowed':'grab',touchAction:'none'}}>⠿</button>
    <span style={{flex:1}}>{item.title}</span>
    {item.locked&&<span aria-label="锁定">🔒</span>}
    <button type="button" aria-label={'上移 '+item.title} disabled={item.locked||index===0}
      onClick={()=>move(item.id,-1)}>↑</button>
    <button type="button" aria-label={'下移 '+item.title} disabled={item.locked||index===total-1}
      onClick={()=>move(item.id,1)}>↓</button>
    {lockable&&<small>{item.locked?'不可拖动':'可移动'}</small>}
  </li>;
}
export default function DndKitWorkshop({level}:Props){
  const [items,setItems]=useState<Item[]>(INITIAL);
  const [previous,setPrevious]=useState<Item[]|null>(null);
  const [message,setMessage]=useState('使用拖动手柄或上下按钮调整顺序');
  const visible=level==='basic'?items.slice(0,3):items;
  const sensors=useSensors(
    useSensor(PointerSensor,{activationConstraint:{distance:6}}),
    useSensor(KeyboardSensor,{coordinateGetter:sortableKeyboardCoordinates})
  );
  function commit(next:Item[],note:string){setPrevious(items);setItems(next);setMessage(note);}
  function reorder(activeId:string,overId:string){
    const start=visible.findIndex(item=>item.id===activeId);
    const end=visible.findIndex(item=>item.id===overId);
    if(start<0||end<0||start===end)return;
    if(visible[start].locked||visible[end].locked){setMessage('锁定条目不能移动，也不能与其他条目交换');return;}
    const moved=arrayMove(visible,start,end);
    commit(level==='basic'?[...moved,...items.slice(3)]:moved,'已调整 '+visible[start].title+' 的优先级');
  }
  function handleEnd(event:DragEndEvent){
    if(event.over)reorder(String(event.active.id),String(event.over.id));
  }
  function move(id:string,direction:number){
    const idx=visible.findIndex(item=>item.id===id),next=idx+direction;
    if(idx<0||next<0||next>=visible.length)return;
    reorder(id,visible[next].id);
  }
  return <section aria-label="dnd-kit 排序实战">
    <h2>{level==='basic'?'拖动三个频道':level==='business'?'RSS 频道优先级':'锁定、撤销与输入多样性'}</h2>
    <p>真实 @dnd-kit/core 和 sortable 的 DndContext/useSortable，稳定字符串ID，不直接操作DOM改变数组。</p>
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleEnd}>
      <SortableContext items={visible.map(item=>item.id)} strategy={verticalListSortingStrategy}>
        <ol style={{listStyle:'none',padding:0}}>{visible.map((item,index)=>
          <SortableRow key={item.id} item={item} index={index} total={visible.length} move={move} lockable={level==='advanced'}/>
        )}</ol>
      </SortableContext>
    </DndContext>
    {level==='advanced'&&<div className="demo-controls">
      <button type="button" disabled={!previous} onClick={()=>{if(previous){setItems(previous);setPrevious(null);setMessage('已撤销上一次排序');}}}>撤销</button>
      <button type="button" onClick={()=>{setPrevious(items);setItems(INITIAL);setMessage('已恢复初始频道顺序');}}>恢复默认</button>
    </div>}
    <p role="status" aria-live="polite">{message}</p>
    <output className="demo-output">{visible.map(item=>item.id).join(' → ')}</output>
    <p>高级模式的国际资讯为锁定条目；上下按钮提供拖放以外的可靠路径，便于可访问性和测试。</p>
  </section>;
}
