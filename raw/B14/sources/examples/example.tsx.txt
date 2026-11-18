import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { reorder as reorderList } from '@atlaskit/pragmatic-drag-and-drop/reorder'
import { useEffect, useId, useRef, useState } from 'react'
import { canReorderAroundPinned, type DragSession, isCurrentDragSession } from './pinned-order'

type Level = 'basic' | 'business' | 'advanced'
type Item = { id: string; title: string; locked?: boolean }
const INITIAL: Item[] = [
  { id: 'ai', title: 'AI / 模型' },
  { id: 'frontend', title: '前端工程' },
  { id: 'opensource', title: '开源趋势' },
  { id: 'global', title: '国际资讯', locked: true },
  { id: 'deep', title: '深度阅读' },
]
function ItemRow({
  item,
  scope,
  move,
  index,
  canMoveUp,
  canMoveDown,
}: {
  item: Item
  scope: string
  move: (id: string, offset: number) => void
  index: number
  canMoveUp: boolean
  canMoveDown: boolean
}) {
  const ref = useRef<HTMLLIElement>(null)
  const handleRef = useRef<HTMLSpanElement>(null)
  const [dragging, setDragging] = useState(false)
  const [targeted, setTargeted] = useState(false)
  useEffect(() => {
    const element = ref.current,
      dragHandle = handleRef.current
    if (!element || !dragHandle || item.locked) return
    return combine(
      draggable({
        element,
        dragHandle,
        getInitialData: () => ({ scope, type: 'reactloom-entry', id: item.id }),
        onDragStart: () => setDragging(true),
        onDrop: () => setDragging(false),
      }),
      dropTargetForElements({
        element,
        getData: () => ({ scope, type: 'reactloom-target', id: item.id }),
        canDrop: ({ source }) =>
          source.data.scope === scope && source.data.type === 'reactloom-entry',
        onDragEnter: () => setTargeted(true),
        onDragLeave: () => setTargeted(false),
        onDrop: () => setTargeted(false),
      }),
    )
  }, [item.id, item.locked, scope])
  return (
    <li
      ref={ref}
      data-item-id={item.id}
      data-state={dragging ? 'dragging' : targeted ? 'target' : 'idle'}
      style={{
        padding: 12,
        marginBottom: 8,
        border: '1px solid #bac9bc',
        borderRadius: 8,
        background: dragging ? '#e2efe8' : targeted ? '#eaf1d9' : 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 9,
      }}
    >
      <span
        ref={handleRef}
        data-drag-handle="true"
        aria-hidden="true"
        title="仅指针拖动，键盘请使用上下按钮"
        style={{
          cursor: item.locked ? 'not-allowed' : 'grab',
          touchAction: 'none',
          minWidth: 32,
          minHeight: 32,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ⠿
      </span>
      <span style={{ flex: 1 }}>
        {index + 1}. {item.title}
      </span>
      {item.locked && <span>🔒固定</span>}
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
    </li>
  )
}
function SortableBoard({ level, label }: { level: Level; label: string }) {
  const scope = useId()
  const [items, setItems] = useState<Item[]>(INITIAL)
  const itemsRef = useRef<Item[]>(INITIAL)
  const undoRef = useRef<Item[] | null>(null)
  const [undoable, setUndoable] = useState(false)
  const [status, setStatus] = useState('拖动项目到另一个未锁定项目，或用上下按钮。')
  const dataRevision = useRef(0)
  const dragSession = useRef<DragSession | null>(null)
  const currentLevel = useRef(level)
  currentLevel.current = level
  // biome-ignore lint/correctness/useExhaustiveDependencies: changing scenes invalidates the native drag session
  useEffect(() => {
    dragSession.current = null
  }, [level])
  const shown = level === 'basic' ? items.slice(0, 3) : items
  function commit(next: Item[], message: string) {
    ++dataRevision.current
    dragSession.current = null
    if (
      next.length === itemsRef.current.length &&
      next.every((item, index) => item.id === itemsRef.current[index].id)
    ) {
      setStatus(`${message}；顺序未改变`)
      return
    }
    undoRef.current = itemsRef.current
    setUndoable(true)
    itemsRef.current = next
    setItems(next)
    setStatus(message)
  }
  function reorder(sourceId: string, targetId: string) {
    const all = itemsRef.current
    const visible = level === 'basic' ? all.slice(0, 3) : all
    const source = visible.findIndex((x) => x.id === sourceId),
      target = visible.findIndex((x) => x.id === targetId)
    if (source < 0 || target < 0 || source === target) return
    if (!canReorderAroundPinned(visible, source, target)) {
      setStatus('固定频道不可移动，也不能被跨越；顺序未改变')
      return
    }
    const reordered = reorderList({ list: visible, startIndex: source, finishIndex: target })
    commit(
      level === 'basic' ? [...reordered, ...all.slice(3)] : reordered,
      `${visible[source].title} → 第${target + 1}位`,
    )
  }
  const reorderRef = useRef(reorder)
  reorderRef.current = reorder
  useEffect(() => {
    const detach = monitorForElements({
      canMonitor: ({ source }) =>
        source.data.scope === scope && source.data.type === 'reactloom-entry',
      onDragStart: ({ source }) => {
        const id = source.data.id
        dragSession.current =
          typeof id === 'string'
            ? { activeId: id, revision: dataRevision.current, level: currentLevel.current }
            : null
      },
      onDrop: ({ source, location }) => {
        const snapshot = dragSession.current
        dragSession.current = null
        const target = location.current.dropTargets[0]
        if (target?.data.scope !== scope || target.data.type !== 'reactloom-target') return
        const from = source.data.id,
          to = target.data.id
        if (
          typeof from === 'string' &&
          typeof to === 'string' &&
          isCurrentDragSession(snapshot, from, dataRevision.current, currentLevel.current)
        )
          reorderRef.current(from, to)
      },
    })
    return () => {
      dragSession.current = null
      detach()
    }
  }, [scope])
  function move(id: string, offset: number) {
    const source = shown.findIndex((x) => x.id === id),
      target = source + offset
    if (source < 0 || target < 0 || target >= shown.length) return
    reorder(id, shown[target].id)
  }
  function undo() {
    if (!undoRef.current) return
    const old = undoRef.current
    ++dataRevision.current
    dragSession.current = null
    itemsRef.current = old
    setItems(old)
    undoRef.current = null
    setUndoable(false)
    setStatus('已撤销上次排序')
  }
  return (
    <section
      aria-label={label}
      data-testid="b14-board"
      data-scope={scope}
      data-revision={dataRevision.current}
      data-all-order={items.map((item) => item.id).join(',')}
    >
      <h3>{label}</h3>
      <p>
        真实 Atlassian
        draggable/dropTargetForElements/monitorForElements；每个列表使用独立scope，避免拖进其他示例。
      </p>
      <ol style={{ listStyle: 'none', padding: 0 }}>
        {shown.map((item, index) => (
          <ItemRow
            key={item.id}
            item={item}
            scope={scope}
            move={move}
            index={index}
            canMoveUp={index > 0 && canReorderAroundPinned(shown, index, index - 1)}
            canMoveDown={
              index < shown.length - 1 && canReorderAroundPinned(shown, index, index + 1)
            }
          />
        ))}
      </ol>
      {level === 'advanced' && (
        <div className="demo-controls">
          <button type="button" disabled={!undoable} onClick={undo}>
            撤销排序
          </button>
          <button type="button" onClick={() => commit(INITIAL, '已恢复原始次序')}>
            重置频道
          </button>
        </div>
      )}
      <p role="status">{status}</p>
      <output className="demo-output" data-testid="b14-order">
        {shown.map((x) => x.id).join(' → ')}
      </output>
      <p>原生Drag需指针设备，键盘用户使用上下按钮；这不是由库自动提供的完整拖拽无障碍能力。</p>
    </section>
  )
}

export default function PragmaticExample({ level }: { level: Level }) {
  return (
    <section aria-label="Pragmatic drag and drop 实践">
      <h2>
        {level === 'basic'
          ? '手柄拖放与键盘回退'
          : level === 'business'
            ? '固定频道不被跨越'
            : '双实例隔离、撤销与清理'}
      </h2>
      <p>
        拖到行上时浅绿底显示目标；上下按钮是本例自建键盘回退，复用相同的锁定规则。数据仅在内存中。
      </p>
      <SortableBoard level={level} label="频道排序主列表" />
      {level === 'advanced' && (
        <>
          <p>
            下面是同一组件的独立实例。尝试把主列表手柄拖到对照列表：两边顺序均不应改变。每个monitor只接受自己的scope。
          </p>
          <SortableBoard level="business" label="隔离对照列表" />
        </>
      )}
    </section>
  )
}
