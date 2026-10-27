import {useEffect,useState} from 'react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {createApi,type BaseQueryFn} from '@reduxjs/toolkit/query/react';

type Level='basic'|'business'|'advanced';
type Feed={id:string;tenant:string;title:string;paused:boolean};
type QueryArg={kind:'list';tenant:string;search:string}|{kind:'toggle';tenant:string;id:string};
type Failure={status:number;data:string};
const FIXTURE:Feed[]=[
 {id:'news',tenant:'team-a',title:'科技日报',paused:false},
 {id:'frontend',tenant:'team-a',title:'前端精选',paused:false},
 {id:'security',tenant:'team-b',title:'安全研究',paused:false},
 {id:'conflict',tenant:'team-b',title:'只读受保护频道',paused:false}
];
function wait(ms:number,signal:AbortSignal){
 return new Promise<void>((resolve,reject)=>{
  if(signal.aborted){reject(new DOMException('Aborted','AbortError'));return;}
  const abort=()=>{clearTimeout(timer);reject(new DOMException('Aborted','AbortError'));};
  const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},ms);
  signal.addEventListener('abort',abort,{once:true});
 });
}
export function createDemoRuntime(){
 let feeds=FIXTURE.map(row=>({...row}));
 let delay=200;
 const baseQuery:BaseQueryFn<QueryArg,Feed[]|Feed,Failure>=async(arg,{signal})=>{
  try{await wait(delay,signal);}
  catch{return {error:{status:499,data:'aborted'}};}
  if(arg.kind==='list')return {data:feeds.filter(row=>row.tenant===arg.tenant&&row.title.includes(arg.search))};
  const target=feeds.find(row=>row.tenant===arg.tenant&&row.id===arg.id);
  if(!target)return {error:{status:404,data:'not-found'}};
  if(target.id==='conflict')return {error:{status:409,data:'stale-revision'}};
  const updated={...target,paused:!target.paused};
  feeds=feeds.map(row=>row===target?updated:row);
  return {data:updated};
 };
 const api=createApi({
  reducerPath:'rlCD13RtkApi',
  baseQuery,
  tagTypes:['Feeds'],
  endpoints:builder=>({
   list:builder.query<Feed[],{tenant:string;search:string}>({
    query:({tenant,search})=>({kind:'list',tenant,search}),
    providesTags:(_result,_error,args)=>[{type:'Feeds',id:args.tenant}]
   }),
   toggle:builder.mutation<Feed,{tenant:string;id:string}>({
    query:({tenant,id})=>({kind:'toggle',tenant,id}),
    invalidatesTags:(_result,_error,args)=>[{type:'Feeds',id:args.tenant}]
   })
  })
 });
 const store=configureStore({reducer:{[api.reducerPath]:api.reducer},middleware:getDefaultMiddleware=>getDefaultMiddleware().concat(api.middleware)});
 return {api,store,setDelay:(next:number)=>{delay=next;}};
}
type Runtime=ReturnType<typeof createDemoRuntime>;
function FeedsPanel({runtime,tenant,search,level}:{runtime:Runtime;tenant:string;search:string;level:Level}){
 const {data=[],isLoading,isFetching,isError,error,refetch}=runtime.api.useListQuery({tenant,search});
 const [toggle,mutation]=runtime.api.useToggleMutation();
 const [notice,setNotice]=useState('当前数据来自隔离内存 fixture');
 async function change(row:Feed){
  try{await toggle({tenant,id:row.id}).unwrap();setNotice('已修改，RTK Query 对此租户缓存标签发起失效刷新');}
  catch(e){setNotice('操作被拒绝：'+JSON.stringify(e));}
 }
 return <div>
  <p>{isLoading?'加载中':isFetching?'后台刷新中':isError?'查询失败':'查询完成'} · 租户 {tenant}</p>
  {isError&&<p role="alert">{JSON.stringify(error)}</p>}
  <div className="demo-controls"><button type="button" onClick={()=>void refetch()}>重新获取本租户</button>
    {level==='advanced'&&<button type="button" onClick={()=>runtime.store.dispatch(runtime.api.util.resetApiState())}>清空当前示例缓存</button>}</div>
  <ul>{data.map(row=><li key={row.id}>{row.title} — {row.paused?'暂停':'启用'} <button disabled={mutation.isLoading} onClick={()=>void change(row)}>切换状态</button></li>)}</ul>
  {data.length===0&&!isLoading&&<p>当前查询没有订阅结果。</p>}
  <p role="status">{notice}</p>
  {level==='advanced'&&<p>尝试 team-b 的 conflict 频道触发模拟 409；切回 team-a，检查不同 tenant 查询缓存互不复用。重置仅作用于本示例私有 store。</p>}
 </div>;
}
export default function RtkQueryExample({level}:{level:Level}){
 const [runtime]=useState(createDemoRuntime);
 const [tenant,setTenant]=useState('team-a');
 const [search,setSearch]=useState('');
 useEffect(()=>()=>{runtime.store.dispatch(runtime.api.util.resetApiState());},[runtime]);
 return <section aria-label="RTK Query 实际运行示例">
  <h2>{level==='basic'?'缓存查询与失效':level==='business'?'多租户 RSS 订阅':'取消、409 和缓存隔离'}</h2>
  <div className="demo-controls">{level!=='basic'&&<label>租户 <select value={tenant} onChange={e=>setTenant(e.target.value)}>
    <option value="team-a">team-a</option><option value="team-b">team-b</option>
   </select></label>}
   <label>标题搜索 <input value={search} onChange={e=>setSearch(e.target.value)}/></label>
   {level==='advanced'&&<button type="button" onClick={()=>runtime.setDelay(700)}>模拟慢传输</button>}
  </div>
  <Provider store={runtime.store}><FeedsPanel runtime={runtime} tenant={tenant} search={search} level={level}/></Provider>
  <p>查询 key 同时包含 tenant 与 search，服务端仍需验证租户权限；本地 fixture 与授权服务不是一回事。</p>
 </section>;
}
