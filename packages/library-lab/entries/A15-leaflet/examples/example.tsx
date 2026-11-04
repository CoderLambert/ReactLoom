import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {makeLocalLocation, canAddLocalLocation} from './station-factory';
import {selectedVisibleId,shiftLocation} from './location-policy';

type Level = 'basic' | 'business' | 'advanced';
type Location = { id: string; label: string; city: string; center: [number, number]; status: 'online' | 'paused' };
const INITIAL: Location[] = [
  { id: 'sea', label: '技术 RSS', city: 'Seattle', center: [47.6062, -122.3321], status: 'online' },
  { id: 'sfo', label: '产品更新', city: 'San Francisco', center: [37.7749, -122.4194], status: 'online' },
  { id: 'nyc', label: '行业资讯', city: 'New York', center: [40.7128, -74.006], status: 'paused' },
];
export default function LeafletExample({ level }: { level: Level }) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const groupRef = useRef<L.LayerGroup | null>(null);
  const nextId = useRef(0);
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<Location[]>(INITIAL);
  const [onlyOnline, setOnlyOnline] = useState(false);
  const [selected, setSelected] = useState('sea');
  const selectedVisible = selectedVisibleId(items, onlyOnline, selected);
  useEffect(() => { if (selected !== selectedVisible) setSelected(selectedVisible); }, [selected, selectedVisible]);
  useEffect(() => { setItems(INITIAL); setSelected('sea'); setOnlyOnline(false); }, [level]);
  useEffect(() => {
    const element = host.current; if (!element) return;
    const map = L.map(element, {
      scrollWheelZoom: false, zoomControl: true, keyboard: true, attributionControl: false,
    }).setView([39.5, -98], 4);
    mapRef.current = map;
    const group = L.layerGroup().addTo(map); groupRef.current = group;
    let raf = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { if (mapRef.current === map) map.invalidateSize({ pan: false }); });
    });
    observer.observe(element);
    // No external tile provider is contacted. The colored grid is an original visualization.
    for (const lon of [-130, -120, -110, -100, -90, -80, -70]) {
      L.polyline([[25, lon], [51, lon]], { color: '#dce8dd', weight: 1, interactive: false }).addTo(map);
    }
    for (const lat of [25, 30, 35, 40, 45, 50]) {
      L.polyline([[lat, -132], [lat, -67]], { color: '#dce8dd', weight: 1, interactive: false }).addTo(map);
    }
    setReady(true);
    return () => {
      observer.disconnect(); cancelAnimationFrame(raf);
      group.clearLayers(); map.remove();
      if (mapRef.current === map) mapRef.current = null;
      if (groupRef.current === group) groupRef.current = null;
    };
  }, []);
  useEffect(() => {
    const group = groupRef.current;
    if (!ready || !group) return;
    group.clearLayers();
    const visible = items.filter(item => !onlyOnline || item.status === 'online');
    if (visible.length > 1) {
      L.polyline(visible.map(item => item.center), { color: '#739787', weight: 2, dashArray: '5 5', interactive: false }).addTo(group);
    }
    for (const item of visible) {
      const dot = L.circleMarker(item.center, {
        radius: item.id === selectedVisible ? 12 : 8,
        weight: item.id === selectedVisible ? 3 : 1,
        color: '#285e46', fillColor: item.status === 'online' ? '#5db47b' : '#b8a38a', fillOpacity: .9,
      }).addTo(group);
      dot.on('click', () => setSelected(item.id));
      // Leaflet accepts DOM nodes for popups; never interpolate untrusted HTML.
      const popup = document.createElement('div');
      const heading = document.createElement('strong');
      heading.textContent = item.label;
      const status = document.createElement('p');
      status.textContent = `${item.city} · ${item.status === 'online' ? '已启用' : '已暂停'}`;
      popup.append(heading, status);
      dot.bindPopup(popup);
    }
  }, [ready, items, onlyOnline, selectedVisible]);
  const visible = items.filter(item => !onlyOnline || item.status === 'online');
  const focusLocation = (item: Location) => {
    setSelected(item.id);
    mapRef.current?.panTo(item.center, { animate: false });
  };
  return <section aria-label="Leaflet 离线位置图">
    <h2>{level === 'basic' ? '坐标与图层' : level === 'business' ? 'RSS 来源位置筛选' : '离线地理数据更新与资源清理'}</h2>
    <p>真实 Leaflet 1.9 Map/LayerGroup/circleMarker：不请求瓦片服务器，背景经纬网格仅为示意，不是行政地图。</p>
    <div ref={host} role="region" aria-label="可平移缩放的Leaflet点位地图" tabIndex={0}
      style={{ height: 310, minHeight: 310, width: '100%', background: '#f3f8ef', border: '1px solid #c7d9c5', borderRadius: 8 }} />
    <div className="demo-controls">
      {level !== 'basic' && <label><input type="checkbox" checked={onlyOnline} onChange={e => setOnlyOnline(e.target.checked)}/>仅显示已启用来源</label>}
      {level === 'advanced' && <>
        <button type="button" onClick={() => setItems(old => shiftLocation(old, 'sea', .25))}
          disabled={!items.some(item => item.id === 'sea')}>模拟更新Seattle坐标</button>
        <button type="button" onClick={() => {
          if (!canAddLocalLocation(items)) return;
          const station = makeLocalLocation(++nextId.current);
          setItems(old => canAddLocalLocation(old) ? [...old, station] : old);
          setSelected(station.id);
        }} disabled={!canAddLocalLocation(items)}>新增模拟来源（同时最多40条）</button>
        <button type="button" onClick={() => {
          const remaining=items.filter(item => item.id !== selectedVisible);
          setItems(remaining);
          setSelected(selectedVisibleId(remaining,onlyOnline,''));
        }} disabled={!selectedVisible}>删除选中</button>
      </>}
      <button type="button" onClick={() => mapRef.current?.setView([39.5, -98], 4)}>重置视角</button>
    </div>
    <p role="status">共有 {items.length} 个来源，当前显示 {visible.length} 个；选中 {items.find(x => x.id === selectedVisible)?.label ?? '无'}。</p>
    <table><caption>点位与状态数据表（地图的等价文本操作）</caption><thead><tr><th scope="col">位置</th><th scope="col">状态</th><th scope="col">坐标</th><th scope="col">操作</th></tr></thead>
      <tbody>{visible.map(item => <tr key={item.id}><td>{item.city} · {item.label}</td><td>{item.status === 'online' ? '启用' : '暂停'}</td><td>{item.center.map(n => n.toFixed(2)).join(', ')}</td>
        <td><button type="button" onClick={() => focusLocation(item)}>地图定位</button></td></tr>)}</tbody></table>
    {level === 'advanced' && <p>离开页面将精确停止ResizeObserver、清除本Demo图层和整个Map。仅本地数据，不向任意地图服务发送位置。</p>}
  </section>;
}
