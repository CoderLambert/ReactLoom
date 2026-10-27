import {useMemo, useState} from 'react';
import {
  Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

type Level = 'basic' | 'business' | 'advanced';
import {sampleRows, normalizeWindow, nextRevision, MAX_REVISION} from './chart-policy';
export default function RechartsExample({level}: {level: Level}) {
  const [count, setCount] = useState(7);
  const [windowDraft, setWindowDraft] = useState('7');
  const [revision, setRevision] = useState(0);
  const [showRate, setShowRate] = useState(true);
  const isBasic = level === 'basic';
  const rows = useMemo(() => sampleRows(level === 'advanced' ? count : 7, revision),
    [level, count, revision]);
  const total = rows.reduce((n, row) => n + row.reads, 0);

  return <section aria-label="Recharts 真实图表示例">
    <h2>{isBasic ? '阅读量分布' : level === 'business' ? 'NewsHub 文章分析' : '窗口、单位与数据边界'}</h2>
    <p>本地确定性示例数据；图表由 Recharts 真实 SVG 组件生成，不代表在线业务统计。</p>
    <div style={{display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 16}}>
      <button type="button" onClick={() => setRevision(nextRevision)} disabled={revision >= MAX_REVISION}>增加阅读数据</button>
      {level === 'advanced' && <>
        <label>窗口天数 <input aria-label="窗口天数" type="number" min={3} max={14} step={1}
          value={windowDraft} onChange={event => {
            const text = event.currentTarget.value;
            setWindowDraft(text);
            if (/^\d+$/.test(text)) setCount(normalizeWindow(Number(text)));
          }} onBlur={() => setWindowDraft(String(count))}
          style={{width: 70, marginLeft: 8}}/></label>
        <label><input type="checkbox" checked={showRate} onChange={event => setShowRate(event.target.checked)}/> 显示收藏率</label>
      </>}
      <output aria-live="polite">合计阅读 {total} 次{revision >= MAX_REVISION ? " · 已达到演示数据上限" : ""}</output>
    </div>
    <div aria-hidden="true" style={{height: 300, width: '100%', minWidth: 0, padding: 10,
      background: '#f9fcf7', border: '1px solid #dce8df', borderRadius: 12}}>
      <ResponsiveContainer width="100%" height="100%" debounce={60}>
        {isBasic
          ? <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 4" stroke="#e0e6dc"/>
              <XAxis dataKey="day"/><YAxis allowDecimals={false}/>
              <Tooltip/><Bar dataKey="reads" name="阅读量" fill="#38795b" maxBarSize={42}/>
            </BarChart>
          : <ComposedChart data={rows}>
              <CartesianGrid strokeDasharray="3 4" stroke="#e0e6dc"/>
              <XAxis dataKey="day"/><YAxis yAxisId="count" allowDecimals={false}/>
              {showRate && <YAxis yAxisId="percentage" orientation="right" domain={[0, 100]} unit="%"/>}
              <Tooltip/><Legend/>
              <Bar dataKey="reads" yAxisId="count" name="阅读量" fill="#38795b" maxBarSize={36}/>
              <Bar dataKey="saved" yAxisId="count" name="收藏量" fill="#ca9258" maxBarSize={30}/>
              {showRate && <Line type="monotone" dataKey="rate" yAxisId="percentage"
                name="收藏率" stroke="#6e7cb5" strokeWidth={2} dot={false}/>}
            </ComposedChart>}
      </ResponsiveContainer>
    </div>
    <div style={{overflowX: 'auto', marginTop: 18}}>
      <table style={{width: '100%', fontSize: 13, borderCollapse: 'collapse', textAlign: 'left'}}>
        <caption style={{textAlign: 'left'}}>图表等价数据表（可通过键盘与辅助技术读取）</caption>
        <thead><tr><th scope="col">星期</th><th scope="col">阅读</th><th scope="col">收藏</th><th scope="col">收藏率</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.day}><th scope="row">{row.day}</th>
          <td>{row.reads}</td><td>{row.saved}</td><td>{row.rate}%</td></tr>)}</tbody>
      </table>
    </div>
    <p style={{fontSize: 12, color: '#536757', marginTop: 15}}>
      ResponsiveContainer 的父级必须有明确的非零尺寸；SVG 图形不能代替同等含义的数据表。
    </p>
  </section>;
}
