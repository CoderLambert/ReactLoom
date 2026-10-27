import {useLayoutEffect, useReducer, useRef} from 'react';
import {DragDropContext, Draggable, Droppable, type DropResult} from '@hello-pangea/dnd';
import {canReorderAroundPinned, initialOrderState, isFreshDrop, reduceOrder, type DragSnapshot} from './pinned-order';

type Level = 'basic' | 'business' | 'advanced';

export default function BeautifulDndMigration({level}: {level: Level}) {
  const [state, dispatch] = useReducer(reduceOrder, initialOrderState());
  const activeDrag = useRef<DragSnapshot | null>(null);
  // SDK context remounts when level changes; invalidate a pending drag before paint.
  useLayoutEffect(() => {
    activeDrag.current = null;
    return () => { activeDrag.current = null; };
  }, [level]);
  const visible = level === 'basic' ? state.items.slice(0, 3) : state.items;

  function move(sourceIndex: number, destIndex: number) {
    // A keyboard action supersedes an unfinished pointer or keyboard drag.
    activeDrag.current = null;
    dispatch({type: 'move', from: sourceIndex, to: destIndex, visibleCount: visible.length});
  }
  function handleDragEnd(result: DropResult) {
    const snapshot = activeDrag.current;
    activeDrag.current = null;
    const {source, destination, draggableId} = result;
    if (!destination || destination.droppableId !== source.droppableId) return;
    if (!isFreshDrop(snapshot, state, level, source.index, draggableId, visible.length)) {
      dispatch({type: 'notice', message: '拖动期间列表或层级已变更，忽略过期Drop。'});
      return;
    }
    dispatch({type: 'move', from: source.index, to: destination.index, visibleCount: visible.length});
  }
  return <section aria-label="Beautiful DnD迁移示例">
    <h2>{level === 'basic' ? '替换旧DnD入口' : level === 'business' ? '频道顺序持久化合同' : '受限拖动、撤销和键盘'}</h2>
    <p>真实 @hello-pangea/dnd 的 DragDropContext、Droppable、Draggable；历史react-beautiful-dnd不加载。</p>
    <DragDropContext key={level}
      onDragStart={() => {activeDrag.current = {
        ids: visible.map(item => item.id), revision: state.revision, level,
      };}}
      onDragEnd={handleDragEnd}>
      <Droppable droppableId="reactloom-channels" direction="vertical">
        {provided => <ol ref={provided.innerRef} {...provided.droppableProps}
          style={{padding: 0, listStyle: 'none'}}>
          {visible.map((item, index) => <Draggable key={item.id} draggableId={item.id}
            index={index} isDragDisabled={Boolean(item.fixed)}>
            {drag => <li ref={drag.innerRef} {...drag.draggableProps}
              style={{...drag.draggableProps.style, display: 'flex', alignItems: 'center', gap: 8,
                border: '1px solid #d4dfd1', borderRadius: 8, padding: 10,
                marginBottom: 7, background: '#fff'}}>
              <button type="button" {...(drag.dragHandleProps ?? {})} disabled={Boolean(item.fixed)}
                aria-label={'拖动 ' + item.label}
                style={{cursor: item.fixed ? 'not-allowed' : 'grab', touchAction: 'none'}}>⠿</button>
              <span style={{flex: 1}}>{item.label}</span>
              {item.fixed && <small>固定</small>}
              <button type="button" aria-label={'上移 ' + item.label}
                disabled={index === 0 || !canReorderAroundPinned(visible, index, index - 1)}
                onClick={() => move(index, index - 1)}>↑</button>
              <button type="button" aria-label={'下移 ' + item.label}
                disabled={index === visible.length - 1 || !canReorderAroundPinned(visible, index, index + 1)}
                onClick={() => move(index, index + 1)}>↓</button>
            </li>}
          </Draggable>)}
          {provided.placeholder}
        </ol>}
      </Droppable>
    </DragDropContext>
    {level === 'advanced' && <div className="demo-controls">
      <button type="button" disabled={!state.previous} onClick={() => {
        activeDrag.current = null; dispatch({type: 'undo'});
      }}>撤销上次排序</button>
      <button type="button" onClick={() => {
        activeDrag.current = null; dispatch({type: 'reset'});
      }}>恢复原序</button>
    </div>}
    <p role="status">{state.message}</p>
    <output className="demo-output">{visible.map(item => item.id).join(' → ')}</output>
    <p>固定项不能被跨越；每次排序事务增加revision，旧drag的快照与项目id不匹配即拒绝写入。</p>
  </section>;
}
