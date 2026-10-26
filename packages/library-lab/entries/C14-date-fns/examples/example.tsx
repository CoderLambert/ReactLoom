
import {useState} from 'react';
import {addDays, differenceInCalendarDays, differenceInHours, format, isValid, parseISO} from 'date-fns';
import {TZDate, tz} from '@date-fns/tz';

type Zone = 'America/New_York' | 'Asia/Shanghai' | 'UTC';
type Level = 'basic' | 'business' | 'advanced';
export type Props = {level: Level};

export function parseCivilDate(raw: string, zone: Zone): TZDate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new Error('只接受 YYYY-MM-DD');
  const [year, month, day] = raw.split('-').map(Number);
  const date = new TZDate(year, month - 1, day, 12, 0, 0, zone);
  if (!isValid(date) || date.getFullYear() !== year ||
      date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new Error('非法日历日期：禁止自动进位（如2月30日）');
  }
  return date;
}

export function parseInstant(value: string): Date {
  if (!/(?:[zZ]|[+-]\d{2}:\d{2})$/.test(value)) {
    throw new Error('绝对事件必须明确 Z 或 ±HH:mm，拒绝回拨日无偏移的 01:30');
  }
  const date = parseISO(value);
  if (!isValid(date)) throw new Error('事件时间不是合法 ISO 8601');
  return date;
}

export function planCivilDays(civil: string, zone: Zone, count: number) {
  if (!Number.isSafeInteger(count) || count < 1 || count > 14) throw new RangeError('天数范围1–14');
  const start = parseCivilDate(civil, zone);
  const end = addDays(start, count, {in: tz(zone)});
  return {
    zone,
    start: format(start, 'yyyy-MM-dd HH:mm XXX', {in: tz(zone)}),
    end: format(end, 'yyyy-MM-dd HH:mm XXX', {in: tz(zone)}),
    calendarDays: differenceInCalendarDays(end, start, {in: tz(zone)}),
    elapsedHours: differenceInHours(end, start),
  };
}

export default function DateFnsExample({level}: Props) {
  const [civil, setCivil] = useState('2026-03-07');
  const [zone, setZone] = useState<Zone>('America/New_York');
  const [count, setCount] = useState(1);
  const [instant, setInstant] = useState('2026-11-01T01:30:00-04:00');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  function calculate() {
    try {
      const schedule = planCivilDays(civil, zone, count);
      const payload = level === 'basic'
        ? {calendarDate: format(parseCivilDate(civil, zone), 'yyyy-MM-dd', {in: tz(zone)}), next: schedule.end}
        : level === 'business'
          ? {schedule, note:'这里只演示日期计算，不在浏览器中实现可靠生产Cron'}
          : {spring: planCivilDays('2026-03-07','America/New_York',1),
             fall: planCivilDays('2026-10-31','America/New_York',1),
             instantUTC: parseInstant(instant).toISOString(),
             ambiguousLocalTime: ['2026-11-01T01:30:00-04:00','2026-11-01T01:30:00-05:00']
               .map(value => parseInstant(value).toISOString())};
      setResult(JSON.stringify(payload,null,2)); setError('');
    } catch (e) {setError(e instanceof Error ? e.message : String(e)); setResult('');}
  }
  return <section aria-label="date-fns 真实时区演示">
    <h2>{level==='basic'?'严格日历日期':level==='business'?'RSS 摘要日历排程':'DST 与重叠时刻'}</h2>
    <p>区别日历日、绝对时间和经过小时数。演示数据不依赖设备默认时区。</p>
    <div className="demo-controls">
      <label>日历日期 <input aria-label="日历日期" value={civil} onChange={e=>setCivil(e.target.value)}/></label>
      <label>IANA 时区 <select aria-label="IANA 时区" value={zone} onChange={e=>setZone(e.target.value as Zone)}>
        {(['America/New_York','Asia/Shanghai','UTC'] as const).map(x=><option key={x}>{x}</option>)}
      </select></label>
      <label>增加天数 <select value={count} onChange={e=>setCount(Number(e.target.value))}>
        {[1,2,3,7,14].map(n=><option key={n} value={n}>{n}</option>)}
      </select></label>
    </div>
    {level==='advanced'&&<><label>绝对事件时间
      <input aria-label="绝对事件时间" style={{width:'100%'}} value={instant} onChange={e=>setInstant(e.target.value)}/>
    </label><p>删除末尾 -04:00 再运行，必须拒绝歧义本地时间。</p></>}
    <button type="button" onClick={calculate}>运行日期计算</button>
    {error&&<p role="alert">{error}</p>}
    {result&&<pre data-testid="date-result">{result}</pre>}
    {level==='advanced'&&<p>纽约 DST 的相邻日历日可能相隔23或25小时；不能把“明天”写成 +86400000 毫秒。</p>}
  </section>;
}
