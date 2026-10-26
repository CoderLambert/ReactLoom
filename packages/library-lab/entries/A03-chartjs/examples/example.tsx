import {useEffect, useMemo, useRef, useState} from 'react';
import {
  Chart, BarController, BarElement, LineController, LineElement, PointElement,
  CategoryScale, LinearScale, Legend, Tooltip,
} from 'chart.js';

Chart.register(
  BarController, BarElement, LineController, LineElement, PointElement,
  CategoryScale, LinearScale, Legend, Tooltip,
);

type Level = 'basic' | 'business' | 'advanced';
type ChartKind = 'bar' | 'line';
const labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
function safeCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}
function makeCounts(revision: number): number[] {
  return labels.map((_, index) => safeCount(110 + index * 17 + revision * (index + 3)));
}

export default function ChartJsExample({level}: {level: Level}) {
  const [kind, setKind] = useState<ChartKind>('bar');
  const [revision, setRevision] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart<ChartKind, number[], string> | null>(null);
  const counts = useMemo(() => makeCounts(revision), [revision]);
  const effectiveKind: ChartKind = level === 'advanced' ? kind : 'bar';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    // The canvas can only be owned by one Chart instance at a time.
    const chart = new Chart<ChartKind, number[], string>(context, {
      type: effectiveKind,
      data: {
        labels: [...labels],
        datasets: [{
          label: '阅读量',
          data: makeCounts(0),
          backgroundColor: 'rgba(49,113,82,0.7)',
          borderColor: '#317152',
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {legend: {display: true}},
        scales: {y: {beginAtZero: true}},
      },
    });
    chartRef.current = chart;
    return () => {
      chartRef.current = null;
      chart.destroy();
    };
  }, [effectiveKind]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.data.datasets[0].data = [...counts];
    chart.update('none');
  }, [counts, effectiveKind]);

  return <section aria-label="Chart.js 真实 Canvas 示例">
    <h2>{level === 'basic' ? 'Canvas 阅读量柱状图' :
      level === 'business' ? '可更新的业务统计' : '柱线切换与实例销毁'}</h2>
    <p>调用 chart.js 真实 Chart 构造函数；数据为固定公式生成的本地 fixture。</p>
    <div style={{display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14}}>
      <button type="button" onClick={() => setRevision(n => n + 1)}>模拟新增阅读</button>
      {level === 'advanced' && <label>图形类型
        <select aria-label="选择图形类型" value={kind}
          onChange={event => setKind(event.currentTarget.value as ChartKind)} style={{marginLeft: 8}}>
          <option value="bar">柱形</option><option value="line">折线</option>
        </select>
      </label>}
      <output aria-live="polite">七日总阅读：{counts.reduce((a, b) => a + b, 0)}</output>
    </div>
    <div style={{height: 310, position: 'relative', border: '1px solid #d7e3d6',
      background: '#fbfefb', borderRadius: 10, padding: 12}}>
      <canvas ref={canvasRef} role="img" aria-label="七日阅读量趋势 Canvas 图，下方表格提供精确数字"/>
    </div>
    <table style={{width: '100%', textAlign: 'left', fontSize: 13, marginTop: 15}}>
      <caption style={{textAlign: 'left'}}>Canvas 图表等价数据表</caption>
      <thead><tr><th scope="col">日期</th>{labels.map(day => <th scope="col" key={day}>{day}</th>)}</tr></thead>
      <tbody><tr><th scope="row">阅读数</th>{counts.map((count, i) => <td key={labels[i]}>{count}</td>)}</tr></tbody>
    </table>
    <p style={{fontSize: 12, color: '#607060', marginTop: 15}}>
      同一 Canvas 不得被两个未销毁的 Chart 实例占有；切换类型触发 effect 清理并重建。
    </p>
  </section>;
}
