import {
  DragDropContext,
  Draggable,
  type DragStart,
  Droppable,
  type DropResult,
} from '@hello-pangea/dnd'
import { useLayoutEffect, useReducer, useRef, useState } from 'react'
import {
  canReorderAroundPinned,
  type DragSnapshot,
  initialOrderState,
  reduceOrder,
} from './pinned-order'
import './styles.css'

type Level = 'basic' | 'business' | 'advanced'
type Receipt = Pick<DragStart, 'draggableId' | 'mode' | 'source'> & {
  phase: 'start' | 'end'
  destination: DropResult['destination']
  reason: DropResult['reason'] | null
  snapshotRevision: number | null
}
const DROPPABLE_ID = 'reactloom-channels'

export default function BeautifulDndMigration({ level }: { level: Level }) {
  const [state, dispatch] = useReducer(reduceOrder, undefined, initialOrderState)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const activeDrag = useRef<DragSnapshot | null>(null)
  // SDK context remounts when level changes; invalidate a pending drag before paint.
  // biome-ignore lint/correctness/useExhaustiveDependencies: level defines the SDK context and snapshot lifetime
  useLayoutEffect(() => {
    activeDrag.current = null
    setReceipt(null)
    return () => {
      activeDrag.current = null
    }
  }, [level])
  const visible = level === 'basic' ? state.items.slice(0, 3) : state.items

  function move(sourceIndex: number, destIndex: number) {
    activeDrag.current = null
    dispatch({ type: 'move', from: sourceIndex, to: destIndex, visibleCount: visible.length })
  }
  function beforeDragStart() {
    // 18.0.1 invokes this synchronously; onDragStart is deferred and must not recreate a stale session.
    activeDrag.current = { ids: visible.map((item) => item.id), revision: state.revision, level }
  }
  function handleDragStart(start: DragStart) {
    setReceipt({
      phase: 'start',
      draggableId: start.draggableId,
      mode: start.mode,
      source: { ...start.source },
      destination: null,
      reason: null,
      snapshotRevision: activeDrag.current?.revision ?? null,
    })
  }
  function handleDragEnd(result: DropResult) {
    const snapshot = activeDrag.current
    activeDrag.current = null
    const { source, destination, draggableId } = result
    setReceipt({
      phase: 'end',
      draggableId,
      mode: result.mode,
      source: { ...source },
      destination: destination ? { ...destination } : null,
      reason: result.reason,
      snapshotRevision: snapshot?.revision ?? null,
    })
    if (
      source.droppableId !== DROPPABLE_ID ||
      (destination && destination.droppableId !== DROPPABLE_ID)
    ) {
      dispatch({ type: 'notice', message: '不是当前单列的有效落点；顺序未写入' })
      return
    }
    // The reducer checks freshness, cancellation and fixed slots against its actual current state.
    dispatch({
      type: 'drop',
      snapshot,
      level,
      from: source.index,
      to: destination?.index ?? null,
      draggableId,
      visibleCount: visible.length,
      reason: result.reason,
    })
  }
  return (
    <section
      aria-label="Beautiful DnD迁移示例"
      className="rl-b22-workshop"
      data-testid="b22-workshop"
      data-level={level}
      data-revision={state.revision}
      data-all-order={state.items.map((item) => item.id).join(',')}
    >
      <h2>
        {level === 'basic'
          ? '替换旧DnD入口'
          : level === 'business'
            ? '固定频道与手柄边界'
            : '取消、撤销与过期快照'}
      </h2>
      <p>
        当前运行@hello-pangea/dnd18.0.1；原归档react-beautiful-dnd不安装、不加载，也没有原库PASS。
      </p>
      <DragDropContext
        key={level}
        onBeforeDragStart={beforeDragStart}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        dragHandleUsageInstructions="空格提起，方向键移动，空格放下，Escape取消。固定频道不可移动。"
      >
        <Droppable droppableId={DROPPABLE_ID} direction="vertical">
          {(provided, dropSnapshot) => (
            <ol
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="rl-b22-list"
              data-testid="b22-list"
              data-over={dropSnapshot.isDraggingOver}
            >
              {visible.map((item, index) => (
                <Draggable
                  key={item.id}
                  draggableId={item.id}
                  index={index}
                  isDragDisabled={Boolean(item.fixed)}
                  disableInteractiveElementBlocking
                >
                  {(drag, dragSnapshot) => (
                    <li
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      className="rl-b22-row"
                      data-item-id={item.id}
                      data-dragging={dragSnapshot.isDragging}
                      style={drag.draggableProps.style}
                    >
                      <button
                        type="button"
                        {...(drag.dragHandleProps ?? {})}
                        disabled={Boolean(item.fixed)}
                        aria-label={`拖动 ${item.label}`}
                        className="rl-b22-handle"
                      >
                        ⠿
                      </button>
                      <span className="rl-b22-title">{item.label}</span>
                      {item.fixed && <small>固定</small>}
                      <button
                        type="button"
                        aria-label={`上移 ${item.label}`}
                        disabled={index === 0 || !canReorderAroundPinned(visible, index, index - 1)}
                        onClick={() => move(index, index - 1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`下移 ${item.label}`}
                        disabled={
                          index === visible.length - 1 ||
                          !canReorderAroundPinned(visible, index, index + 1)
                        }
                        onClick={() => move(index, index + 1)}
                      >
                        ↓
                      </button>
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ol>
          )}
        </Droppable>
      </DragDropContext>
      {level === 'advanced' && (
        <div className="rl-b22-controls">
          <button
            type="button"
            disabled={!state.previous}
            onClick={() => {
              activeDrag.current = null
              dispatch({ type: 'undo' })
            }}
          >
            撤销上次排序
          </button>
          <button
            type="button"
            onClick={() => {
              activeDrag.current = null
              dispatch({ type: 'reset' })
            }}
          >
            恢复原序
          </button>
        </div>
      )}
      <p role="status" data-testid="b22-status">
        {state.message}
      </p>
      <output data-testid="b22-order">{visible.map((item) => item.id).join(' → ')}</output>
      <p>
        最后一次替代SDK响应：id、mode、source、destination、reason来自SDK；phase与snapshotRevision是本例标注。FLUID表示连续移动，SNAP表示步进。是否写入看业务结果，按钮不会伪造SDK回调。
      </p>
      <pre data-testid="b22-sdk-event" className="rl-b22-event">
        {receipt ? JSON.stringify(receipt, null, 2) : '尚未收到真实SDK拖动回调'}
      </pre>
    </section>
  )
}
