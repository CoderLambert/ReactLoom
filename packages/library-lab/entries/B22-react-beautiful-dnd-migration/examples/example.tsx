import {useState} from 'react';
import {DragDropContext,Draggable,Droppable,type DropResult} from '@hello-pangea/dnd';
import {canReorderAroundPinned} from './pinned-order';

type Level='basic'|'business'|'advanced';
type Item={id:string;label:string;fixed?:boolean};
const INITIAL:Item[]=[
  {id:'ai',label:'AI 模型研究'},{id:'frontend',label:'前端工程'},
  {id:'rss',label:'RSS 频道'},{id:'global',label:'国际时事',fixed:true},
  {id:'notes',label:'深度阅读'}
];
export default function BeautifulDndMigration({level}:{level:Level}){
  const [items,setItems]=useState<Item[]>(INITIAL);
  const [previous,setPrevious]=useState<Item[]|null>(null);
  const [message,setMessage]=useState('拖动手柄更改顺序，或使用上下按钮。');
  const visible=level==='basic'?items.slice(0,3):items;
  function apply(next:Item[],notice:string){setPrevious(items);setItems(next);setMessage(notice);}
  function move(sourceIndex:number,destIndex:number){
    if(sourceIndex<0||destIndex<0||sourceIndex>=visible.length||destIndex>=visible.length||sourceIndex===destIndex)return;
    if(!canReorderAroundPinned(visible,sourceIndex,destIndex)){setMessage('固定频道不可移动，也不能被跨越；顺序未改变');return;}
    const list=visible.slice();const [item]=list.splice(sourceIndex,1);list.splice(destIndex,0,item);
    apply(level==='basic'?[...list,...items.slice(3)]:list,'已调整频道 '+item.label+' 的顺序');
  }
  function handleDragEnd(result:DropResult){
    const {source,destination}=result;
    if(!destination||destination.droppableId!==source.droppableId)return;
    move(source.index,destination.index);
  }
  return <section aria-label="Beautiful DnD迁移示例">
    <h2>{level==='basic'?'替换旧DnD入口':level==='business'?'频道顺序持久化合同':'受限拖动、撤销和键盘'}</h2>
    <p>运行真实 @hello-pangea/dnd 的 DragDropContext、Droppable、Draggable。旧react-beautiful-dnd仅保留迁移映射，不在React19主Bundle中安装。</p>
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="reactloom-channels" direction="vertical">
        {provided=><ol ref={provided.innerRef} {...provided.droppableProps}
            style={{padding:0,listStyle:'none'}}>
          {visible.map((item,index)=><Draggable key={item.id} draggableId={item.id}
              index={index} isDragDisabled={item.fixed}>
            {p=><li ref={p.innerRef} {...p.draggableProps} style={{...p.draggableProps.style,
              display:'flex',alignItems:'center',gap:8,border:'1px solid #d4dfd1',borderRadius:8,
              padding:10,marginBottom:7,background:'#fff'}}>
              <button type="button" {...(p.dragHandleProps??{})} disabled={item.fixed}
                aria-label={'拖动 '+item.label} style={{cursor:item.fixed?'not-allowed':'grab',touchAction:'none'}}>⠿</button>
              <span style={{flex:1}}>{item.label}</span>
              {item.fixed&&<small>固定</small>}
              <button type="button" aria-label={'上移 '+item.label} disabled={index===0||!canReorderAroundPinned(visible,index,index-1)}
                onClick={()=>move(index,index-1)}>↑</button>
              <button type="button" aria-label={'下移 '+item.label} disabled={index===visible.length-1||!canReorderAroundPinned(visible,index,index+1)}
                onClick={()=>move(index,index+1)}>↓</button>
            </li>}
          </Draggable>)}
          {provided.placeholder}
        </ol>}
      </Droppable>
    </DragDropContext>
    {level==='advanced'&&<div className="demo-controls">
      <button type="button" disabled={!previous} onClick={()=>{if(previous){setItems(previous);setPrevious(null);setMessage('已撤销')};}}>撤销上次排序</button>
      <button type="button" onClick={()=>apply(INITIAL,'已重置频道')}>恢复原序</button>
    </div>}
    <p role="status">{message}</p>
    <output className="demo-output">{visible.map(x=>x.id).join(' → ')}</output>
    <p>只能拖放到当前Droppable，锁定项在数据层被拒绝；后端更新/冲突回滚必须在接入真实API时另实现。</p>
  </section>;
}
