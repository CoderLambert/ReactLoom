import {useEffect,useRef,useState} from 'react';
import pLimit from 'p-limit';

type Props={level:'basic'|'business'|'advanced'};
type Job={id:number;state:'queued'|'running'|'done'|'error'|'cancelled'};
function pause(ms:number,signal:AbortSignal){return new Promise<void>((resolve,reject)=>{
 if(signal.aborted){reject(new DOMException('已取消','AbortError'));return;}
 const done=()=>{signal.removeEventListener('abort',abort);resolve();};
 const timer=setTimeout(done,ms);const abort=()=>{clearTimeout(timer);signal.removeEventListener('abort',abort);reject(new DOMException('已取消','AbortError'));};signal.addEventListener('abort',abort,{once:true});
});}
export default function ConcurrencyExample({level}:Props){
 const [concurrency,setConcurrency]=useState(2);const [jobs,setJobs]=useState<Job[]>([]);const [running,setRunning]=useState(false);const [counts,setCounts]=useState({active:0,pending:0});const [status,setStatus]=useState('尚未运行');
 const generation=useRef(0);const current=useRef<AbortController|null>(null);
 useEffect(()=>()=>{generation.current++;current.current?.abort();},[]);
 async function run(){
  current.current?.abort();const controller=new AbortController();current.current=controller;const id=++generation.current;const limit=pLimit(concurrency);const total=level==='basic'?6:10;
  setJobs(Array.from({length:total},(_,index)=>({id:index+1,state:'queued'})));setRunning(true);setStatus('正在执行');
  const update=(jobId:number,state:Job['state'])=>{if(id!==generation.current)return;setJobs(old=>old.map(job=>job.id===jobId?{...job,state}:job));setCounts({active:limit.activeCount,pending:limit.pendingCount});};
  const tasks=Array.from({length:total},(_,index)=>limit(async()=>{
   const jobId=index+1;if(controller.signal.aborted){update(jobId,'cancelled');return;}
   update(jobId,'running');try{await pause(180+index%3*100,controller.signal);if(level==='advanced'&&jobId===4)throw new Error('模拟一个业务任务失败');update(jobId,'done');}
   catch(error){update(jobId,controller.signal.aborted?'cancelled':'error');if(!controller.signal.aborted)throw error;}
  }));
  const settled=await Promise.allSettled(tasks);if(id!==generation.current)return;setCounts({active:0,pending:0});setRunning(false);setStatus(controller.signal.aborted?'已取消：运行中任务中断，排队任务不再执行':`执行结束：${settled.filter(r=>r.status==='rejected').length} 个失败，其他任务继续完成`);current.current=null;
 }
 return <section aria-label="p-limit 实际运行示例"><h2>{level==='basic'?'限制同时运行的任务':level==='business'?'新闻摘要批处理':'取消与部分任务失败'}</h2><p>调用真实 p-limit，任务工作使用本地延迟；不调用外部服务，不把延迟模拟成真实 HTTP。</p><div className="demo-controls"><label>并发数<select value={concurrency} disabled={running} onChange={e=>setConcurrency(Number(e.target.value))}>{[1,2,3,4].map(n=><option key={n}>{n}</option>)}</select></label><button type="button" disabled={running} onClick={()=>void run()}>运行批处理</button><button type="button" disabled={!running} onClick={()=>current.current?.abort()}>取消任务</button></div><p role="status">{status}</p><p>正在运行 {counts.active} / 排队 {counts.pending}</p><div className="demo-jobs">{jobs.map(job=><div key={job.id} className="demo-job" data-state={job.state}>任务 {job.id}<strong>{job.state}</strong></div>)}</div><p>并发控制不是每秒限流；取消由 AbortSignal 负责。这里不调用 clearQueue，以避免旧版本队列 Promise 没有结算。</p></section>;
}
