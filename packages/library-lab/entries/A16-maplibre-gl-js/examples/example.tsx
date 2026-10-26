import {useEffect, useMemo, useRef, useState} from 'react';
import * as maplibregl from 'maplibre-gl';
import type {GeoJSONSource, Map as MapInstance, MapLayerMouseEvent} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// A tile-free laboratory: MapLibre renders genuine vector layers, without map credentials.
type Level = 'basic' | 'business' | 'advanced';
type Station = {id: string; label: string; longitude: number; latitude: number; healthy: boolean};
const BASE: Station[] = [
  {id: 'beijing', label: '北京技术资讯', longitude: 116.4, latitude: 39.9, healthy: true},
  {id: 'tianjin', label: '天津产品日报', longitude: 117.2, latitude: 39.13, healthy: true},
  {id: 'shijiazhuang', label: '石家庄工程动态', longitude: 114.5, latitude: 38.05, healthy: false},
];
function asGeoJson(rows: Station[]) {
  return {type: 'FeatureCollection' as const,
    features: rows.map(row => ({
      type: 'Feature' as const,
      properties: {id: row.id, label: row.label, healthy: row.healthy},
      geometry: {type: 'Point' as const, coordinates: [row.longitude, row.latitude]},
    })),
  };
}
const EMPTY_STYLE = {version: 8 as const, name: 'Offline laboratory', sources: {}, layers: []};

export default function MapLibreExample({level}: {level: Level}) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const nextId = useRef(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [stations, setStations] = useState<Station[]>(BASE);
  const [onlyHealthy, setOnlyHealthy] = useState(false);
  const [selected, setSelected] = useState('beijing');
  const visible = useMemo(
    () => level === 'basic' ? stations.slice(0, 2) : stations.filter(s => !onlyHealthy || s.healthy),
    [stations, onlyHealthy, level],
  );

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    // Style is local and intentionally has no tile/sprite/glyph requests.
    let map: MapInstance;
    try {
      map = new maplibregl.Map({
        container: node, style: EMPTY_STYLE, center: [116.1, 39.1], zoom: 6,
        attributionControl: false, cooperativeGestures: true,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : '此设备的 WebGL2 初始化失败，请改用下方数据表');
      return;
    }
    mapRef.current = map;
    let raf = 0;
    let attached = false;
    const onSelect = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const id = feature?.properties?.id;
      if (typeof id === 'string') setSelected(id);
    };
    const onError = (event: {error?: Error}) => {
      setError(event.error?.message ?? 'MapLibre 渲染错误');
    };
    const onLoad = () => {
      map.addSource('stations', {type: 'geojson', data: asGeoJson(BASE)});
      map.addLayer({id: 'stations', type: 'circle', source: 'stations',
        paint: {'circle-radius': 11, 'circle-color': [
          'case', ['boolean', ['get', 'healthy'], false], '#237a56', '#c78939',
        ], 'circle-stroke-color': '#fff', 'circle-stroke-width': 2},
      });
      map.on('click', 'stations', onSelect);
      attached = true;
      setReady(true);
    };
    map.on('load', onLoad);
    map.on('error', onError);
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {if (mapRef.current === map) map.resize();});
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      map.off('load', onLoad);
      map.off('error', onError);
      if (attached) map.off('click', 'stations', onSelect);
      map.remove();
      if (mapRef.current === map) mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const source = map.getSource('stations') as GeoJSONSource | undefined;
    source?.setData(asGeoJson(visible));
  }, [visible, ready]);

  function addStation() {
    nextId.current += 1;
    const id = 'local-' + nextId.current;
    setStations(old => [...old, {id, label: '本地站点 ' + nextId.current,
      longitude: 115 + nextId.current * 0.12, latitude: 38.4, healthy: true}]);
    setSelected(id);
  }
  function toggle(id: string) {
    setStations(old => old.map(s => s.id === id ? {...s, healthy: !s.healthy} : s));
  }
  return <section aria-label="MapLibre GL JS 真实地图示例">
    <h2>{level === 'basic' ? '离线样式与矢量点层' :
      level === 'business' ? '新闻来源健康状态图层' : '动态 GeoJSON 与图层更新'}</h2>
    <p>真实 MapLibre WebGL 引擎 + 内联 Style + GeoJSON；不请求地图瓦片、地理编码或付费 API。</p>
    {level !== 'basic' && <div className="demo-controls">
      <label><input type="checkbox" checked={onlyHealthy}
        onChange={e => setOnlyHealthy(e.target.checked)}/> 只看在线来源</label>
      {level === 'advanced' && <>
        <button type="button" onClick={addStation}>新增本地站点</button>
        <button type="button" onClick={() => {setStations(BASE); setSelected('beijing'); setOnlyHealthy(false);}}>恢复初始状态</button>
      </>}
    </div>}
    <div ref={host} role="img" aria-label="MapLibre 地图点层，下方有等价的可操作表格"
      style={{height: 300, width: '100%', background: '#e8ede6', borderRadius: 8}}/>
    {error && <p role="alert">{error}</p>}
    <p role="status">图层：{ready ? '已加载' : '等待地图初始化或 WebGL'}；
      可见站点：{visible.length}；当前选择：{stations.find(s => s.id === selected)?.label ?? '无'}。</p>
    <div style={{overflowX: 'auto'}}><table>
      <caption>离线地理点位数据（提供键盘和读屏替代操作）</caption>
      <thead><tr><th scope="col">来源</th><th scope="col">经度</th><th scope="col">纬度</th><th scope="col">健康状态</th><th scope="col">操作</th></tr></thead>
      <tbody>{visible.map(s => <tr key={s.id}>
        <th scope="row">{s.label}</th><td>{s.longitude.toFixed(3)}</td><td>{s.latitude.toFixed(3)}</td>
        <td>{s.healthy ? '在线' : '暂停'}</td><td>
          <button type="button" onClick={() => {setSelected(s.id);mapRef.current?.easeTo({center: [s.longitude, s.latitude], duration: 0});}}>定位</button>
          {level === 'advanced' && <button type="button" onClick={() => toggle(s.id)}>切换健康状态</button>}
        </td></tr>)}</tbody>
    </table></div>
    {level === 'advanced' && <p>更新仅修改现有 GeoJSONSource；卸载取消 ResizeObserver、rAF、地图事件并调用 map.remove()。不能将此无底图示例宣传为正式地理底图。</p>}
  </section>;
