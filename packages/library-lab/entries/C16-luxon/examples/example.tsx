import {useState} from 'react';
import {DateTime, Interval} from 'luxon';
import {resolveWallTime} from './wall-time.mjs';

type Level = 'basic'|'business'|'advanced';
type Zone = 'America/New_York'|'Asia/Shanghai'|'UTC';
const zones: Zone[]=['America/New_York','Asia/Shanghai','UTC'];
export function parseCalendarDay(value:string,zone:Zone) {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('必须输入 YYYY-MM-DD');
 const date=DateTime.fromISO(value+'T12:00:00',{zone,setZone:true,locale:'zh-CN'});
 if (!date.isValid || date.toISODate()!==value) throw new Error('非法日期：'+(date.invalidExplanation??value));
 return date;
}
export function dailyWindow(value:string,zone:Zone) {
 const start=parseCalendarDay(value,zone);
 const next=start.plus({days:1});
 const interval=Interval.fromDateTimes(start,next);
 return {
  start:start.toISO(), end:next.toISO(),
  elapsedHours:interval.length('hours'), calendarDays:next.diff(start,'days').days,
  zone:start.zoneName,
 };
}
export function ambiguousFallback() {
 const date=DateTime.fromISO('2026-11-01T01:30:00',{zone:'America/New_York'});
 if (!date.isValid) throw new Error(date.invalidExplanation??'无法解析');
 return date.getPossibleOffsets().map(item=>({local:item.toFormat('yyyy-MM-dd HH:mm ZZZ'),instant:item.toUTC().toISO()}));
}
export default function LuxonWorkshop({level}:{level:Level}) {
 const [civil,setCivil]=useState('2026-03-07');
 const [zone,setZone]=useState<Zone>('America/New_York');
 const [wall,setWall]=useState('2026-11-01T01:30');
 const [selectedOffset,setSelectedOffset]=useState('');
 const [result,setResult]=useState('');
 const [error,setError]=useState('');
 function run() {
  try {
   const output=level==='basic'
    ? {valid:parseCalendarDay(civil,zone).isValid,formatted:parseCalendarDay(civil,zone).toLocaleString(DateTime.DATE_FULL)}
    : level==='business'
     ? {schedule:dailyWindow(civil,zone),note:'日历天+1，跨DST不等于固定加86400000ms'}
     : {spring:dailyWindow('2026-03-07','America/New_York'),
        fall:dailyWindow('2026-10-31','America/New_York'),
        ambiguous:ambiguousFallback(),
        resolved:resolveWallTime(wall,'America/New_York',selectedOffset||undefined)};
   setResult(JSON.stringify(output,null,2));setError('');
  } catch(e){setError(e instanceof Error?e.message:String(e));setResult('');}
 }
 return <section aria-label="Luxon 时间区间与时区">
   <h2>{level==='basic'?'严格日期与本地化':level==='business'?'RSS 每日订阅时区窗口':'DST 和歧义时刻的显式识别'}</h2>
   <div className="demo-controls">
    {level!=='advanced'&&<label>日历日期 <input aria-label="日历日期" value={civil} onChange={e=>setCivil(e.target.value)}/></label>}
    {level!=='advanced'&&<label>时区 <select aria-label="时区" value={zone} onChange={e=>setZone(e.target.value as Zone)}>
      {zones.map(z=><option key={z}>{z}</option>)}</select></label>}
   </div>
   {level==='advanced'&&<div className="demo-controls">
     <label>纽约本地时间
       <input aria-label="纽约本地时间" value={wall}
         onChange={e=>{setWall(e.target.value);setResult('');setError('');}}/>
     </label>
     <label>显式 UTC 偏移
       <select aria-label="显式 UTC 偏移" value={selectedOffset}
         onChange={e=>{setSelectedOffset(e.target.value);setResult('');setError('');}}>
         <option value="">未选择（回拨必须拒绝）</option>
         <option value="-04:00">-04:00（先发生）</option>
         <option value="-05:00">-05:00（后发生）</option>
       </select>
     </label>
     <button type="button" onClick={()=>{setWall('2026-03-08T02:30');setSelectedOffset('');setResult('');}}>
       模拟春季不存在的本地 02:30
     </button>
   </div>}
   <button type="button" onClick={run}>使用 Luxon 运行</button>
   {error&&<p role="alert">{error}</p>}
   {result&&<pre data-testid="luxon-result">{result}</pre>}
   <p>业务日期用 DateTime + IANA zone，持久化事件用明确 offset 的 ISO instant；不能把本地01:30直接当唯一时刻。</p>
 </section>;
}
