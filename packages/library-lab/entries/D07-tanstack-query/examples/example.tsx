import {useEffect, useState} from 'react';
import {QueryClient, QueryClientProvider, useIsFetching, useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

export type Feed = {id:string; title:string; enabled:boolean; rev:number};
type Tenant = 'team-a' | 'team-b';
type Props = {level: 'basic' | 'business' | 'advanced'};
type ListPage = {items:Feed[]; total:number; page:number};
const pageSize=3;

function pause(ms:number,signal?:AbortSignal):Promise<void>{
  return new Promise((resolve,reject)=>{
    if(signal?.aborted){reject(new DOMException('已取消','AbortError'));return;}
    const stop=()=>{clearTimeout(timer);signal?.removeEventListener('abort',stop);reject(new DOMException('已取消','AbortError'));};
    const timer=setTimeout(()=>{signal?.removeEventListener('abort',stop);resolve();},ms);
    signal?.addEventListener('abort',stop,{once:true});
  });
}

/** Per-demo in-memory fixture backend. Not a real network API. */
export function createFixtureBackend(){
  const db:Record<Tenant,Feed[]>={
    'team-a':Array.from({length:9},(_,n)=>({id:'a-'+(n+1),title:'工程频道 '+(n+1),enabled:n%2===0,rev:1})),
    'team-b':Array.from({length:6},(_,n)=>({id:'b-'+(n+1),title:'商业资讯 '+(n+1),enabled:n%2===0,rev:1})),
  };
  return {
    async list(tenant:Tenant, search:string, page:number, signal:AbortSignal, delay=280):Promise<ListPage>{
      await pause(delay,signal);
      const filtered=db[tenant].filter(feed=>feed.title.toLowerCase().includes(search.toLowerCase()));
      return {items:filtered.slice(page*pageSize,(page+1)*pageSize).map(feed=>({...feed})),total:filtered.length,page};
    },
    async stats(tenant:Tenant,signal:AbortSignal){
      await pause(140,signal);
      return {total:db[tenant].length,enabled:db[tenant].filter(feed=>feed.enabled).length};
    },
    async toggle(tenant:Tenant,id:string,enabled:boolean,fail:boolean):Promise<Feed>{
      await pause(240);
      if(fail)throw new Error('业务 fixture：模拟 409 版本冲突');
      const index=db[tenant].findIndex(row=>row.id===id);
      if(index<0)throw new Error('来源不存在');
      const updated={...db[tenant][index],enabled,rev:db[tenant][index].rev+1};
      db[tenant][index]=updated;return {...updated};
    },
  };
}
type Backend=ReturnType<typeof createFixtureBackend>;
const keys={
  root:['library-lab','query-demo'] as const,
  tenant:(tenant:Tenant)=>['library-lab','query-demo',tenant] as const,
  feeds:(tenant:Tenant)=>['library-lab','query-demo',tenant,'feeds'] as const,
  list:(tenant:Tenant,search:string,page:number)=>['library-lab','query-demo',tenant,'feeds',search,page] as const,
  stats:(tenant:Tenant)=>['library-lab','query-demo',tenant,'stats'] as const,
};

function QueryWorkspace({level, backend}:{level:Props['level'];backend:Backend}){
  const client=useQueryClient();
  const [tenant,setTenant]=useState<Tenant>('team-a');
  const [draft,setDraft]=useState('');
  const [search,setSearch]=useState('');
  const [page,setPage]=useState(0);
  const [delay,setDelay]=useState(280);
  const [failNext,setFailNext]=useState(false);
  const [message,setMessage]=useState('');
  const pending=useIsFetching({queryKey:keys.tenant(tenant)});
  const stats=useQuery({queryKey:keys.stats(tenant),queryFn:({signal})=>backend.stats(tenant,signal),staleTime:10_000});
  const list=useQuery({
    queryKey:keys.list(tenant,search,page),
    queryFn:({signal})=>backend.list(tenant,search,page,signal,delay),
    staleTime:3_000,
    // Prevent previous tenant records from flashing after switching identity.
    placeholderData:(old,previous)=>previous?.queryKey?.[2]===tenant?old:undefined,
  });
  const update=useMutation({
    scope:{id:'library-lab-toggle-'+tenant},
    mutationFn:(vars:{id:string;enabled:boolean;fail:boolean})=>backend.toggle(tenant,vars.id,vars.enabled,vars.fail),
    onMutate:async(vars)=>{
      await client.cancelQueries({queryKey:keys.feeds(tenant)});
      const snapshots=client.getQueriesData<ListPage>({queryKey:keys.feeds(tenant)});
      client.setQueriesData<ListPage>({queryKey:keys.feeds(tenant)},old=>old?{
        ...old,items:old.items.map(row=>row.id===vars.id?{...row,enabled:vars.enabled}:row),
      }:old);
      return {snapshots};
    },
    onError:(error,_vars,context)=>{
      for(const [key,value] of context?.snapshots??[])client.setQueryData(key,value);
      setMessage('更新失败，已回滚：'+error.message);
    },
    onSuccess:(saved)=>setMessage('更新完成：'+saved.id+' rev '+saved.rev),
    onSettled:async()=>{await Promise.all([
      client.invalidateQueries({queryKey:keys.feeds(tenant)}),
      client.invalidateQueries({queryKey:keys.stats(tenant)}),
    ]);},
  });
  const data=list.data;
  const rows=data?.items??[];
  function switchTenant(value:Tenant){
    setTenant(value);setDraft('');setSearch('');setPage(0);setMessage('');
  }
  return <section aria-label="TanStack Query 实际SDK">
    <h2>{level==='basic'?'查询与 freshness':level==='business'?'租户隔离、缓存和分页':'取消、更新和回滚'}</h2>
    <p>SDK 操作真实 QueryClient；业务 API 是明确标注的每例隔离内存 fixture，不对外发送请求。</p>
    <div className="demo-controls"><label>工作区 <select aria-label="工作区" value={tenant} onChange={e=>switchTenant(e.target.value as Tenant)}>
      <option value="team-a">技术团队 A</option><option value="team-b">商业团队 B</option>
    </select></label><button type="button" onClick={()=>void client.invalidateQueries({queryKey:keys.tenant(tenant)})}>标记当前团队缓存失效</button></div>
    <p role="status">{pending>0?'后台查询 '+pending+' 个': '后台空闲'}</p>
    {stats.isPending?<p>正在读取统计…</p>:stats.isError?<p role="alert">{stats.error.message}</p>:<p>订阅源：{stats.data.total}；启用：{stats.data.enabled}</p>}
    {level!=='basic'&&<form className="demo-controls" onSubmit={e=>{e.preventDefault();setSearch(draft.trim());setPage(0);}}>
      <label>RSS 搜索<input aria-label="RSS 搜索" value={draft} onChange={e=>setDraft(e.target.value)}/></label>
      <button type="submit">查询</button>
    </form>}
    {level==='advanced'&&<div className="demo-controls">
      <label>本地请求延迟 <select value={delay} onChange={e=>setDelay(Number(e.target.value))}>
        <option value={280}>280ms</option><option value={900}>900ms</option>
      </select></label>
      <button type="button" onClick={()=>void client.cancelQueries({queryKey:keys.feeds(tenant)})}>取消当前列表查询</button>
      <label><input type="checkbox" checked={failNext} onChange={e=>setFailNext(e.target.checked)}/>模拟下一次更新409</label>
    </div>}
    {list.isPending?<p>读取列表中…</p>:list.isError?<p role="alert">查询失败：{list.error.message}</p>:<div>
      <ul>{rows.map(row=><li key={row.id} style={{padding:'7px 0'}}>
        {row.title} · {row.enabled?'已启用':'已暂停'} · rev {row.rev}
        {level==='advanced'&&<button type="button" disabled={update.isPending} onClick={()=>update.mutate({id:row.id,enabled:!row.enabled,fail:failNext})}>
          {row.enabled?'暂停':'启用'}
        </button>}
      </li>)}</ul>
      {rows.length===0&&<p>没有匹配的来源</p>}
    </div>}
    {level!=='basic'&&<div className="demo-controls">
      <button type="button" disabled={page===0} onClick={()=>setPage(p=>Math.max(0,p-1))}>上一页</button>
      <span>第 {page+1} 页（总数 {data?.total??0}）</span>
      <button type="button" disabled={!data|| (page+1)*pageSize>=data.total} onClick={()=>setPage(p=>p+1)}>下一页</button>
    </div>}
    {message&&<p role="status">{message}</p>}
    <p>当前 queryKey 同时包含 tenant、search、page；组件外的 Lab QueryClient 不共享此缓存。</p>
  </section>;
}

export default function TanStackQueryExample({level}: Props){
  const [client]=useState(()=>new QueryClient({defaultOptions:{queries:{retry:false,gcTime:60_000}}}));
  const [backend]=useState(createFixtureBackend);
  useEffect(()=>()=>client.clear(),[client]);
  return <QueryClientProvider client={client}><QueryWorkspace level={level} backend={backend}/></QueryClientProvider>;
}
