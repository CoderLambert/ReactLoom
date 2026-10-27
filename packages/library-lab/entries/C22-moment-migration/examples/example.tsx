import {useMemo,useState} from 'react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import {addDays,format,isValid,parseISO} from 'date-fns';
import {TZDate} from '@date-fns/tz';

dayjs.extend(customParseFormat);

type Level='basic'|'business'|'advanced';
type Zone='Asia/Shanghai'|'America/New_York'|'UTC';
const ZONES:Zone[]=['Asia/Shanghai','America/New_York','UTC'];
const DATE_PATTERN=/^\d{4}-\d{2}-\d{2}$/;

function validCalendarDay(value:string) {
 if(!DATE_PATTERN.test(value))return false;
 const parsed=dayjs(value,'YYYY-MM-DD',true);
 return parsed.isValid()&&isValid(parseISO(value));
}
function formatInstant(instant:string,zone:Zone){
 const date=new Date(instant);
 if(Number.isNaN(date.getTime()))return '无效时间';
 return new Intl.DateTimeFormat('zh-CN',{
  timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',
  hour:'2-digit',minute:'2-digit',hourCycle:'h23'
 }).format(date);
}
export function getMigrationReport(day:string,zone:Zone,instant:string){
 const valid=validCalendarDay(day);
 const localDate=valid?parseISO(day):null;
 return {
  input:day,
  dayjsStrict:valid?dayjs(day,'YYYY-MM-DD',true).format('YYYY/MM/DD'):'INVALID',
  dateFnsLocalFormat:localDate?format(localDate,'yyyy/MM/dd'):'INVALID',
  nextCivilDate:localDate?format(addDays(localDate,1),'yyyy-MM-dd'):'INVALID',
  isoInstant:Number.isNaN(Date.parse(instant))?'INVALID':new Date(instant).toISOString(),
  chosenZone:zone,
  renderedInZone:formatInstant(instant,zone),
 };
}
export default function MomentMigrationExample({level}:{level:Level}){
 const [day,setDay]=useState('2026-11-01');
 const [instant,setInstant]=useState('2026-11-01T05:30:00Z');
 const [zone,setZone]=useState<Zone>('America/New_York');
 const report=useMemo(()=>getMigrationReport(day,zone,instant),[day,zone,instant]);
 // The date-fns TZDate holds an explicit IANA zone, regardless of the browser's OS zone.
 const dst=useMemo(()=>{
  const noon=new TZDate(2026,2,7,12,0,0,'America/New_York');
  const next=addDays(noon,1);
  const fallA=new Date('2026-11-01T01:30:00-04:00');
  const fallB=new Date('2026-11-01T01:30:00-05:00');
  return {
   springCivilDayHours:(next.getTime()-noon.getTime())/3_600_000,
   fallEarly:fallA.toISOString(),fallLate:fallB.toISOString(),
   repeatedHourGap:(fallB.getTime()-fallA.getTime())/3_600_000
  };
 },[]);
 return <section aria-label="Moment 日期迁移工作坊">
  <h2>{level==='basic'?'格式化与严格解析':level==='business'?'RSS 发布时间和显示时区':'DST、民用日和不可变更新'}</h2>
  <p>此条目是历史迁移教学，不把 Moment 安装回主应用。实际计算由 date-fns、@date-fns/tz 与 Day.js 完成。</p>
  <div className="demo-controls">
   <label>日历日期 <input value={day} onChange={e=>setDay(e.target.value)} placeholder="YYYY-MM-DD" maxLength={10} /></label>
   {level!=='basic'&&<>
    <label>显示时区 <select value={zone} onChange={e=>setZone(e.target.value as Zone)}>
     {ZONES.map(z=><option key={z} value={z}>{z}</option>)}
    </select></label>
    <label>UTC ISO 时间 <input value={instant} onChange={e=>setInstant(e.target.value)}
      placeholder="2026-11-01T05:30:00Z" maxLength={45}/></label>
   </>}
  </div>
  {!validCalendarDay(day)&&<p role="alert">日历日期无效，不能悄悄接受 2026-02-30。</p>}
  <output className="demo-output" data-testid="moment-migration-report">
   {JSON.stringify(level==='basic'?{
    dayjs:report.dayjsStrict,dateFns:report.dateFnsLocalFormat,nextDate:report.nextCivilDate
   }:report,null,2)}
  </output>
  {level==='advanced'&&<>
   <h3>真实 IANA 时区下的时间边界</h3>
   <pre>{JSON.stringify(dst,null,2)}</pre>
   <p>纽约春季跳时：以日历日加 1 并非简单加 24 小时。
    秋季两个 01:30 的墙上时间相同，UTC instant 相差 1 小时，必须保留偏移或时间点身份。</p>
  </>}
  <p>迁移时注意：旧 Moment 的 add/startOf 可能修改原对象。替换成不可变 Day.js 或纯函数 date-fns 后，必须更新赋值与比较逻辑。</p>
 </section>;
