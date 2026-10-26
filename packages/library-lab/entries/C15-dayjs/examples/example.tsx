import {useState} from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/zh-cn';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

type Level = 'basic'|'business'|'advanced';
type Zone = 'America/New_York'|'Asia/Shanghai'|'UTC';
const zones: Zone[] = ['America/New_York','Asia/Shanghai','UTC'];
export function strictDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !dayjs(value,'YYYY-MM-DD',true).isValid()) {
    throw new Error('日历日期必须为真实存在的 YYYY-MM-DD；拒绝自动进位');
  }
  return value;
}
export function civilWindow(civil: string, zone: Zone) {
  const startDate = strictDate(civil);
  const nextCivil = dayjs(startDate,'YYYY-MM-DD',true).add(1,'day').format('YYYY-MM-DD');
  const start = dayjs.tz(startDate+' 12:00','YYYY-MM-DD HH:mm',zone);
  const end = dayjs.tz(nextCivil+' 12:00','YYYY-MM-DD HH:mm',zone);
  return {
    zone, start: start.format('YYYY-MM-DD HH:mm Z'),
    end: end.format('YYYY-MM-DD HH:mm Z'),
    elapsedHours: end.diff(start,'hour',true),
    elapsedMs: end.valueOf()-start.valueOf(),
  };
}
export function twoFallbackInstants() {
  return ['2026-11-01T05:30:00Z','2026-11-01T06:30:00Z'].map(instant => ({
    instant,local:dayjs.utc(instant).tz('America/New_York').format('YYYY-MM-DD HH:mm Z'),
  }));
}
export default function DayjsWorkshop({level}:{level:Level}) {
  const [civil,setCivil] = useState('2026-03-07');
  const [zone,setZone] = useState<Zone>('America/New_York');
  const [result,setResult] = useState('');
  const [error,setError] = useState('');
  function run() {
    try {
      const valid = strictDate(civil);
      const output = level==='basic'
        ? {input:valid,zhCN:dayjs(valid,'YYYY-MM-DD',true).locale('zh-cn').format('YYYY年M月D日')}
        : level==='business'
          ? {window:civilWindow(valid,zone),note:'本地演示每日中午，不在浏览器注册生产定时任务'}
          : {
             spring:civilWindow('2026-03-07','America/New_York'),
             fall:civilWindow('2026-10-31','America/New_York'),
             fallback:twoFallbackInstants(),
           };
      setResult(JSON.stringify(output,null,2));setError('');
    } catch(e) {setError(e instanceof Error?e.message:String(e));setResult('');}
  }
  return <section aria-label="Day.js 官方插件实际运算">
    <h2>{level==='basic'?'严格校验日历日期':level==='business'?'RSS 订阅每日排程':'夏令时 23/25 小时与回拨歧义'}</h2>
    <p>明确使用 utc、timezone、customParseFormat 插件；不读取设备默认时区推断服务端任务。</p>
    {level!=='advanced'&&<div className="demo-controls">
      <label>日历日期 <input aria-label="日历日期" value={civil} onChange={e=>setCivil(e.target.value)}/></label>
      {level==='business'&&<label>IANA 时区 <select aria-label="IANA 时区" value={zone}
        onChange={e=>setZone(e.target.value as Zone)}>{zones.map(z=><option key={z}>{z}</option>)}</select></label>}
    </div>}
    <button type="button" onClick={run}>使用 Day.js 运行计算</button>
    {error&&<p role="alert">{error}</p>}
    {result&&<pre data-testid="dayjs-result">{result}</pre>}
    <p>{level==='advanced'?'回拨日两个不同 UTC 时刻可显示相同01:30，但偏移为-04:00与-05:00；API应要求明确偏移。':
      '只把本地日历日作为业务日期；绝对事件应带显式 UTC 偏移。'}</p>
  </section>;
}
