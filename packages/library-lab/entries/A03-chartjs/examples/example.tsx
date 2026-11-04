import {useEffect, useMemo, useRef, useState} from 'react';
import {chartCounts, nextRevision, shouldAutoSample, MAX_REVISION} from './chart-stream-policy';
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

export default function ChartJsExample({level}: {level: Level}) {
  const [kind, setKind] = useState<ChartKind>('bar');
  const [revision, setRevision] = useState(0);
  const [autoSample, setAutoSample] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [tabVisible, setTabVisible] = useState(() =>
    typeof document === 'undefined' || document.visibilityState === 'visible');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart<ChartKind, number[], string> | null>(null);
  const counts = useMemo(() => chartCounts(revision), [revision]);
  const effectiveKind: ChartKind = level === 'advanced' ? kind : 'bar';

  useEffect(() => {
    const updateVisibility = () => setTabVisible(document.visibilityState === 'visible');
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  useEffect(() => {
    if (!shouldAutoSample(autoSample, level, tabVisible, revision)) return;
    const timer = window.setInterval(() => setRevision(nextRevision), 400);
    return () => window.clearInterval(timer);
  }, [autoSample, level, tabVisible, revision]);

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
          data: chartCounts(revision),
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
        onClick: (_event, elements) => {
          const index = elements[0]?.index;
          if (typeof index === 'number' && index >= 0 && index < labels.length) setSelectedDay(index);
        },
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

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.setActiveElements(selectedDay === null ? [] : [{datasetIndex: 0, index: selectedDay}]);
    chart.update('none');
  }, [selectedDay, effectiveKind]);

  return <section aria-label="Chart.js 真实 Canvas 示例">
    <h2>{level === 'basic' ? 'Canvas 阅读量柱状图' :
      level === 'business' ? '可更新的业务统计' : '柱线切换与实例销毁'}</h2>
    <p>调用 chart.js 真实 Chart 构造函数；数据为固定公式生成的本地 fixture。</p>
    <div style={{display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14}}>
      <button type="button" disabled={revision >= MAX_REVISION} onClick={() => setRevision(nextRevision)}>模拟新增阅读</button>
      {level === 'advanced' && <label><input type="checkbox" checked={autoSample}
        onChange={event => setAutoSample(event.currentTarget.checked)}/>
        自动采样（400ms，后台暂停）
      </label>}
      {level === 'advanced' && <label>图形类型
        <select aria-label="选择图形类型" value={kind}
          onChange={event => setKind(event.currentTarget.value as ChartKind)} style={{marginLeft: 8}}>
          <option value="bar">柱形</option><option value="line">折线</option>
        </select>
      </label>}
      <output aria-live="polite">七日总阅读：{counts.reduce((a, b) => a + b, 0)}</output>
      <output role="status">{selectedDay === null ? "可点选图形或使用下方表格按钮" :
        `${labels[selectedDay]}：${counts[selectedDay]} 次阅读`}</output>
    </div>
    <div style={{height: 310, position: 'relative', border: '1px solid #d7e3d6',
      background: '#fbfefb', borderRadius: 10, padding: 12}}>
      <canvas ref={canvasRef} role="img" aria-label="七日阅读量趋势 Canvas 图，下方表格提供精确数字"/>
    </div>
    <table style={{width: '100%', textAlign: 'left', fontSize: 13, marginTop: 15}}>
      <caption style={{textAlign: 'left'}}>Canvas 图表等价数据表</caption>
      <thead><tr><th scope="col">日期</th>{labels.map(day => <th scope="col" key={day}>{day}</th>)}</tr></thead>
      <tbody><tr><th scope="row">阅读数</th>{counts.map((count, i) => <td key={labels[i]}><button type="button"
        aria-label={`选中${labels[i]}的阅读量 ${count}`} aria-pressed={selectedDay === i}
        onClick={() => setSelectedDay(i)}>{count}</button></td>)}</tr></tbody>
    </table>
    <p style={{fontSize: 12, color: '#607060', marginTop: 15}}>
      图形点击与表格按钮使用同一React选中态。达到采样上界、隐藏标签页或离开高级模式即停止interval；实例卸载destroy。
    </p>
  </section>;
}
