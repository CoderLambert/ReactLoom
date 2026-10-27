import {useMemo,useRef,useState} from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import interactionPlugin from '@fullcalendar/react/interaction';
import listPlugin from '@fullcalendar/react/list';
import classicTheme from '@fullcalendar/react/themes/classic';
import zhCn from '@fullcalendar/react/locales/zh-cn';
import '@fullcalendar/react/skeleton.css';
import '@fullcalendar/react/themes/classic/theme.css';
import '@fullcalendar/react/themes/classic/palette.css';

type Level='basic'|'business'|'advanced';
type Event={id:string;title:string;start:string;end?:string;allDay?:boolean};
const PLUGINS=[classicTheme,dayGridPlugin,timeGridPlugin,interactionPlugin,listPlugin];
const INITIAL:Event[]=[
 {id:'rss-plan',title:'发布订阅目录',start:'2026-11-01',allDay:true},
 {id:'review',title:'工程复盘',start:'2026-11-02T14:00:00Z',end:'2026-11-02T15:00:00Z'}
];
const FOLD:Event[]=[
 {id:'fold-early',title:'DST 01:30（UTC−04）',start:'2026-11-01T01:30:00-04:00'},
 {id:'fold-late',title:'DST 01:30（UTC−05）',start:'2026-11-01T01:30:00-05:00'}
];
export function getUtcInstant(value:string){const date=new Date(value);return Number.isNaN(date.getTime())?null:date.toISOString();}
export default function CalendarExample({level}:{level:Level}){
 const [events,setEvents]=useState<Event[]>(()=>level==='advanced'?[...INITIAL,...FOLD]:[...INITIAL]);
 const [title,setTitle]=useState('RSS 频道审核');
 const [date,setDate]=useState('2026-11-03');
 const [status,setStatus]=useState('演示仅更新组件内存，不连接真实日历服务');
 const calendarRef=useRef<FullCalendar|null>(null);
 const memoEvents=useMemo(()=>events,[events]);
 function add(){
  const validDate=/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(new Date(date+'T00:00:00Z').getTime())&&
    new Date(date+'T00:00:00Z').toISOString().slice(0,10)===date;
  if(!title.trim()||!validDate){setStatus('标题及日历日期必须有效（不允许自动进位）');return;}
  const next={id:'item-'+String(Date.now()),title:title.trim(),start:date,allDay:true};
  setEvents(old=>[...old,next]);setTitle('');setStatus('本地事件已添加，未写入服务端');
 }
 function move(info:{event:{id:string;startStr:string;endStr:string;allDay:boolean};revert:()=>void}){
  if(level==='advanced'&&info.event.id==='fold-early'){info.revert();setStatus('模拟 409：修订冲突，已调用 revert() 恢复原日期');return;}
  setEvents(current=>current.map(item=>item.id===info.event.id?{...item,start:info.event.startStr,end:info.event.endStr||undefined,allDay:info.event.allDay}:item));
  setStatus('拖拽后的日期已同步到 React 数据源。生产服务端须校验 revision。');
 }
 return <section aria-label="FullCalendar 真实演示">
  <h2>{level==='basic'?'最小日历视图':level==='business'?'RSS 内容排程':'DST 重复时刻与冲突回滚'}</h2>
  {level!=='basic'&&<div className="demo-controls">
   <label>标题 <input value={title} maxLength={80} onChange={e=>setTitle(e.target.value)}/></label>
   <label>日期 <input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
   <button type="button" onClick={add}>创建本地事件</button>
   <button type="button" onClick={()=>calendarRef.current?.getApi().gotoDate('2026-11-01')}>跳到 DST 回拨日</button>
  </div>}
  <p role="status">{status}</p>
  <div style={{minWidth:0,maxWidth:'100%',overflow:'auto'}}>
   <FullCalendar ref={calendarRef} plugins={PLUGINS} initialView={level==='basic'?'dayGridMonth':'timeGridWeek'}
    initialDate="2026-11-01" locale={zhCn} timeZone="America/New_York" height="auto"
    headerToolbar={{left:'prev,next today',center:'title',right:'dayGridMonth,timeGridWeek,listWeek'}}
    events={memoEvents} editable={level!=='basic'} eventDrop={move} eventResize={move}
    eventClick={info=>setStatus('选择事件：'+info.event.id)}
   />
  </div>
  {level==='advanced'&&<div>
   <h3>两个不同的 UTC instant</h3>
   <p>纽约 2026-11-01 01:30 重复出现，本地墙上时间不足以唯一定位事件。必须保存 offset 或明确的 instant。</p>
   <pre>{JSON.stringify(FOLD.map(e=>({event:e.id,source:e.start,instant:getUtcInstant(e.start)})),null,2)}</pre>
   <p>拖动 fold-early 会模拟服务端 409 并 revert；本例不安装或触发收费 Scheduler Premium。</p>
  </div>}
  <h3>无障碍事件清单</h3>
  <ul>{events.map(e=><li key={e.id}>{e.title} — {e.start} {e.allDay?'（全天）':''}</li>)}</ul>
 </section>;
}
