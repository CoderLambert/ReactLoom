/** Registered local runner only. This is not an arbitrary HTML/code sandbox. */
export const APP_ORIGIN='http://127.0.0.1:4319';
export const RUNNER_ORIGIN='http://127.0.0.1:4320';
export const FRAME_PROTOCOL='reactloom-msw-v1';
export const SESSION_ID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u;
const LEVELS=new Set(['basic','business','advanced']);
export function createMswFrameSession({window:host=globalThis.window,level,onEvent,stopTimeoutMs=3000}){
 if(host.location.origin!==APP_ORIGIN||!LEVELS.has(level)||typeof onEvent!=='function')throw new Error('MSW runner requires the registered local app origin and level');
 if(!Number.isSafeInteger(stopTimeoutMs)||stopTimeoutMs<1||stopTimeoutMs>10000)throw new Error('Invalid cleanup deadline');
 const session=host.crypto.randomUUID();
 if(!SESSION_ID.test(session))throw new Error('Invalid session identity');
 const scope=`${RUNNER_ORIGIN}/lab-runners/msw/sessions/${session}/`;
 const frame=host.document.createElement('iframe');
 frame.title='隔离的 MSW 网络执行环境';frame.hidden=true;frame.referrerPolicy='no-referrer';
 frame.setAttribute('sandbox','allow-scripts allow-same-origin');frame.src=scope;
 let closing=false,started=false,removed=false,stopTask,finishStop,stopTimer;
 let deadline=host.setTimeout(()=>{onEvent({type:'error',message:'隔离运行器启动或请求超时'});void dispose();},30000);
 const send=type=>frame.contentWindow?.postMessage({protocol:FRAME_PROTOCOL,session,type,...(type==='start'?{level}:{})},RUNNER_ORIGIN);
 const remove=confirmed=>{
  if(removed)return;removed=true;
  host.clearTimeout(deadline);host.clearTimeout(stopTimer);host.removeEventListener('message',receive);frame.remove();
  onEvent({type:confirmed?'stopped':'cleanup-unconfirmed',scope,cleanup:confirmed});finishStop?.(confirmed);
 };
 function dispose(){
  if(stopTask)return stopTask;
  closing=true;host.clearTimeout(deadline);
  stopTask=new Promise(resolve=>{finishStop=resolve;});
  stopTimer=host.setTimeout(()=>remove(false),stopTimeoutMs);
  send('stop');return stopTask;
 }
 function receive(event){
  const data=event.data;
  if(removed||event.source!==frame.contentWindow||event.origin!==RUNNER_ORIGIN||
    !data||data.protocol!==FRAME_PROTOCOL||data.session!==session)return;
  if(data.type==='ready'){
   if(closing){send('stop');return;}
   if(!started){started=true;send('start');onEvent({type:'running',scope});}
  }else if(data.type==='stopped'&&closing){remove(data.cleanup===true);}
  else if(!closing&&data.type==='error'&&typeof data.message==='string'){
   onEvent({type:'error',message:data.message.slice(0,500)});void dispose();
  }else if(!closing&&started&&data.type==='result'&&Array.isArray(data.requests)&&data.requests.length>0&&data.requests.length<=3){
   const valid=data.requests.every(item=>item&&['GET','POST'].includes(item.method)&&
    typeof item.url==='string'&&item.url.startsWith(scope+'api/')&&item.url.length<=500&&
    Number.isInteger(item.status)&&item.status>=100&&item.status<=599&&typeof item.body==='string'&&item.body.length<=2048);
   if(valid){host.clearTimeout(deadline);onEvent({type:'result',scope,requests:data.requests.map(({method,url,status,body})=>({method,url,status,body}))});}
  }
 }
 host.addEventListener('message',receive);
 // Keep the execution frame outside React-owned DOM until async cleanup completes.
 host.document.body.appendChild(frame);
 onEvent({type:'loading',scope});
 return {session,scope,dispose};
}
