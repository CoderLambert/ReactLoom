import {useEffect,useMemo,useRef,useState} from 'react';
import './gantt.css';
type Level='basic'|'business'|'advanced';
type Task={id:string;name:string;start:string;end:string;progress:number;dependencies:string};
const BASE:Task[]=[
 {id:'research',name:'需求评审',start:'2026-10-27',end:'2026-10-29',progress:100,dependencies:''},
 {id:'frontend',name:'前端开发',start:'2026-10-30',end:'2026-11-04',progress:45,dependencies:'research'},
 {id:'qa',name:'联调回归',start:'2026-11-05',end:'2026-11-08',progress:10,dependencies:'frontend'}
];
export function validatePlan(tasks:Task[]):string|null {
 const ids=new Set(tasks.map(t=>t.id));
 if(ids.size!==tasks.length)return '任务 ID 不允许重复';
 for(const task of tasks){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(task.start)||!(/^\d{4}-\d{2}-\d{2}$/.test(task.end))||
    Number.isNaN(Date.parse(task.start))||Number.isNaN(Date.parse(task.end))||task.start>task.end)return task.id+' 的日期区间无效';
  if(task.progress<0||task.progress>100)return task.id+' 的进度必须在 0-100';
  for(const id of task.dependencies.split(',').map(s=>s.trim()).filter(Boolean)){
   if(!ids.has(id)||id===task.id)return task.id+' 存在非法任务依赖';
  }
 }
 return null;
}
function GanttCanvas({tasks,view}:{tasks:Task[];view:'Day'|'Week'|'Month'}) {
 const host=useRef<HTMLDivElement|null>(null);
 const [error,setError]=useState('');
 useEffect(()=>{
  const el=host.current;if(!el)return;let alive=true;el.replaceChildren();setError('');
  // Frappe Gantt mutates its task descriptors. Never hand it React's authoritative objects.
  import('frappe-gantt').then(({default:Gantt})=>{
   if(!alive)return;
   const copied=tasks.map(t=>({...t}));
   new Gantt(el,copied,{view_mode:view,readonly:true,popup:false,scroll_to:'start'});
  }).catch(e=>{if(alive)setError(String(e));});
  return()=>{alive=false;el.replaceChildren();};
 },[tasks,view]);
 return <div className="rl-c13"><div ref={host} className="rl-c13-chart" role="img"
    aria-label="任务时间线图，仅作视觉展示；下方的语义表格可使用键盘编辑"/>
   {error&&<p role="alert">甘特图未加载：{error}</p>}</div>;
}
export default function FrappeGanttExample({level}:{level:Level}){
 const [tasks,setTasks]=useState<Task[]>(()=>BASE.map(t=>({...t})));
 const [view,setView]=useState<'Day'|'Week'|'Month'>('Week');
 const [filter,setFilter]=useState('');
 const [status,setStatus]=useState('内存任务，未连接真实项目服务');
 const shown=useMemo(()=>tasks.filter(t=>t.name.includes(filter)),[tasks,filter]);
 function save(task:Task,form:FormData){
  const next:Task={...task,start:String(form.get('start')),end:String(form.get('end')),progress:Number(form.get('progress'))};
  const candidate=tasks.map(t=>t.id===task.id?next:t);
  const error=validatePlan(candidate);
  if(error){setStatus('已拒绝保存，视图保持不变：'+error);return;}
  if(level==='advanced'&&task.id==='qa'){setStatus('模拟 HTTP 409：联调任务版本冲突，未修改客户端权威数据');return;}
  setTasks(candidate);setStatus('已更新当前内存计划：'+task.id);
 }
 return <section aria-label="Frappe Gantt 真实示例">
  <h2>{level==='basic'?'三项任务与依赖':level==='business'?'项目任务进度':'无效区间与 409 冲突'}</h2>
  <div className="demo-controls"><label>时间尺度 <select value={view} onChange={e=>setView(e.target.value as typeof view)}>
   <option>Day</option><option>Week</option><option>Month</option>
  </select></label>{level!=='basic'&&<label>过滤表格任务 <input value={filter} onChange={e=>setFilter(e.target.value)}/></label>}</div>
  <p role="status">{status}</p>
  <GanttCanvas tasks={tasks} view={view}/>
  <h3>等效键盘可编辑任务列表</h3>
  <div style={{overflowX:'auto'}}><table><thead><tr><th scope="col">任务</th><th scope="col">依赖</th><th scope="col">日期/进度</th></tr></thead><tbody>
   {shown.map(task=><tr key={task.id}><td>{task.name}</td><td>{task.dependencies||'—'}</td><td>
    {level==='basic'?task.start+' → '+task.end:
    <form key={task.id+task.start+task.end+task.progress} onSubmit={e=>{e.preventDefault();save(task,new FormData(e.currentTarget));}}
      className="demo-controls">
     <label>开始 <input aria-label={task.name+'开始日期'} type="date" name="start" defaultValue={task.start} required/></label>
     <label>结束 <input aria-label={task.name+'结束日期'} type="date" name="end" defaultValue={task.end} required/></label>
     <label>进度 <input aria-label={task.name+'进度'} type="number" name="progress" min={0} max={100} defaultValue={task.progress} required/></label>
     <button type="submit">保存</button>
    </form>}
   </td></tr>)}
  </tbody></table></div>
  <p>甘特图只负责可视化，日期更改由语义表格完成。筛选只作用于表格，不能将缺少依赖的子集交给甘特引擎。</p>
  {level==='advanced'&&<p>将结束日改为早于开始日触发拒绝；保存“联调回归”模拟 409。更复杂的依赖闭环、跨时区与服务端 revision 需要独立契约测试。</p>}
 </section>;
}
