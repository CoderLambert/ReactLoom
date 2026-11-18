import { Graph, type GraphData, GraphEvent, type IElementEvent, NodeEvent } from '@antv/g6'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createAsyncOwner } from './async-owner'
import { createGraphData, type Level } from './graph-data'
import { createGraphOptions } from './graph-options'
import { measuredGraphWidth } from './graph-sizing'
import './workshop.css'

type Desired = { data: GraphData; selected: string | null; width: number | null; fit: number }
type Owner = {
  graph: Graph
  lease: ReturnType<typeof createAsyncOwner>
  mount: HTMLDivElement
  desired: Desired
  appliedData: GraphData | null
  appliedSelected: string | null | undefined
  appliedWidth: number
  appliedFit: number
  disposed: boolean
  syncing: boolean
  instance: number
  renders: number
  draws: number
  sizes: number
}
type Snapshot = {
  instance: number
  rendered: boolean
  size: [number, number]
  zoom: number
  renderEvents: number
  drawEvents: number
  sizeEvents: number
  nodes: { id: string; label: unknown; position: number[]; client: number[]; states: string[] }[]
  edges: { id: string | undefined; source: string; target: string }[]
}

export default function G6Example({ level }: { level: Level }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const ownerRef = useRef<Owner | null>(null)
  const sequence = useRef(0)
  const [extended, setExtended] = useState(level !== 'basic')
  const [revision, setRevision] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [narrow, setNarrow] = useState(false)
  const [fit, setFit] = useState(0)
  const [status, setStatus] = useState('尚未渲染')
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const data = useMemo(() => createGraphData(level, extended), [level, extended])

  function observe(owner: Owner) {
    if (owner.disposed || ownerRef.current !== owner || !owner.graph.rendered) return
    const graph = owner.graph
    setSnapshot({
      instance: owner.instance,
      rendered: graph.rendered,
      size: graph.getSize(),
      zoom: graph.getZoom(),
      renderEvents: owner.renders,
      drawEvents: owner.draws,
      sizeEvents: owner.sizes,
      nodes: graph.getNodeData().map((node) => {
        const position = graph.getElementPosition(node.id)
        return {
          id: node.id,
          label: node.data?.label,
          position: Array.from(position),
          client: Array.from(graph.getClientByCanvas(position)),
          states: graph.getElementState(node.id),
        }
      }),
      edges: graph
        .getEdgeData()
        .map((edge) => ({ id: edge.id, source: edge.source, target: edge.target })),
    })
  }
  function synchronize(owner: Owner) {
    if (owner.disposed) return
    setStatus('正在同步真实 G6 Graph…')
    const job = owner.lease.run(async (owns) => {
      const next = owner.desired
      if (next.width === null) {
        if (owns()) setStatus('等待可见且宽度有效的容器')
        return
      }
      owner.syncing = true
      try {
        const changed = owner.appliedData !== next.data
        if (changed) {
          owner.graph.setData(next.data)
          await owner.graph.render()
          owner.appliedData = next.data
          if (!owns()) return
        }
        if (owner.appliedWidth !== next.width) {
          owner.graph.setSize(next.width, 330)
          owner.appliedWidth = next.width
          await owner.graph.fitView({ when: 'always' }, false)
          if (!owns()) return
        }
        if (owner.appliedFit !== next.fit) {
          await owner.graph.fitView({ when: 'always' }, false)
          owner.appliedFit = next.fit
          if (!owns()) return
        }
        if (changed || owner.appliedSelected !== next.selected) {
          const states: Record<string, string[]> = Object.fromEntries(
            owner.graph
              .getNodeData()
              .map((node) => [node.id, node.id === next.selected ? ['selected'] : []]),
          )
          await owner.graph.setElementState(states, false)
          owner.appliedSelected = next.selected
          if (!owns()) return
        }
        observe(owner)
        setStatus('已渲染：拖动画布、滚轮缩放，或选择下方节点')
      } finally {
        owner.syncing = false
      }
    })
    void job.finished.catch((error) => {
      if (job.owns()) setStatus(`Graph 渲染或交互失败：${String(error)}`)
    })
  }

  // The instance lifetime is structural; committed data/selection changes are synchronized below.
  // biome-ignore lint/correctness/useExhaustiveDependencies: data/selected/fit use the separately serialized synchronization effect.
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const mount = document.createElement('div')
    mount.className = 'a07-owned-canvas'
    mount.dataset.testid = 'a07-owned-canvas'
    mount.dataset.graphDestroyed = 'false'
    host.append(mount)
    const width = measuredGraphWidth(host.clientWidth)
    const graph = new Graph(createGraphOptions(mount, width ?? 330, data))
    const lease = createAsyncOwner(() => {
      if (!graph.destroyed) graph.destroy()
      mount.dataset.graphDestroyed = String(graph.destroyed)
    })
    const owner: Owner = {
      graph,
      lease,
      mount,
      desired: { data, selected, width, fit },
      appliedData: null,
      appliedSelected: undefined,
      appliedWidth: width ?? 330,
      appliedFit: fit,
      disposed: false,
      syncing: false,
      instance: ++sequence.current,
      renders: 0,
      draws: 0,
      sizes: 0,
    }
    ownerRef.current = owner
    setSnapshot(null)
    setStatus('正在建立真实 G6 Graph')
    const onClick = (event: IElementEvent) => {
      const id = event.target.id
      if (!owner.disposed && owner.desired.data.nodes?.some((node) => node.id === id))
        setSelected(id)
    }
    const onRender = () => {
      owner.renders++
    }
    const onDraw = () => {
      owner.draws++
    }
    const onSize = () => {
      owner.sizes++
    }
    const onTransform = () => {
      if (!owner.syncing) observe(owner)
    }
    graph.on(NodeEvent.CLICK, onClick)
    graph.on(GraphEvent.AFTER_RENDER, onRender)
    graph.on(GraphEvent.AFTER_DRAW, onDraw)
    graph.on(GraphEvent.AFTER_SIZE_CHANGE, onSize)
    graph.on(GraphEvent.AFTER_TRANSFORM, onTransform)
    let resizeFrame = 0
    const observer = new ResizeObserver((entries) => {
      const measured = measuredGraphWidth(entries[0]?.contentRect.width ?? 0)
      cancelAnimationFrame(resizeFrame)
      if (owner.disposed || measured === owner.desired.width) return
      resizeFrame = requestAnimationFrame(() => {
        if (owner.disposed || ownerRef.current !== owner) return
        owner.desired = { ...owner.desired, width: measured }
        synchronize(owner)
      })
    })
    observer.observe(host)
    return () => {
      owner.disposed = true
      if (ownerRef.current === owner) ownerRef.current = null
      observer.disconnect()
      cancelAnimationFrame(resizeFrame)
      graph.off(NodeEvent.CLICK, onClick)
      graph.off(GraphEvent.AFTER_RENDER, onRender)
      graph.off(GraphEvent.AFTER_DRAW, onDraw)
      graph.off(GraphEvent.AFTER_SIZE_CHANGE, onSize)
      graph.off(GraphEvent.AFTER_TRANSFORM, onTransform)
      // Detach this owner's DOM immediately; an old render cannot touch the new owner's container.
      mount.remove()
      void lease.dispose().catch((error) => {
        mount.dataset.cleanupError = String(error)
      })
    }
  }, [level, revision])
  // revision recreates the owner even when topology/selection is unchanged.
  // biome-ignore lint/correctness/useExhaustiveDependencies: revision installs a new owner that must receive the current committed intent.
  useEffect(() => {
    const owner = ownerRef.current
    if (!owner) return
    owner.desired = { ...owner.desired, data, selected, fit }
    synchronize(owner)
  }, [data, selected, fit, revision])

  return (
    <section className="a07-workshop" aria-label="AntV G6 实际图谱示例" data-testid="a07-workshop">
      <h2>
        {level === 'basic'
          ? '节点、边与有向关系'
          : level === 'business'
            ? '同实例更新新闻处理拓扑'
            : '选择、视口与异步所有权'}
      </h2>
      <p>
        本地节点/边是业务投影；真实G6默认Canvas渲染，没有启用WebGL、自动布局或远程图服务。42是圆节点尺寸/直径，不是半径。
      </p>
      <div className="demo-controls">
        {level !== 'basic' && (
          <label>
            <input
              type="checkbox"
              checked={extended}
              onChange={(event) => {
                setExtended(event.target.checked)
                if (!event.target.checked && selected === 'review') setSelected(null)
              }}
            />
            启用审校节点
          </label>
        )}
        <button type="button" onClick={() => setFit((value) => value + 1)}>
          重新适配视口
        </button>
        {level === 'advanced' && (
          <>
            <label>
              <input
                type="checkbox"
                checked={narrow}
                onChange={(event) => setNarrow(event.target.checked)}
              />
              使用窄容器
            </label>
            <button type="button" onClick={() => setRevision((value) => value + 1)}>
              重新创建图实例
            </button>
          </>
        )}
      </div>
      <p role="status" data-testid="a07-status">
        {status}
      </p>
      <div
        className="a07-stage"
        ref={hostRef}
        role="img"
        style={{ width: narrow ? 320 : '100%' }}
        aria-label="拖动及缩放的关系图画布"
        data-testid="a07-graph"
      />
      <h3>同源拓扑与可操作文本</h3>
      <ol>
        {data.nodes?.map((node) => (
          <li key={node.id}>
            <button
              type="button"
              aria-pressed={selected === node.id}
              onClick={() => setSelected(node.id)}
            >
              {String(node.data?.label)}（{node.id}）
            </button>
          </li>
        ))}
      </ol>
      <p data-testid="a07-topology">
        有向边：{data.edges?.map((edge) => `${edge.source} → ${edge.target}`).join('、')}
      </p>
      <p data-testid="a07-selection">当前选择：{selected ?? '暂无'}</p>
      <details>
        <summary>查看真实SDK拓扑与视口</summary>
        <pre data-testid="a07-sdk-state">{JSON.stringify(snapshot, null, 2)}</pre>
      </details>
      <p>
        数据变化走同一实例setData/render；选择状态不重建图。卸载立即撤销任务所有权，等待已运行SDK任务结算后销毁专属实例，不声称CPU可中途取消。
      </p>
    </section>
  )
}
