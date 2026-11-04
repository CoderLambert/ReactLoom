import { useEffect, useMemo, useRef, useState } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import {shouldRunStream} from './stream-policy';

type Level = 'basic' | 'business' | 'advanced';
const START = Math.floor(Date.UTC(2026, 9, 26, 0, 0, 0) / 1000);
const WINDOW = 100;
function createSeries(total: number, shift: number, level: Level): uPlot.AlignedData {
  const x: number[] = [], latency: Array<number | null> = [], errors: number[] = [];
  const begin = Math.max(0, total + shift - WINDOW);
  for (let i = begin; i < total + shift; i++) {
    x.push(START + i * 60);
    latency.push(level === 'advanced' && i % 17 === 0 ? null : Math.round(75 + Math.sin(i / 5) * 26 + (i % 9) * 5));
    errors.push(i % 11 === 0 ? 3 : i % 5 === 0 ? 1 : 0);
  }
  return level === 'basic' ? [x, latency] : [x, latency, errors];
}
function TelemetryChart({ data, level }: { data: uPlot.AlignedData; level: Level }) {
  const host = useRef<HTMLDivElement>(null);
  const plot = useRef<uPlot | null>(null);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let animationFrame = 0;
    const options: uPlot.Options = {
      width: Math.max(280, Math.floor(element.clientWidth)), height: 250,
      scales: { x: { time: true }, ...(level !== 'basic' ? { errors: { auto: true } } : {}) },
      axes: [{}, { label: '耗时 / ms' }, ...(level !== 'basic' ? [{ scale: 'errors', side: 1 as const, label: '错误数' }] : [])],
      series: [{}, { label: '延迟', stroke: '#257653', width: 2 },
        ...(level !== 'basic' ? [{ label: '错误数', scale: 'errors', stroke: '#c2753a', width: 1.5 }] : [])],
    };
    const instance = new uPlot(options, data, element);
    plot.current = instance;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        if (plot.current !== instance) return;
        const width = Math.max(280, Math.floor(element.clientWidth));
        if (width !== instance.width) instance.setSize({ width, height: 250 });
      });
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrame);
      instance.destroy();
      if (plot.current === instance) plot.current = null;
    };
  }, [level]); // series/axes change -> rebuild; data-only changes -> setData
  // Streaming moves the x-axis window; reset auto scales or fresh points disappear off-screen.
  useEffect(() => { plot.current?.setData(data); }, [data]);
  return <div ref={host} role="img" aria-label="uPlot 时间序列走势（下方表格提供等价数据）" style={{ width: '100%', minWidth: 280 }} />;
}
export default function UplotExample({ level }: { level: Level }) {
  const [samples, setSamples] = useState(28);
  const [shift, setShift] = useState(0);
  const [stream, setStream] = useState(false);
  const [overrideReducedMotion, setOverrideReducedMotion] = useState(false);
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || document.visibilityState === 'visible');
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    if (level !== 'advanced') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncVisibility = () => setVisible(document.visibilityState === 'visible');
    const syncReducedMotion = () => setReducedMotion(media.matches);
    syncVisibility(); syncReducedMotion();
    document.addEventListener('visibilitychange', syncVisibility);
    media.addEventListener('change', syncReducedMotion);
    return () => {
      document.removeEventListener('visibilitychange', syncVisibility);
      media.removeEventListener('change', syncReducedMotion);
    };
  }, [level]);
  const canStream = shouldRunStream({advanced:level === 'advanced',requested:stream,visible,reducedMotion,overrideReducedMotion});
  useEffect(() => { setSamples(28); setShift(0); setStream(false); }, [level]);
  useEffect(() => {
    if (!canStream) return;
    const timer = window.setInterval(() => setShift(x => x + 1), 650);
    return () => window.clearInterval(timer);
  }, [canStream]);
  const data = useMemo(() => createSeries(samples, shift, level), [samples, shift, level]);
  const end = data[0].length;
  return <section aria-label="uPlot 实时数据示例">
    <h2>{level === 'basic' ? '每分钟延迟走势' : level === 'business' ? '新闻源请求遥测看板' : '滚动窗口与缺失点'}</h2>
    <p>真实 uPlot Canvas：应用管理列对齐数据，图表对象仅在挂载时创建；新采样使用 setData。</p>
    <div className="demo-controls">
      <label>采样数量 <select value={samples} onChange={e => setSamples(Number(e.target.value))}>
        {[28, 60, 100].map(n => <option key={n} value={n}>{n}</option>)}
      </select></label>
      {level === 'advanced' && <>
        <button type="button" onClick={() => setStream(v => !v)}>{stream ? '暂停模拟采样' : '开始模拟采样'}</button>
        <button type="button" onClick={() => { setStream(false); setShift(0); }}>清空增量并重置</button>
        <label><input type="checkbox" checked={overrideReducedMotion} onChange={e => setOverrideReducedMotion(e.target.checked)}/>明确允许在减少动态偏好下采样</label>
      </>}
    </div>
    {level === 'advanced' && stream && !canStream && <p role="status">采样已暂停：{!visible ? '页面位于后台' : '遵循系统减少动态偏好'}。返回可见页面或明确覆盖偏好后会恢复。</p>}
    <TelemetryChart data={data} level={level} />
    <p role="status">当前数据点 {end}；窗口上限 {WINDOW}；最后时间戳 {new Date(data[0][end - 1] * 1000).toLocaleString('zh-CN')}</p>
    <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', textAlign: 'left' }}><caption>最近五个采样（Canvas 的文字替代）</caption>
      <thead><tr><th scope="col">采样时间</th><th scope="col">延迟 (ms)</th>{level !== 'basic' && <th scope="col">错误数</th>}</tr></thead>
      <tbody>{Array.from(data[0].slice(-5)).map((t, i) => {
        const idx = end - Math.min(5, end) + i;
        return <tr key={t}><td>{new Date(t * 1000).toLocaleTimeString('zh-CN')}</td><td>{data[1][idx] ?? '缺失'}</td>
          {level !== 'basic' && <td>{data[2][idx]}</td>}</tr>;
      })}</tbody></table></div>
    {level === 'advanced' && <p>缺失数据用 null 表示，不用 0 代替；离开 Tab 会停止计时器并 destroy Canvas，重新进入不会沿用旧实例。</p>}
  </section>;
}
