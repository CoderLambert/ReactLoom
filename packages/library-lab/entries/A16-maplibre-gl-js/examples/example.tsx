import type {
  GeoJSONSource,
  ErrorEvent as MapErrorEvent,
  Map as MapInstance,
  MapLayerMouseEvent,
} from 'maplibre-gl'
import * as maplibregl from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { useEffect, useMemo, useRef, useState } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import { canResizeMap, resolveVisibleStation } from './selection-policy'
import { MAX_EXTRA_STATIONS, makeLocalStation } from './station-factory'
import './styles.css'

type Level = 'basic' | 'business' | 'advanced'
type Station = { id: string; label: string; longitude: number; latitude: number; healthy: boolean }
const BASE: Station[] = [
  { id: 'beijing', label: '北京技术资讯', longitude: 116.4, latitude: 39.9, healthy: true },
  { id: 'tianjin', label: '天津产品日报', longitude: 117.2, latitude: 39.13, healthy: true },
  {
    id: 'shijiazhuang',
    label: '石家庄工程动态',
    longitude: 114.5,
    latitude: 38.05,
    healthy: false,
  },
]
function asGeoJson(rows: Station[]) {
  return {
    type: 'FeatureCollection' as const,
    features: rows.map((row) => ({
      type: 'Feature' as const,
      id: row.id,
      properties: { id: row.id, label: row.label, healthy: row.healthy },
      geometry: { type: 'Point' as const, coordinates: [row.longitude, row.latitude] },
    })),
  }
}
const EMPTY_STYLE = { version: 8 as const, name: 'Tile-free laboratory', sources: {}, layers: [] }
type Snapshot = {
  width: number
  height: number
  sourceLoaded: boolean
  renderedIds: string[]
  points: { id: string; healthy: boolean; x: number; y: number }[]
  renderedHealth: Record<string, boolean>
  center: [number, number]
  workerUrl: string
}

export default function MapLibreExample({ level }: { level: Level }) {
  const host = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapInstance | null>(null)
  const capture = useRef<(() => void) | null>(null)
  const nextId = useRef(0)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [stations, setStations] = useState<Station[]>(BASE)
  const [onlyHealthy, setOnlyHealthy] = useState(false)
  const [selected, setSelected] = useState('beijing')
  const visible = useMemo(
    () =>
      level === 'basic'
        ? stations.slice(0, 2)
        : stations.filter((station) => !onlyHealthy || station.healthy),
    [stations, onlyHealthy, level],
  )
  const visibleRef = useRef(visible)
  useEffect(() => {
    visibleRef.current = visible
  }, [visible])
  const visibleSelected = resolveVisibleStation(visible, selected)
  useEffect(() => {
    if (selected !== visibleSelected) setSelected(visibleSelected)
  }, [selected, visibleSelected])

  useEffect(() => {
    const node = host.current
    if (!node) return
    setReady(false)
    setError('')
    setSnapshot(null)
    let map: MapInstance
    try {
      // The matching standalone asset is emitted by Vite; no guessed adjacent URL after bundling.
      maplibregl.setWorkerUrl(workerUrl)
      map = new maplibregl.Map({
        container: node,
        style: EMPTY_STYLE,
        center: [116.1, 39.1],
        zoom: 6,
        attributionControl: false,
        cooperativeGestures: true,
        trackResize: false,
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'WebGL2初始化失败；仍可用数据表')
      return
    }
    mapRef.current = map
    let raf = 0
    let attached = false
    let disposed = false
    let observation = 0
    let removed = false
    const onRemoved = () => {
      removed = true
    }
    const observe = () => {
      if (disposed || mapRef.current !== map || !map.getLayer('stations')) return
      const source = map.getSource('stations') as GeoJSONSource | undefined
      if (!source) return
      const ticket = ++observation
      void source
        .getData()
        .then((data) => {
          if (disposed || mapRef.current !== map || ticket !== observation) return
          const points: Snapshot['points'] = []
          if (data.type === 'FeatureCollection') {
            for (const feature of data.features) {
              const id = feature.properties?.id
              if (feature.geometry?.type !== 'Point' || typeof id !== 'string') continue
              const projected = map.project([
                feature.geometry.coordinates[0],
                feature.geometry.coordinates[1],
              ])
              points.push({
                id,
                healthy: feature.properties?.healthy === true,
                x: projected.x,
                y: projected.y,
              })
            }
          }
          const rendered = map.queryRenderedFeatures({ layers: ['stations'] })
          const renderedIds = [
            ...new Set(
              rendered.flatMap((feature) =>
                typeof feature.properties?.id === 'string' ? [feature.properties.id] : [],
              ),
            ),
          ].sort()
          const renderedHealth = Object.fromEntries(
            rendered.flatMap((feature) =>
              typeof feature.properties?.id === 'string'
                ? [[feature.properties.id, feature.properties?.healthy === true]]
                : [],
            ),
          )
          const center = map.getCenter()
          setSnapshot({
            width: map.getCanvas().clientWidth,
            height: map.getCanvas().clientHeight,
            sourceLoaded: map.isSourceLoaded('stations'),
            renderedIds,
            renderedHealth,
            points,
            center: [center.lng, center.lat],
            workerUrl: maplibregl.getWorkerUrl(),
          })
        })
        .catch((cause) => {
          if (!disposed && mapRef.current === map && ticket === observation) setError(String(cause))
        })
    }
    capture.current = observe
    const onSelect = (event: MapLayerMouseEvent) => {
      const id = event.features?.[0]?.properties?.id
      if (!disposed && typeof id === 'string') setSelected(id)
    }
    const onError = (event: MapErrorEvent) => {
      if (!disposed) setError(event.error?.message ?? 'MapLibre渲染错误')
    }
    const onContextLost = () => {
      if (!disposed) {
        setReady(false)
        setSnapshot(null)
        setError('WebGL上下文丢失，数据表仍可操作')
      }
    }
    const onContextRestored = () => {
      if (!disposed && mapRef.current === map) {
        setError('')
        setReady(Boolean(map.getSource('stations') && map.getLayer('stations')))
        observe()
      }
    }
    const onLoad = () => {
      if (disposed || mapRef.current !== map) return
      try {
        map.addSource('stations', { type: 'geojson', data: asGeoJson(visibleRef.current) })
        map.addLayer({
          id: 'stations',
          type: 'circle',
          source: 'stations',
          paint: {
            'circle-radius': 11,
            'circle-color': ['case', ['boolean', ['get', 'healthy'], false], '#237a56', '#c78939'],
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 2,
          },
        })
        map.on('click', 'stations', onSelect)
        attached = true
        setReady(true)
      } catch (cause) {
        setReady(false)
        setError(cause instanceof Error ? cause.message : '图层初始化失败')
      }
    }
    map.on('load', onLoad)
    map.on('error', onError)
    map.on('webglcontextlost', onContextLost)
    map.on('webglcontextrestored', onContextRestored)
    map.on('idle', observe)
    map.on('moveend', observe)
    map.on('remove', onRemoved)
    const observer = new ResizeObserver(() => {
      if (disposed) return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        if (canResizeMap(node.clientWidth, node.clientHeight, !disposed && mapRef.current === map))
          map.resize()
      })
    })
    observer.observe(node)
    return () => {
      disposed = true
      ++observation
      observer.disconnect()
      cancelAnimationFrame(raf)
      map.off('load', onLoad)
      map.off('error', onError)
      map.off('webglcontextlost', onContextLost)
      map.off('webglcontextrestored', onContextRestored)
      map.off('idle', observe)
      map.off('moveend', observe)
      if (attached) map.off('click', 'stations', onSelect)
      if (mapRef.current === map) {
        mapRef.current = null
        capture.current = null
      }
      map.remove()
      map.off('remove', onRemoved)
      node.dataset.a16Cleanup = JSON.stringify({
        removed,
        canvases: node.querySelectorAll('canvas').length,
      })
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    const source = map.getSource('stations') as GeoJSONSource | undefined
    if (!source) return
    let active = true
    // 6.15.0 flush completion is not a success/paint receipt: errors also arrive through map.error.
    void source
      .setData(asGeoJson(visible))
      .then(() => {
        if (active && mapRef.current === map) capture.current?.()
      })
      .catch((cause) => {
        if (active && mapRef.current === map) setError(String(cause))
      })
    return () => {
      active = false
    }
  }, [visible, ready])

  function addStation() {
    if (nextId.current >= MAX_EXTRA_STATIONS) return
    const station = makeLocalStation(++nextId.current)
    setStations((old) => [...old, station])
    setSelected(station.id)
  }
  return (
    <section
      className="a16-workshop"
      aria-label="MapLibre GL JS 真实地图示例"
      data-testid="a16-workshop"
      data-ready={ready}
      data-selected={visibleSelected}
      data-visible={visible.length}
    >
      <h2>
        {level === 'basic'
          ? '空白样式与真实点层'
          : level === 'business'
            ? '来源健康状态与过滤'
            : '动态GeoJSON与局部资源清理'}
      </h2>
      <p>
        真实WebGL2引擎、内联空样式和本地GeoJSON；没有外部底图、地理编码或付费API。Worker脚本是同源构建资源。
      </p>
      {level !== 'basic' && (
        <fieldset className="a16-controls">
          <legend>来源数据</legend>
          <label>
            <input
              type="checkbox"
              checked={onlyHealthy}
              onChange={(event) => setOnlyHealthy(event.target.checked)}
            />
            只看在线来源
          </label>
          {level === 'advanced' && (
            <>
              <button
                type="button"
                onClick={addStation}
                disabled={nextId.current >= MAX_EXTRA_STATIONS}
              >
                新增本地站点（最多40条）
              </button>
              <button
                type="button"
                onClick={() => {
                  nextId.current = 0
                  setStations(BASE)
                  setSelected('beijing')
                  setOnlyHealthy(false)
                }}
              >
                恢复初始状态
              </button>
            </>
          )}
        </fieldset>
      )}
      <div
        ref={host}
        className="a16-map"
        role="img"
        aria-label="MapLibre点层，下方提供等价数据表"
        data-testid="a16-map"
      />
      {error && (
        <p role="alert" data-testid="a16-error">
          {error}
        </p>
      )}
      <p role="status" data-testid="a16-status">
        源与图层：{ready ? '已建立' : '等待初始化或WebGL恢复'}；当前表格 {visible.length} 站；选择{' '}
        {visible.find((station) => station.id === visibleSelected)?.label ?? '无'}
        。实际源与已渲染要素见下方SDK观察。
      </p>
      <details>
        <summary>查看真实源、渲染要素与投影</summary>
        <pre>
          <output data-testid="a16-sdk-state">{JSON.stringify(snapshot, null, 2)}</output>
        </pre>
      </details>
      <div className="a16-table-scroll">
        <table data-testid="a16-table">
          <caption>本地地理点位数据：经度在前，纬度在后</caption>
          <thead>
            <tr>
              <th scope="col">来源</th>
              <th scope="col">经度</th>
              <th scope="col">纬度</th>
              <th scope="col">健康状态</th>
              <th scope="col">操作</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((station) => (
              <tr
                key={station.id}
                data-station-id={station.id}
                data-selected={visibleSelected === station.id}
              >
                <th scope="row">{station.label}</th>
                <td>{station.longitude.toFixed(3)}</td>
                <td>{station.latitude.toFixed(3)}</td>
                <td>{station.healthy ? '在线' : '暂停'}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(station.id)
                      mapRef.current?.easeTo({
                        center: [station.longitude, station.latitude],
                        duration: 0,
                      })
                    }}
                  >
                    定位
                  </button>
                  {level === 'advanced' && (
                    <button
                      type="button"
                      onClick={() =>
                        setStations((old) =>
                          old.map((item) =>
                            item.id === station.id ? { ...item, healthy: !item.healthy } : item,
                          ),
                        )
                      }
                    >
                      切换健康状态
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Map/Worker由SDK管理；卸载只移除本实例的事件、观察者、rAF和地图。不清理全局Worker池或其它地图。
      </p>
    </section>
  )
}
