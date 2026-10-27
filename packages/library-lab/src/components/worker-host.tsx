import {useEffect,useState} from 'react';
import type {Level} from '../lib/types';
import {appendWorkerLog,parseWorkerReply,workerStartMessage} from '../lib/worker-protocol.mjs';

type Props={createWorker:()=>Worker;level:Level};
type State='starting'|'running'|'completed'|'failed';

/** Worker lifetime is scoped to the mounted demo; no service worker is installed. */
export default function WorkerHost({createWorker,level}:Props){
 const [status,setStatus]=useState<State>('starting');
 const [lines,setLines]=useState<string[]>([]);
 useEffect(()=>{
  let live=true;let finished=false;let worker:Worker|undefined;
  const runId=globalThis.crypto?.randomUUID?.()??`lab-${Date.now()}`;
  let timer:ReturnType<typeof setTimeout>|undefined;
  const close=()=>{
   if(timer!==undefined)clearTimeout(timer);
   timer=undefined;
   if(worker){
    worker.onmessage=null;
    worker.onerror=null;
    worker.onmessageerror=null;
    worker.terminate();
    worker=undefined;
   }
  };
  const fail=(message:string)=>{
   if(!live||finished)return;
   finished=true;
   setStatus('failed');
   setLines(old=>appendWorkerLog(old,{type:'error',message}));
   close();
  };
  try{
   worker=createWorker();setStatus('running');setLines([]);
   worker.onmessage=event=>{
    if(!live||finished)return;
    const reply=parseWorkerReply(event.data,runId);
    if(!reply)return;
    setLines(old=>appendWorkerLog(old,reply));
    if(reply.type==='result'||reply.type==='error'){
     finished=true;
     setStatus(reply.type==='result'?'completed':'failed');close();
    }
   };
   worker.onerror=event=>fail(`Worker error: ${event.message || '未知异常'}`);
   worker.onmessageerror=()=>fail('Worker 返回了无法反序列化的消息');
   timer=setTimeout(()=>fail('示例超过45秒执行限额，Worker 已终止'),45_000);
   worker.postMessage(workerStartMessage(level,runId));
  }catch(error){fail(String(error));}
  return()=>{live=false;finished=true;close();};
 },[createWorker,level]);
 return <section aria-label="隔离 Worker 示例"><h3>独立 Web Worker</h3>
  <p>示例已在专用 Worker 中执行；关闭、切换示例或重置时会调用 terminate。Worker 并非不可信代码的安全沙箱。</p>
  <p role="status">{({starting:'正在启动',running:'正在执行',completed:'执行结束',failed:'执行失败'})[status]}</p>
  <ol aria-label="Worker 运行日志">{lines.map((line,index)=><li key={index}><code>{line}</code></li>)}</ol>
  <p className="notice">只能据实际命令与证据认定 SDK 通过；运行界面本身不自动修改 verification.json。</p>
 </section>;
}
