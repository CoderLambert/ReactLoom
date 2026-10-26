import {useEffect,useRef,useState} from 'react';
import axios, {AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig} from 'axios';

type Level='basic'|'business'|'advanced';
type Feed={id:string;title:string;tenant:'a'|'b'};
const items:Feed[]=[
 {id:'a1',title:'React 工程复盘',tenant:'a'},
 {id:'a2',title:'AI 工具调用',tenant:'a'},
 {id:'b1',title:'商业周报',tenant:'b'},
];
async function pause(ms:number,signal?:AbortSignal) {
 return new Promise<void>((resolve,reject)=>{
   if(signal?.aborted){reject(new DOMException('aborted','AbortError'));return;}
   const cleanup=()=>signal?.removeEventListener('abort',abort);
   const abort=()=>{clearTimeout(timer);cleanup();reject(new DOMException('aborted','AbortError'));};
   const timer=setTimeout(()=>{cleanup();resolve();},ms);
   signal?.addEventListener('abort',abort,{once:true});
 });
}
export function makeFixtureClient(onTrace:(text:string)=>void) {
 const attempts=new Map<string,number>();
 const adapter:AxiosAdapter=async (config:InternalAxiosRequestConfig)=>{
   const url=new URL(config.url??'',config.baseURL??'https://lab.invalid');
   if(url.origin!=='https://lab.invalid')throw new Error('fixture 只支持 https://lab.invalid，拒绝外部请求');
   await pause(url.pathname==='/slow'?340:60,config.signal as AbortSignal|undefined);
   const key=url.pathname;const current=(attempts.get(key)??0)+1;attempts.set(key,current);
   const status=key==='/conflict'?409:key==='/transient'&&current===1?503:200;
   const tenant=url.searchParams.get('tenant')==='b'?'b':'a';
   const filtered=items.filter(row=>row.tenant===tenant&&row.title.includes(url.searchParams.get('q')??''));
   const body=key==='/transient'?{attempt:current,ok:status===200}:key==='/conflict'?{error:'version_conflict'}:filtered;
   const response:AxiosResponse={status,statusText:String(status),data:body,headers:new AxiosHeaders({'content-type':'application/json'}),config};
   onTrace(config.method?.toUpperCase()+' '+key+' → '+status+' (request '+current+')');
   if(status>=400)throw new AxiosError('fixture HTTP '+status,AxiosError.ERR_BAD_RESPONSE,config,undefined,response);
   return response;
 };
 const client=axios.create({baseURL:'https://lab.invalid',adapter,timeout:2000});
 const req=client.interceptors.request.use(config=>{config.headers.set('X-Lab-Request','isolated');return config;});
 const res=client.interceptors.response.use(response=>response,error=>Promise.reject(error));
 return {client,dispose:()=>{client.interceptors.request.eject(req);client.interceptors.response.eject(res);}};
}
export async function boundedGetRetry(client:AxiosInstance,signal:AbortSignal) {
 for(let attempt=0;attempt<2;attempt++){
   try{return await client.get('/transient',{signal});}
   catch(e){if(signal.aborted||!axios.isAxiosError(e)||e.response?.status!==503||attempt===1)throw e;}
 }
 throw new Error('不可达：重试次数已耗尽');
}
function validate(value:unknown):Feed[] {
 if(!Array.isArray(value)||value.length>30)throw new Error('响应不是受控列表');
 return value.map(item=>{
   const row=item as Partial<Feed>|null;
   if(!row||typeof row!=='object'||typeof row.id!=='string'||typeof row.title!=='string'||
      !['a','b'].includes(row.tenant??''))throw new Error('响应数据字段非法');
   return row as Feed;
 });
}
export default function AxiosWorkshop({level}:{level:Level}){
 const [logs,setLogs]=useState<string[]>([]);
 const [result,setResult]=useState('');
 const [tenant,setTenant]=useState<'a'|'b'>('a');
 const [draft,setDraft]=useState('');
 const composing=useRef(false);
 const generation=useRef(0);
 const active=useRef<AbortController|null>(null);
 const timer=useRef<number|null>(null);
 const [client]=useState(()=>makeFixtureClient(message=>setLogs(history=>[...history.slice(-9),message])));
 useEffect(()=>()=>{generation.current++;active.current?.abort();if(timer.current!==null)window.clearTimeout(timer.current);client.dispose();},[client]);
 function controller(){active.current?.abort();active.current=new AbortController();generation.current++;return {signal:active.current.signal,token:generation.current};}
 async function search(value:string,selected:'a'|'b',slow=false){
  const {signal,token}=controller();setResult('请求进行中…');
  try {
   const response=await client.client.get<unknown>(slow?'/slow':'/feeds',{params:{q:value,tenant:selected},signal});
   const data=validate(response.data);
   if(token===generation.current&&!signal.aborted)setResult(JSON.stringify({tenant:selected,data},null,2));
  } catch(e){
   if(token===generation.current)setResult(axios.isCancel(e)||signal.aborted?'请求已取消':String(e));
  }
 }
 async function testFailure(kind:'retry'|'conflict'){
  const {signal,token}=controller();setResult('验证真实 Axios 适配与拦截器…');
  try{
   const response=kind==='retry'?await boundedGetRetry(client.client,signal)
      :await client.client.post('/conflict',{feed:'a1',revision:0},{signal});
   if(token===generation.current)setResult('status '+response.status+': '+JSON.stringify(response.data));
  } catch(e) {
   const message=axios.isAxiosError(e)?'HTTP '+(e.response?.status??'no status')+' '+e.message:String(e);
   if(token===generation.current)setResult(message);
  }
 }
 return <section aria-label="Axios HTTP client workshop">
  <h2>{level==='basic'?'Axios 实例与拦截器':level==='business'?'RSS 跨租户搜索与取消':'GET 503重试 / POST 409不重试'}</h2>
  <p>请求真正经过 Axios.create、请求/响应拦截器与 AxiosAdapter；业务后端由严格限定域名的内存 adapter模拟，不触达外网。</p>
  {level!=='advanced'&&<div className="demo-controls">
   <label>租户 <select aria-label="租户" value={tenant} onChange={e=>{const v=e.target.value as 'a'|'b';setTenant(v);void search('',v);}}>
    <option value="a">技术团队A</option><option value="b">业务团队B</option></select></label>
   {level==='business'&&<label>RSS标题 <input aria-label="RSS标题" value={draft} onChange={e=>setDraft(e.target.value)}
      onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={()=>{composing.current=false;}}/></label>}
   <button type="button" onClick={()=>{if(!composing.current)void search(draft.trim(),tenant);}}>GET 列表</button>
   {level==='business'&&<button type="button" onClick={()=>{void search('',tenant,true);timer.current=window.setTimeout(()=>{timer.current=null;void search('React',tenant);},40);}}>先慢后快竞态</button>}
   <button type="button" onClick={()=>active.current?.abort()}>取消请求</button>
  </div>}
  {level==='advanced'&&<div className="demo-controls">
   <button type="button" onClick={()=>void testFailure('retry')}>GET 503 限定重试</button>
   <button type="button" onClick={()=>void testFailure('conflict')}>POST 409 不重试</button>
  </div>}
  <pre data-testid="axios-result" role="status">{result||'等待操作'}</pre>
  <h3>实际适配器调用日志</h3><ol>{logs.map((line,index)=><li key={index}>{line}</li>)}</ol>
  <p>生产环境需要统一可取消真实 adapter、明确请求鉴权和重试预算；HTTP状态由本 fixture 适配器显式映射，不能当真实网络验证。</p>
 </section>;
}
