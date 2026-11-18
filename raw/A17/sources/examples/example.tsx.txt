import { Deck } from '@deck.gl/core'
import type { ScatterplotLayer } from '@deck.gl/layers'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { SITES, type Site, sample, tablePage } from './deck-data'
import { makeLayer } from './deck-layer'
import { measuredDeckSize, needsDeckResize } from './deck-size'
import './styles.css'

type Level = 'basic' | 'business' | 'advanced'
type Snapshot = {
  initialized: boolean
  layerId: string
  instances: number
  layerLoaded: boolean
  width: number
  height: number
  radiusValues: number[]
  points: { id: string; x: number; y: number }[]
}

export default function DeckGlExample({ level }: { level: Level }) {
  const container = useRef<HTMLDivElement>(null)
  const deckRef = useRef<Deck | null>(null)
  const layerRef = useRef<ScatterplotLayer<Site> | null>(null)
  const canvasId = useId()
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [healthyOnly, setHealthyOnly] = useState(false)
  const [dense, setDense] = useState(false)
  const [radius, setRadius] = useState(1.5)
  const [picked, setPicked] = useState('')
  const [page, setPage] = useState(0)
  const data = useMemo(
    () =>
      level === 'advanced' && dense
        ? [...SITES, ...sample(1200)]
        : level === 'basic'
          ? SITES.slice(0, 2)
          : SITES,
    [level, dense],
  )
  const visible = useMemo(
    () => data.filter((site) => !healthyOnly || site.healthy),
    [data, healthyOnly],
  )
  const initialRows = useRef(visible)
  const pageData = tablePage(visible, page)
  useEffect(() => {
    if (page !== pageData.page) setPage(pageData.page)
    if (picked && !visible.some((site) => site.id === picked)) setPicked('')
  }, [visible, picked, page, pageData.page])

  useEffect(() => {
    const node = container.current
    if (!node) return
    setReady(false)
    setError('')
    setSnapshot(null)
    let disposed = false
    let signature = ''
    let deck: Deck | null = null
    const observe = () => {
      if (disposed || !deck || deckRef.current !== deck || !deck.isInitialized) return
      const layer = layerRef.current?.getCurrentLayer()
      const viewport = deck.getViewports()[0]
      const canvas = deck.getCanvas()
      if (!layer || !viewport || !canvas) return
      // This component only supplies Site[] through makeLayer; do not mirror a separate expected scene.
      const rows = layer.props.data as Site[]
      const values = layer.getAttributeManager()?.getAttributes().instanceRadius?.value
      const result: Snapshot = {
        initialized: deck.isInitialized,
        layerId: layer.id,
        instances: layer.getNumInstances(),
        layerLoaded: layer.isLoaded,
        width: canvas.clientWidth,
        height: canvas.clientHeight,
        radiusValues: values ? Array.from(values).slice(0, 4) : [],
        points: rows.slice(0, 4).map((site) => {
          const point = viewport.project(site.position)
          return { id: site.id, x: point[0], y: point[1] }
        }),
      }
      const next = JSON.stringify(result)
      if (next !== signature) {
        signature = next
        setSnapshot(result)
      }
    }
    const initialSize = measuredDeckSize(node.clientWidth, node.clientHeight) ?? {
      width: 1,
      height: 1,
    }
    let currentSize = initialSize
    try {
      const initial = makeLayer(initialRows.current, 1.5)
      layerRef.current = initial
      // Let the real SDK create its own WebGL device; no extra probe context is allocated.
      deck = new Deck({
        id: `a17-${canvasId}`,
        parent: node,
        ...initialSize,
        deviceProps: { type: 'webgl' },
        initialViewState: { longitude: 116.1, latitude: 39, zoom: 6, pitch: 0, bearing: 0 },
        controller: true,
        layers: [initial],
        onLoad: () => {
          if (!disposed) setReady(true)
        },
        onAfterRender: observe,
        getTooltip: (info) =>
          info.object && typeof info.object.name === 'string' ? info.object.name : null,
        onClick: (info) => {
          const item = info.object as Site | undefined
          if (!disposed && item) setPicked(item.id)
        },
        onError: (cause) => {
          if (!disposed) setError(String(cause))
        },
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Deck初始化失败，数据表仍可使用')
      return
    }
    deckRef.current = deck
    let frame = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = measuredDeckSize(node.clientWidth, node.clientHeight)
        if (!disposed && deckRef.current === deck && needsDeckResize(currentSize, next)) {
          currentSize = next
          deck?.setProps(next)
        }
      })
    })
    observer.observe(node)
    return () => {
      disposed = true
      observer.disconnect()
      cancelAnimationFrame(frame)
      deck?.finalize()
      node.dataset.a17Cleanup = JSON.stringify({
        initialized: deck?.isInitialized ?? false,
        canvas: Boolean(deck?.getCanvas()),
        canvases: node.querySelectorAll('canvas').length,
      })
      if (deckRef.current === deck) {
        deckRef.current = null
        layerRef.current = null
      }
    }
  }, [canvasId])

  useEffect(() => {
    const layer = makeLayer(visible, radius)
    layerRef.current = layer
    deckRef.current?.setProps({ layers: [layer] })
  }, [visible, radius])

  return (
    <section
      className="a17-workshop"
      aria-label="deck.gl 实际GPU地理点层"
      data-testid="a17-workshop"
      data-ready={ready}
      data-count={visible.length}
      data-picked={picked}
    >
      <h2>
        {level === 'basic'
          ? 'GPU点层与真实拾取'
          : level === 'business'
            ? '健康过滤与半径更新'
            : '1200样本、全量分页与资源释放'}
      </h2>
      <p>真实Deck与ScatterplotLayer，本地确定性数据，无底图瓦片、地理编码或模型服务。</p>
      <fieldset className="a17-controls">
        <legend>数据与半径</legend>
        {level !== 'basic' && (
          <label>
            <input
              type="checkbox"
              checked={healthyOnly}
              onChange={(event) => {
                setHealthyOnly(event.target.checked)
                setPage(0)
              }}
            />
            仅看健康站点
          </label>
        )}
        <label>
          半径倍数
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.25"
            value={radius}
            onChange={(event) => setRadius(Number(event.target.value))}
          />
          <output data-testid="a17-radius">{radius}</output>
        </label>
        {level === 'advanced' && (
          <>
            <label>
              <input
                type="checkbox"
                checked={dense}
                onChange={(event) => {
                  setDense(event.target.checked)
                  setPage(0)
                }}
              />
              添加1200个本地数据点
            </label>
            <button
              type="button"
              onClick={() => {
                setDense(false)
                setHealthyOnly(false)
                setRadius(1.5)
                setPage(0)
                setPicked('')
              }}
            >
              重置数据
            </button>
          </>
        )}
      </fieldset>
      <div
        ref={container}
        className="a17-canvas"
        role="img"
        aria-label="GPU经纬度点图，下方提供全量分页数据表"
        data-testid="a17-canvas"
      />
      {error && (
        <p role="alert" data-testid="a17-error">
          {error}
        </p>
      )}
      <p role="status" data-testid="a17-status">
        初始化：{ready ? 'SDK已就绪' : '等待GPU'}；数据 {visible.length} 点；拾取/选择：
        {visible.find((site) => site.id === picked)?.name ?? '未选择'}。
        {error ? '存在错误，请查看提示；数据表仍可用。' : ''}
      </p>
      <details>
        <summary>查看真实图层、属性和投影</summary>
        <pre>
          <output data-testid="a17-sdk-state">{JSON.stringify(snapshot, null, 2)}</output>
        </pre>
      </details>
      <nav className="a17-controls" aria-label="表格分页">
        <button
          type="button"
          disabled={pageData.page === 0}
          onClick={() => setPage(pageData.page - 1)}
        >
          上一页
        </button>
        <output data-testid="a17-page">
          第 {pageData.page + 1} / {pageData.pages} 页，共 {visible.length} 行
        </output>
        <button
          type="button"
          disabled={pageData.page + 1 >= pageData.pages}
          onClick={() => setPage(pageData.page + 1)}
        >
          下一页
        </button>
      </nav>
      <div className="a17-table-scroll">
        <table data-testid="a17-table">
          <caption>同源地理点全量分页表（每页12行）</caption>
          <thead>
            <tr>
              <th scope="col">名称</th>
              <th scope="col">状态</th>
              <th scope="col">数量</th>
              <th scope="col">操作</th>
            </tr>
          </thead>
          <tbody>
            {pageData.rows.map((site) => (
              <tr key={site.id} data-site-id={site.id}>
                <th scope="row">{site.name}</th>
                <td>{site.healthy ? '健康' : '暂停'}</td>
                <td>{site.volume}</td>
                <td>
                  <button
                    type="button"
                    aria-pressed={picked === site.id}
                    onClick={() => setPicked(site.id)}
                  >
                    选择{site.name}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        半径单位为像素。相同layer
        id复用GPU状态；选择只在DOM显示，不声称图上已有选中色。卸载finalize当前Deck，不处理其它实例。
      </p>
    </section>
  )
}
