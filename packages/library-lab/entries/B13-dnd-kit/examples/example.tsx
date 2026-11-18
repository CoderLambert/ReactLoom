import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { type CSSProperties, useEffect, useRef, useState } from 'react'
import {
  canReorderAroundPinned,
  type DragSession,
  isCurrentDragSession,
  reorderVisible,
} from './pinned-order'
import './workshop.css'

type Props = { level: 'basic' | 'business' | 'advanced' }
type Item = { id: string; title: string; locked?: boolean }
const INITIAL: Item[] = [
  { id: 'tech', title: '技术快讯' },
  { id: 'ai', title: 'AI 新模型' },
  { id: 'oss', title: '开源趋势' },
  { id: 'news', title: '国际资讯', locked: true },
  { id: 'read', title: '深度阅读' },
  { id: 'later', title: '稍后阅读' },
]
function SortableRow({
  item,
  index,
  move,
  lockable,
  canMoveUp,
  canMoveDown,
}: {
  item: Item
  index: number
  move: (id: string, direction: number) => void
  lockable: boolean
  canMoveUp: boolean
  canMoveDown: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: item.locked })
  const style: CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px,${transform.y}px,0) scale(${transform.scaleX},${transform.scaleY})`
      : undefined,
    transition,
    opacity: isDragging ? 0.45 : 1,
  }
  return (
    <li
      ref={setNodeRef}
      style={style}
      className="b13-row"
      data-testid={`b13-item-${item.id}`}
      data-item-id={item.id}
      data-locked={!!item.locked}
    >
      <span style={{ color: '#6a7770' }}>{index + 1}.</span>
      <button
        ref={setActivatorNodeRef}
        type="button"
        disabled={item.locked}
        {...attributes}
        {...listeners}
        aria-label={`拖动 ${item.title}`}
        className="b13-handle"
        style={{ cursor: item.locked ? 'not-allowed' : 'grab', touchAction: 'none' }}
      >
        ⠿
      </button>
      <span className="b13-title">{item.title}</span>
      {item.locked && (
        <span role="img" aria-label="锁定">
          🔒
        </span>
      )}
      <button
        type="button"
        aria-label={`上移 ${item.title}`}
        disabled={!canMoveUp}
        onClick={() => move(item.id, -1)}
      >
        ↑
      </button>
      <button
        type="button"
        aria-label={`下移 ${item.title}`}
        disabled={!canMoveDown}
        onClick={() => move(item.id, 1)}
      >
        ↓
      </button>
      {lockable && <small>{item.locked ? '不可拖动' : '可移动'}</small>}
    </li>
  )
}
export default function DndKitWorkshop({ level }: Props) {
  const [items, setItems] = useState<Item[]>(INITIAL)
  const itemsRef = useRef<Item[]>(INITIAL)
  const [previous, setPrevious] = useState<Item[] | null>(null)
  const [message, setMessage] = useState('使用拖动手柄或上下按钮调整顺序')
  const [dragging, setDragging] = useState<string | null>(null)
  const dataRevision = useRef(0)
  const dragSession = useRef<DragSession | null>(null)
  useEffect(() => {
    if (dragSession.current?.level !== level) {
      dragSession.current = null
      setDragging(null)
    }
    return () => {
      dragSession.current = null
    }
  }, [level])
  const visible = level === 'basic' ? items.slice(0, 3) : items
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  function commit(next: Item[], note: string) {
    ++dataRevision.current // keyboard/reset action revokes any in-progress drop
    setPrevious(itemsRef.current)
    itemsRef.current = next
    setItems(next)
    setMessage(note)
  }
  function reorder(activeId: string, overId: string) {
    const current = itemsRef.current
    const moved = reorderVisible(current, activeId, overId, level === 'basic' ? 3 : current.length)
    if (!moved) {
      setMessage(
        activeId === overId ? '位置未变，顺序保留' : '固定频道、过期目标或重复ID：不能变更顺序',
      )
      return
    }
    commit(
      moved,
      `已调整 ${current.find((item) => item.id === activeId)?.title ?? activeId} 的优先级`,
    )
  }
  function handleStart(event: DragStartEvent) {
    setDragging(String(event.active.id))
    setMessage('拖动预览中：松手通过业务规则后才提交顺序')
    dragSession.current = {
      activeId: String(event.active.id),
      revision: dataRevision.current,
      level,
    }
  }
  function handleEnd(event: DragEndEvent) {
    const session = dragSession.current
    dragSession.current = null
    setDragging(null)
    if (!isCurrentDragSession(session, String(event.active.id), dataRevision.current, level)) {
      setMessage('数据或模式已变化，已忽略过期拖动')
      return
    }
    if (!event.over) {
      setMessage('没有有效放置目标，顺序保留')
      return
    }
    reorder(String(event.active.id), String(event.over.id))
  }
  function move(id: string, direction: number) {
    const active = level === 'basic' ? itemsRef.current.slice(0, 3) : itemsRef.current
    const idx = active.findIndex((item) => item.id === id),
      next = idx + direction
    if (idx < 0 || next < 0 || next >= active.length) return
    reorder(id, active[next].id)
  }
  return (
    <section
      className="b13-workshop"
      aria-label="dnd-kit 排序实战"
      data-testid="b13-workshop"
      data-level={level}
    >
      <h2>
        {level === 'basic'
          ? '拖动三个频道'
          : level === 'business'
            ? 'RSS 频道优先级'
            : '撤销已提交排序与过期拖动'}
      </h2>
      <p>
        真实 @dnd-kit/core 和 sortable 的
        DndContext/useSortable，稳定字符串ID，不直接操作DOM改变数组。
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleStart}
        onDragEnd={handleEnd}
        onDragCancel={() => {
          dragSession.current = null
          setDragging(null)
          setMessage('已取消拖动，顺序保留')
        }}
        accessibility={{
          screenReaderInstructions: {
            draggable: '按空格或回车抓起，使用方向键移动，再按空格或回车放下；Escape取消。',
          },
        }}
      >
        <SortableContext
          items={visible.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <ol className="b13-list">
            {visible.map((item, index) => (
              <SortableRow
                key={item.id}
                item={item}
                index={index}
                move={move}
                lockable={level === 'advanced'}
                canMoveUp={index > 0 && canReorderAroundPinned(visible, index, index - 1)}
                canMoveDown={
                  index < visible.length - 1 && canReorderAroundPinned(visible, index, index + 1)
                }
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      {level === 'advanced' && (
        <div className="demo-controls">
          <button
            type="button"
            disabled={!previous}
            onClick={() => {
              if (previous) {
                ++dataRevision.current
                dragSession.current = null
                itemsRef.current = previous
                setItems(previous)
                setPrevious(null)
                setMessage('已撤销上一次排序')
              }
            }}
          >
            撤销
          </button>
          <button type="button" onClick={() => commit(INITIAL, '已恢复初始频道顺序')}>
            恢复默认
          </button>
        </div>
      )}
      <p role="status" aria-live="polite" data-testid="b13-status">
        {message}
      </p>
      <output className="demo-output" data-testid="b13-visible-order">
        {visible.map((item) => item.id).join(' → ')}
      </output>
      <p data-testid="b13-drag-state">{dragging ? `正在拖动：${dragging}` : '当前没有拖动'}</p>
      <details className="b13-inspector">
        <summary>查看完整数据与提交轮次</summary>
        <p>
          可见顺序来自同一数组的前缀；basic隐藏后缀保留。拖动transform是预览，不直接重排此数组。
        </p>
        <pre data-testid="b13-all-order">{items.map((item) => item.id).join(' → ')}</pre>
        <p>
          数据轮次：<code data-testid="b13-revision">{dataRevision.current}</code>
        </p>
      </details>
      <p>
        {level === 'basic' ? '当前显示前三个频道。' : '国际资讯固定在第4位，不能把条目跨过它。'}
        上下按钮是独立于拖动的输入方式，与拖动共用数据规则。
      </p>
    </section>
  )
}
