import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Tree, type TreeApi } from 'react-arborist'
import { beginComposition, createCompositionGuard, endComposition } from './ime-guard'
import { moveTree } from './move-tree'
import {
  countTree,
  findLocation,
  type Item,
  initialTree,
  locate,
  renameTree,
  stripTree,
} from './tree-model'
import { TreeNode } from './tree-node'
import './styles.css'

export { moveTree } from './move-tree'

type Level = 'basic' | 'business' | 'advanced'
type Move = { dragIds: string[]; parentId: string | null; index: number; source: 'sdk' | 'button' }

export default function ArboristWorkshop({ level }: { level: Level }) {
  const [nodes, setNodes] = useState(() => initialTree(level === 'advanced'))
  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [notice, setNotice] = useState('本地受控树已就绪')
  const [lastMove, setLastMove] = useState<Move | null>(null)
  const [epoch, setEpoch] = useState(0)
  const [observation, setObservation] = useState({
    visibleNodes: 0,
    filteredMatches: 0,
    selectedIds: [] as string[],
  })
  const tree = useRef<TreeApi<Item> | undefined>(undefined)
  const host = useRef<HTMLDivElement>(null)
  const guard = useRef(createCompositionGuard())
  const focusAfterDelete = useRef(false)
  const total = useMemo(() => countTree(nodes), [nodes])
  const topology = useMemo(
    () =>
      nodes.map((node) => ({
        id: node.id,
        name: node.name,
        childCount: node.children?.length ?? 0,
        firstIds: node.children?.slice(0, 8).map((child) => child.id) ?? [],
        lastId: node.children?.at(-1)?.id ?? null,
      })),
    [nodes],
  )
  const location = selected.length === 1 ? findLocation(nodes, selected[0]) : null

  useEffect(() => {
    setNodes(initialTree(level === 'advanced'))
    setDraft('')
    setSearch('')
    tree.current?.deselectAll()
    setSelected([])
    setLastMove(null)
    setNotice('本地受控树已就绪')
    guard.current = createCompositionGuard()
  }, [level])
  // biome-ignore lint/correctness/useExhaustiveDependencies: these inputs invalidate the mutable SDK model read through its stable ref.
  useLayoutEffect(() => {
    const api = tree.current
    if (!api) return
    const next = {
      visibleNodes: api.visibleNodes.length,
      filteredMatches: api.filteredCount,
      selectedIds: Array.from(api.selectedIds),
    }
    setObservation((previous) =>
      JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
    )
    if (focusAfterDelete.current) {
      focusAfterDelete.current = false
      if (api.firstNode) api.focus(api.firstNode.id)
    }
  }, [nodes, search, selected, epoch])

  function restore() {
    setNodes(initialTree(level === 'advanced'))
    setDraft('')
    setSearch('')
    tree.current?.deselectAll()
    setSelected([])
    setLastMove(null)
    guard.current = createCompositionGuard()
    setNotice('已恢复当前目标数据并清除SDK选择')
  }
  function commitMove(move: Move) {
    if (search.trim()) {
      setNotice('筛选期间不移动节点')
      return
    }
    setNodes((previous) => moveTree(previous, move.dragIds, move.parentId, move.index))
    setLastMove(move)
    setNotice(
      move.source === 'sdk'
        ? '收到SDK拖放请求，已按删除前槽位更新受控树'
        : '应用移动按钮使用同一业务更新函数，不是SDK拖拽事件',
    )
  }
  function remove(ids: string[]) {
    focusAfterDelete.current = Boolean(host.current?.contains(document.activeElement))
    setNodes((previous) => stripTree(previous, new Set(ids)))
    tree.current?.deselectAll()
    setNotice('已从受控树删除并清除SDK选择')
  }
  return (
    <section
      className="c11-workshop"
      aria-label="react-arborist真实树控件"
      data-testid="c11-workshop"
      data-level={level}
    >
      <h2>
        {level === 'basic'
          ? '树节点与键盘导航'
          : level === 'business'
            ? '受控移动、重命名与删除'
            : '1807节点模型与虚拟DOM'}
      </h2>
      <p>真实Tree负责ARIA/键盘/虚拟窗口/DnD；业务数据是本地fixture，稳定ID不随名称和位置改变。</p>
      <div className="c11-controls">
        {level !== 'basic' && (
          <label>
            搜索节点{' '}
            <input
              aria-label="节点搜索"
              value={draft}
              onCompositionStart={() => beginComposition(guard.current)}
              onCompositionEnd={(event) => {
                endComposition(guard.current)
                setDraft(event.currentTarget.value)
                setSearch(event.currentTarget.value)
              }}
              onChange={(event) => {
                setDraft(event.target.value)
                if (
                  !guard.current.composing &&
                  !(event.nativeEvent instanceof InputEvent && event.nativeEvent.isComposing)
                )
                  setSearch(event.target.value)
              }}
            />
          </label>
        )}
        <button type="button" onClick={restore}>
          恢复示例树
        </button>
        {level !== 'basic' && (
          <>
            <button
              type="button"
              disabled={selected.length !== 1}
              onClick={() => {
                const node = tree.current?.selectedNodes[0]
                if (node) void node.edit()
              }}
            >
              重命名所选
            </button>
            <button
              type="button"
              disabled={!selected.length}
              onClick={() => {
                const ids = Array.from(tree.current?.selectedIds ?? [])
                if (ids.length) void tree.current?.delete(ids)
              }}
            >
              删除所选
            </button>
            <button
              type="button"
              disabled={
                !selected.length || Boolean(search.trim()) || selected.includes('grp-business')
              }
              onClick={() => {
                const ids = Array.from(tree.current?.selectedIds ?? [])
                commitMove({
                  dragIds: ids,
                  parentId: 'grp-business',
                  index: locate(nodes, 'grp-business')?.length ?? 0,
                  source: 'button',
                })
                tree.current?.open('grp-business')
              }}
            >
              移到商业分组
            </button>
            <button
              type="button"
              disabled={!location || location.index >= location.count - 1 || Boolean(search.trim())}
              onClick={() => {
                if (location && selected[0])
                  commitMove({
                    dragIds: [selected[0]],
                    parentId: location.parentId,
                    index: location.index + 2,
                    source: 'button',
                  })
              }}
            >
              同组下移一位
            </button>
          </>
        )}
        {level === 'advanced' && (
          <button
            type="button"
            disabled={Boolean(search.trim())}
            onClick={() => void tree.current?.scrollTo('bulk-1799', 'center')}
          >
            定位最后技术源
          </button>
        )}
      </div>
      <div ref={host} className="c11-tree" data-testid="c11-tree">
        <Tree<Item>
          ref={tree}
          data={nodes}
          width="100%"
          height={340}
          rowHeight={34}
          indent={22}
          overscanCount={3}
          aria-label="订阅目录树"
          searchTerm={search}
          searchMatch={(node, term) =>
            node.data.name.toLocaleLowerCase().includes(term.toLocaleLowerCase())
          }
          disableDrag={Boolean(search.trim())}
          onMove={({ dragIds, parentId, index }) =>
            commitMove({ dragIds, parentId, index, source: 'sdk' })
          }
          onRename={({ id, name }) => {
            setNodes((previous) => renameTree(previous, id, name))
            setNotice(`已重命名 ${id}，业务ID未改变`)
          }}
          onDelete={({ ids }) => remove(ids)}
          onSelect={(selection) => setSelected(selection.map((node) => node.id))}
          onToggle={() => setEpoch((value) => value + 1)}
        >
          {TreeNode}
        </Tree>
      </div>
      <p role="status" data-testid="c11-status">
        {notice}
      </p>
      <p>
        节点总数 <span data-testid="c11-count">{total}</span>；搜索已提交{' '}
        <output data-testid="c11-search">{search || '未筛选'}</output>
      </p>
      <output className="c11-observation" data-testid="c11-model">
        {JSON.stringify(observation)}
      </output>
      <output className="c11-observation" data-testid="c11-selection">
        {JSON.stringify(selected)}
      </output>
      <details>
        <summary>查看受控拓扑</summary>
        <pre data-testid="c11-topology">{JSON.stringify(topology, null, 2)}</pre>
      </details>
      <output className="c11-observation" data-testid="c11-last-move">
        {JSON.stringify(lastMove)}
      </output>
      <p>
        选择由SDK拥有，onSelect仅作镜像；恢复/删除调用deselectAll。默认SDK
        Row保留ARIA/ref，应用只替换内容和输入法守卫。模型节点数不等于虚拟DOM行数，1807不是性能结果。
      </p>
    </section>
  )
}
