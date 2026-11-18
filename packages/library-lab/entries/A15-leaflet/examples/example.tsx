import { useEffect, useMemo, useRef, useState } from 'react'
import { initialLocations } from './location-data'
import { selectedVisibleId, shiftLocation } from './location-policy'
import { createMapController, type MapController } from './map-controller'
import { canAddLocalLocation, makeLocalLocation } from './station-factory'
import 'leaflet/dist/leaflet.css'
import './workshop.css'

type Level = 'basic' | 'business' | 'advanced'
type Snapshot = ReturnType<MapController['observe']> & { instance: number }

export default function LeafletExample({ level }: { level: Level }) {
  const host = useRef<HTMLDivElement>(null)
  const owner = useRef<MapController | null>(null)
  const nextId = useRef(0)
  const instance = useRef(0)
  const [items, setItems] = useState(initialLocations)
  const [onlyOnline, setOnlyOnline] = useState(false)
  const [selected, setSelected] = useState('sea')
  const [narrow, setNarrow] = useState(false)
  const [revision, setRevision] = useState(0)
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [status, setStatus] = useState('尚未建立地图')
  const visible = useMemo(
    () => items.filter((item) => !onlyOnline || item.status === 'online'),
    [items, onlyOnline],
  )
  const selectedVisible = selectedVisibleId(items, onlyOnline, selected)
  useEffect(() => {
    if (selected !== selectedVisible) setSelected(selectedVisible)
  }, [selected, selectedVisible])

  // Instance ownership is structural; data/selection are updated in the separate effect below.
  // biome-ignore lint/correctness/useExhaustiveDependencies: revision recreates the map; data and selection do not.
  useEffect(() => {
    const element = host.current
    if (!element) return
    let controller: MapController | null = null
    const observe = () => {
      if (controller && owner.current === controller) {
        setSnapshot({ ...controller.observe(), instance: instance.current })
      }
    }
    controller = createMapController(element, setSelected, observe)
    owner.current = controller
    instance.current++
    controller.synchronize(visible, selectedVisible)
    controller.fitVisible()
    observe()
    setStatus('地图已就绪：无远程瓦片，点位来自本地数据')
    return () => {
      if (owner.current === controller) owner.current = null
      controller?.dispose()
    }
  }, [revision])
  // biome-ignore lint/correctness/useExhaustiveDependencies: revision installs an owner even if the current data did not change.
  useEffect(() => {
    owner.current?.synchronize(visible, selectedVisible)
  }, [visible, selectedVisible, revision])

  return (
    <section className="a15-workshop" aria-label="Leaflet 离线位置图" data-testid="a15-workshop">
      <h2>
        {level === 'basic'
          ? '经纬度、覆盖物与真实视口'
          : level === 'business'
            ? '过滤、稳定图层与安全弹窗'
            : '有界更新、尺寸与地图所有权'}
      </h2>
      <p>
        真实 Leaflet 1.9.4
        Map/LayerGroup/circleMarker；背景经纬网格是原创示意，不是行政底图。没有瓦片、地理编码或定位服务请求。
      </p>
      <div className="demo-controls">
        {level !== 'basic' && (
          <label>
            <input
              type="checkbox"
              checked={onlyOnline}
              onChange={(event) => setOnlyOnline(event.target.checked)}
            />
            仅显示已启用来源
          </label>
        )}
        <button
          type="button"
          disabled={visible.length === 0}
          onClick={() => owner.current?.fitVisible()}
        >
          定位全部可见点
        </button>
        <button type="button" onClick={() => owner.current?.resetView()}>
          重置视角
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
            <button
              type="button"
              onClick={() => setItems((old) => shiftLocation(old, 'sea', 0.25))}
              disabled={!items.some((item) => item.id === 'sea')}
            >
              模拟更新Seattle坐标
            </button>
            <button
              type="button"
              onClick={() => {
                if (!canAddLocalLocation(items)) return
                const station = makeLocalLocation(++nextId.current)
                setItems((old) => (canAddLocalLocation(old) ? [...old, station] : old))
                setSelected(station.id)
              }}
              disabled={!canAddLocalLocation(items)}
            >
              新增模拟来源（同时最多40条）
            </button>
            <button
              type="button"
              disabled={!selectedVisible}
              onClick={() => {
                const remaining = items.filter((item) => item.id !== selectedVisible)
                setItems(remaining)
                setSelected(selectedVisibleId(remaining, onlyOnline, ''))
              }}
            >
              删除选中
            </button>
            <button type="button" onClick={() => setRevision((value) => value + 1)}>
              重新创建地图
            </button>
          </>
        )}
      </div>
      <p role="status" data-testid="a15-status">
        {status}
      </p>
      <div
        ref={host}
        className="a15-stage"
        data-testid="a15-map"
        style={{ width: narrow ? 320 : '100%' }}
      />
      <p data-testid="a15-summary">
        共有 {items.length} 个来源，当前显示 {visible.length} 个；选中{' '}
        {items.find((item) => item.id === selectedVisible)?.label ?? '无'}。
      </p>
      <p data-testid="a15-selection">
        选中ID：{selectedVisible || '无'}。额外来源{' '}
        {items.filter((item) => /^site-[1-9]\d*$/u.test(item.id)).length}/40。
      </p>
      <div className="a15-table">
        <table>
          <caption>点位与状态数据表（地图的等价文本操作）</caption>
          <thead>
            <tr>
              <th scope="col">位置</th>
              <th scope="col">状态</th>
              <th scope="col">Leaflet [纬度, 经度]</th>
              <th scope="col">操作</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <tr key={item.id} data-testid={`a15-row-${item.id}`}>
                <td>
                  {item.city} · {item.label}
                </td>
                <td>{item.status === 'online' ? '启用' : '暂停'}</td>
                <td>{item.center.map((value) => value.toFixed(4)).join(', ')}</td>
                <td>
                  <button
                    type="button"
                    aria-pressed={selectedVisible === item.id}
                    onClick={() => {
                      setSelected(item.id)
                      owner.current?.focus(item.id)
                    }}
                  >
                    定位 {item.label}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visible.length === 0 && (
        <p data-testid="a15-empty">当前没有可见点位，可取消筛选或新增本地来源。</p>
      )}
      <details>
        <summary>查看真实地图与图层结果</summary>
        <p>
          center/zoom/size/bounds与点位/半径/弹窗由实际Leaflet
          getter读取；layerId用于观察同一图层复用。instance是本例创建序号。0瓦片图层不替代浏览器网络观察。
        </p>
        <pre data-testid="a15-sdk-state">{JSON.stringify(snapshot, null, 2)}</pre>
      </details>
      <p>
        仅本地数组更新；筛选和选择保留Map与仍可见的circleMarker，不自动移动相机。定位全部是显式fitBounds；移除点位解绑其事件和弹窗，卸载断开ResizeObserver、取消rAF并remove整个Map。
      </p>
    </section>
  )
}
