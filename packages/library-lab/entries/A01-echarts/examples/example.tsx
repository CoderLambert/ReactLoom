import {useEffect, useRef, useState} from 'react';
import {init, use, type EChartsType} from 'echarts/core';
import {BarChart, LineChart} from 'echarts/charts';
import {GridComponent, TooltipComponent, LegendComponent, TitleComponent} from 'echarts/components';
import {CanvasRenderer} from 'echarts/renderers';
import {advanceReadingCounts, MAX_READING_UPDATES, shouldAdvanceReadingStream} from './stream-policy';

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
  const updateCount = useRef(0);
  const tickIndex = useRef(0);
  const [visible, setVisible] = useState(true);
  const [inViewport, setInViewport] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [allowMotion, setAllowMotion] = useState(false);
  const playbackActive = shouldAdvanceReadingStream({
    level, requested: live, visible: visible && inViewport, reducedMotion, allowMotion,
    exhausted: updates >= MAX_READING_UPDATES,
  });

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReducedMotion(media.matches);
    const syncVisibility = () => setVisible(!document.hidden);
    syncMotion();
    syncVisibility();
    media.addEventListener('change',syncMotion);
    document.addEventListener('visibilitychange',syncVisibility);
    return () => {
      media.removeEventListener('change',syncMotion);
      document.removeEventListener('visibilitychange',syncVisibility);
    };
  }, []);

  // A hidden tab or an offscreen chart must not burn CPU on sample generation.
  useEffect(() => {
    const element = node.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => setInViewport(entries.some(entry => entry.isIntersecting)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // StrictMode will mount/clean up/mount again; never share a chart instance across elements.
  useEffect(() => {
    const element = node.current;
    if (!element) return;
    const chart = init(element, undefined, {renderer: 'canvas'});
    instance.current = chart;
    const onClick = (event: {name?: string;seriesName?: string;value?: unknown}) => {
      const value = typeof event.value === 'number' || typeof event.value === 'string' ? '：' + String(event.value) : '';
      setSelected((event.seriesName ?? '数据') + ' / ' + (event.name ?? '未知分类') + value);
    };
    chart.on('click', onClick);
    // Coalesce ResizeObserver bursts; no resize is allowed after teardown.
    let resizeFrame = 0;
    const scheduleResize = () => {
      if (resizeFrame) return;
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        if (element.isConnected && element.clientWidth > 0 && element.clientHeight > 0) chart.resize();
      });
    };
    const observer = new ResizeObserver(scheduleResize);
    observer.observe(element);
    scheduleResize();
    return () => {
      observer.disconnect();
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      chart.off('click', onClick);
      chart.dispose();
      if (instance.current === chart) instance.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = instance.current;
    if (!chart) return;
    chart.setOption({
      animationDuration: reducedMotion && !allowMotion ? 0 : 280,
      animationDurationUpdate: reducedMotion && !allowMotion ? 0 : 280,
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
  }, [level, values, reducedMotion, allowMotion]);

  useEffect(() => {
    if (!playbackActive) return;
    const interval = window.setInterval(() => {
      if (updateCount.current >= MAX_READING_UPDATES) return;
      const tick = tickIndex.current++;
      updateCount.current += 1;
      setValues(previousValues => advanceReadingCounts(previousValues,tick));
      setUpdates(updateCount.current);
    }, 1200);
    return () => window.clearInterval(interval);
  }, [playbackActive]);

  const chooseDatum = (seriesName: string, day: string, value: number, seriesIndex: number, dataIndex: number) => {
    setSelected(seriesName + ' / ' + day + '：' + value);
    instance.current?.dispatchAction({type: 'showTip', seriesIndex, dataIndex});
  };

  return <section aria-label="Apache ECharts 真实图表">
    <h2>{level === 'basic' ? '柱状图与分类轴' : level === 'business' ? '业务对比：柱状 + 折线' : '实时更新与容器缩放'}</h2>
    <p>真实 echarts/core 模块按需注册，点击数据点后下方会显示选择结果。</p>
    {level === 'advanced' && <div style={{display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14}}>
      <button type="button" disabled={updates >= MAX_READING_UPDATES && !live} onClick={() => setLive(value => !value)}>{live ? '暂停增量更新' : '启动增量更新'}</button>
      <button type="button" onClick={() => setCompact(value => !value)}>{compact ? '恢复宽图' : '缩小容器，观察 resize'}</button>
      <button type="button" onClick={() => {tickIndex.current=0;updateCount.current=0;setLive(false);setValues(baseline);setUpdates(0);setSelected('');}}>复位业务数据</button>
      {reducedMotion && <label><input type="checkbox" checked={allowMotion}
        onChange={event => setAllowMotion(event.target.checked)}/>允许动态演示（覆盖减少动态偏好）</label>}
      <span aria-live="polite">增量更新次数：{updates}/{MAX_READING_UPDATES}；{playbackActive?'运行中':updates >= MAX_READING_UPDATES?'达到演示上限，请复位':live?'已暂停（页面隐藏、离屏或减少动态）':'已停止'}</span>
    </div>}
    <div style={{width: compact ? '65%' : '100%', minWidth: 0, maxWidth: 880, transition: reducedMotion && !allowMotion ? 'none' : 'width .2s'}}>
      <div ref={node} style={{height: 300, width: '100%'}} role="img" aria-label="七天阅读趋势交互图表，下方提供可访问的数据表"/>
    </div>
    <p role="status">最近点击：{selected || '尚未选择数据点'}</p>
    <div style={{overflowX: 'auto'}}>
      <table style={{borderCollapse: 'collapse', width: '100%'}} aria-label="图表对应的文本数据">
        <caption>阅读趋势对应数据（逐系列）</caption>
        <thead><tr><th scope="col">系列</th>{labels.map(day => <th scope="col" key={day} style={{padding: 6, textAlign: 'left'}}>{day}</th>)}</tr></thead>
        <tbody><tr><th scope="row">{level==='business'?'本周':'阅读量'}</th>{values.map((value, index) => <td key={labels[index]} style={{padding: 6}}><button type="button" onClick={() => chooseDatum(level==='business'?'本周':'阅读量', labels[index], value, 0, index)} aria-pressed={selected === (level==='business'?'本周':'阅读量') + ' / ' + labels[index] + '：' + value}>{value}</button></td>)}</tr>
          {level==='business' && <tr><th scope="row">上周</th>{previous.map((value,index) => <td key={labels[index]} style={{padding:6}}><button type="button" onClick={() => chooseDatum('上周', labels[index], value, 1, index)} aria-pressed={selected === '上周 / ' + labels[index] + '：' + value}>{value}</button></td>)}</tr>}
        </tbody>
      </table>
    </div>
  </section>;
}
