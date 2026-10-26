import {useEffect, useRef, useState} from 'react';
import {init, use, type EChartsType} from 'echarts/core';
import {BarChart, LineChart} from 'echarts/charts';
import {GridComponent, TooltipComponent, LegendComponent, TitleComponent} from 'echarts/components';
import {CanvasRenderer} from 'echarts/renderers';

// Register only the features used by this module. This is deliberately outside render.
use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer]);

type Level = 'basic' | 'business' | 'advanced';
const labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const baseline = [12, 20, 15, 28, 22, 34, 27];
const previous = [9, 13, 18, 23, 19, 25, 22];

export default function EchartsExample({level}: {level: Level}) {
  const node = useRef<HTMLDivElement>(null);
  const instance = useRef<EChartsType | null>(null);
  const [values, setValues] = useState(baseline);
  const [selected, setSelected] = useState('');
  const [compact, setCompact] = useState(false);
  const [live, setLive] = useState(false);
  const [updates, setUpdates] = useState(0);

  // StrictMode will mount/clean up/mount again; never share a chart instance across elements.
  useEffect(() => {
    const element = node.current;
    if (!element) return;
    const chart = init(element, undefined, {renderer: 'canvas'});
    instance.current = chart;
    const onClick = (event: {name?: string}) => setSelected(event.name ?? '');
    chart.on('click', onClick);
    const resize = () => chart.resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => {
      observer.disconnect();
      chart.off('click', onClick);
      chart.dispose();
      if (instance.current === chart) instance.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = instance.current;
    if (!chart) return;
    chart.setOption({
      animationDuration: 280,
      title: {text: level === 'basic' ? '近七日文章阅读' : 'NewsHub 阅读趋势', left: 10, textStyle: {fontSize: 15}},
      tooltip: {trigger: 'axis', confine: true},
      legend: {show: level === 'business', bottom: 0},
      grid: {left: 42, right: 22, top: 66, bottom: level === 'business' ? 64 : 35},
      xAxis: {type: 'category', data: labels, axisLabel: {interval: 0}},
      yAxis: {type: 'value', min: 0},
      series: level === 'business'
        ? [
            {name: '本周', type: 'bar', data: values, itemStyle: {color: '#36715a'}},
            {name: '上周', type: 'line', smooth: true, data: previous, lineStyle: {color: '#b58e51'}, itemStyle: {color: '#b58e51'}},
          ]
        : [{name: '阅读量', type: level === 'advanced' ? 'line' : 'bar', smooth: level === 'advanced', data: values, itemStyle: {color: '#36715a'}, areaStyle: level === 'advanced' ? {opacity: 0.12} : undefined}],
    }, {notMerge: true, lazyUpdate: true});
  }, [level, values]);

  useEffect(() => {
    if (level !== 'advanced' || !live) return;
    const interval = window.setInterval(() => {
      setValues(previousValues => previousValues.map((value, index) =>
        index === updates % previousValues.length ? value + 3 : value));
      setUpdates(previousUpdates => previousUpdates + 1);
    }, 1200);
    return () => window.clearInterval(interval);
  }, [level, live, updates]);

  return <section aria-label="Apache ECharts 真实图表">
    <h2>{level === 'basic' ? '柱状图与分类轴' : level === 'business' ? '业务对比：柱状 + 折线' : '实时更新与容器缩放'}</h2>
    <p>真实 echarts/core 模块按需注册，点击数据点后下方会显示选择结果。</p>
    {level === 'advanced' && <div style={{display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14}}>
      <button type="button" onClick={() => setLive(value => !value)}>{live ? '暂停增量更新' : '启动增量更新'}</button>
      <button type="button" onClick={() => setCompact(value => !value)}>{compact ? '恢复宽图' : '缩小容器，观察 resize'}</button>
      <button type="button" onClick={() => {setValues(baseline); setUpdates(0);}}>复位业务数据</button>
      <span aria-live="polite">增量更新次数：{updates}</span>
    </div>}
    <div style={{width: compact ? '65%' : '100%', minWidth: 250, maxWidth: 880, transition: 'width .2s'}}>
      <div ref={node} style={{height: 300, width: '100%'}} role="img" aria-label="七天阅读趋势交互图表，下方提供可访问的数据表"/>
    </div>
    <p role="status">最近点击：{selected || '尚未选择数据点'}</p>
    <div style={{overflowX: 'auto'}}>
      <table style={{borderCollapse: 'collapse', width: '100%'}} aria-label="图表对应的文本数据">
        <thead><tr>{labels.map(day => <th key={day} style={{padding: 6, textAlign: 'left'}}>{day}</th>)}</tr></thead>
        <tbody><tr>{values.map((value, index) => <td key={labels[index]} style={{padding: 6}}>{value}</td>)}</tr></tbody>
      </table>
    </div>
  </section>;
}
