import {useEffect, useMemo, useRef, useState, type FormEvent} from 'react';
import {
  createColumnHelper, createPaginatedRowModel, createSortedRowModel,
  rowPaginationFeature, rowSelectionFeature, rowSortingFeature,
  sortFn_text, tableFeatures, useTable,
  type PaginationState, type RowSelectionState, type SortingState,
} from '@tanstack/react-table';
import {clampPageIndex,createPageRequestGate,tableQueryIdentity} from './page-policy.mjs';

export type Feed = {id:string; title:string; category:'技术'|'资讯'|'商业'; subscribers:number; status:'active'|'paused'};
type Props = {level:'basic'|'business'|'advanced'};
type Response = {rows:Feed[]; total:number};
type OwnedResponse = Response & {identity:string;generation:number};
export const feedSeed: Feed[] = Array.from({length:18},(_,i)=>({
  id:'feed-'+String(100+i),
  title:['Frontend Engineering','Platform Weekly','AI Systems','News Digest','Open Source'][i%5]+' #'+(i+1),
  category:(['技术','资讯','商业'] as const)[i%3],
  subscribers:100+i*31,
  status:i%4===0?'paused':'active',
}));

const features=tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  sortedRowModel:createSortedRowModel(),
  paginatedRowModel:createPaginatedRowModel(),
  sortFns:{text:sortFn_text},
});
const helper=createColumnHelper<typeof features,Feed>();
const columns=helper.columns([
  helper.display({id:'select',header:'选择',enableSorting:false,cell:({row})=><input
    type="checkbox" aria-label={'选择 '+row.original.title}
    checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()}/>}),
  helper.accessor('title',{header:'RSS 来源',sortFn:'text'}),
  helper.accessor('category',{header:'分类',sortFn:'text'}),
  helper.accessor('subscribers',{header:'订阅数'}),
  helper.accessor('status',{header:'订阅状态',sortFn:'text'}),
]);

function fetchLocalPage(params:{pageIndex:number;pageSize:number;sort:SortingState;query:string;fail:boolean;limit:number},signal:AbortSignal):Promise<Response>{
  return new Promise((resolve,reject)=>{
    if(signal.aborted){reject(new DOMException('已取消','AbortError'));return;}
    let done=false;
    const cancel=()=>{if(done)return;done=true;clearTimeout(timer);signal.removeEventListener('abort',cancel);reject(new DOMException('已取消','AbortError'));};
    const timer=setTimeout(()=>{
      if(done)return;done=true;signal.removeEventListener('abort',cancel);
      if(params.fail){reject(new Error('本地模拟服务端 503'));return;}
      const filtered=feedSeed.slice(0,params.limit).filter(x=>(x.title+x.category).toLowerCase().includes(params.query.toLowerCase()));
      const sort=params.sort[0];const sorted=[...filtered];
      if(sort&&['title','category','subscribers','status'].includes(sort.id)){
        sorted.sort((a,b)=>{
          const left=a[sort.id as keyof Feed],right=b[sort.id as keyof Feed];
          const order=typeof left==='number'&&typeof right==='number'?left-right:String(left).localeCompare(String(right),'zh');
          return (sort.desc?-order:order)||a.id.localeCompare(b.id);
        });
      }
      const start=params.pageIndex*params.pageSize;
      resolve({rows:sorted.slice(start,start+params.pageSize),total:sorted.length});
    },360);
    signal.addEventListener('abort',cancel,{once:true});
  });
}

export default function TableExample({level}:Props){
  const advanced=level==='advanced';
  const [query,setQuery]=useState('');
  const [draft,setDraft]=useState('');
  const composing=useRef(false);
  const composingEndBefore=useRef(0);
  const [sorting,setSorting]=useState<SortingState>([]);
  const [pagination,setPagination]=useState<PaginationState>({pageIndex:0,pageSize:level==='basic'?18:5});
  const [rowSelection,setRowSelection]=useState<RowSelectionState>({});
  const [remote,setRemote]=useState<OwnedResponse>({rows:[],total:0,identity:'',generation:-1});
  const [pendingIdentity,setPendingIdentity]=useState('');
  const [error,setError]=useState({identity:'',message:''});
  const [fail,setFail]=useState(false);
  const [retry,setRetry]=useState(0);
  const [serverLimit,setServerLimit]=useState(feedSeed.length);
  const requestGate=useRef<ReturnType<typeof createPageRequestGate>|null>(null);
  if(!requestGate.current)requestGate.current=createPageRequestGate();
  const identity=advanced?tableQueryIdentity({
    pageIndex:pagination.pageIndex,pageSize:pagination.pageSize,sorting,query,fail,limit:serverLimit,
  }):'';
  const currentRemote:Response=advanced&&remote.identity===identity&&
    remote.generation===requestGate.current.revision()?remote:{rows:[],total:0};
  const pending=advanced&&pendingIdentity===identity;
  const currentError=error.identity===identity?error.message:'';
  useEffect(()=>{
    setPagination(p=>{
      const size=level==='basic'?18:5;
      return p.pageIndex===0&&p.pageSize===size?p:{pageIndex:0,pageSize:size};
    });
  },[level]);
  const clientRows=useMemo(()=>feedSeed.filter(x=>(x.title+x.category).toLowerCase().includes(query.toLowerCase())),[query]);
  useEffect(()=>{
    if(!advanced){requestGate.current?.invalidate();return;}
    const gate=requestGate.current!;
    const lease=gate.begin();
    setPendingIdentity(identity);
    setError({identity,message:''});
    setRemote({identity,generation:lease.generation,rows:[],total:0});
    void fetchLocalPage({
      pageIndex:pagination.pageIndex,pageSize:pagination.pageSize,sort:sorting,query,fail,limit:serverLimit,
    },lease.signal)
      .then(result=>{
        if(!lease.owns())return;
        const corrected=clampPageIndex(pagination.pageIndex,pagination.pageSize,result.total);
        if(corrected!==pagination.pageIndex){
          gate.invalidate();
          setPagination(p=>({...p,pageIndex:corrected}));
          return; // Re-fetch corrected page; never commit results for the old page.
        }
        setRemote({...result,identity,generation:lease.generation});
      })
      .catch(e=>{if(lease.owns())setError({identity,message:String(e)});})
      .finally(()=>{
        if(lease.owns())setPendingIdentity('');
        lease.close();
      });
    return()=>lease.cancel();
  },[advanced,identity,pagination.pageIndex,pagination.pageSize,sorting,query,fail,retry,serverLimit]);
  const invalidateAndRefresh=()=>{
    requestGate.current?.invalidate();
    setRetry(value=>value+1); // Force a fresh effect even if an updater returns the same state.
  };
  const onSort=(next:SortingState|((previous:SortingState)=>SortingState))=>{
    invalidateAndRefresh();
    setSorting(current=>(typeof next==='function'?next(current):next).slice(0,1));
    setPagination(p=>({...p,pageIndex:0}));
  };
  const onPaginationChange=(next:PaginationState|((current:PaginationState)=>PaginationState))=>{
    invalidateAndRefresh();
    setPagination(next);
  };
  const rows=advanced?currentRemote.rows:clientRows;
  const table=useTable({
    features,columns,data:rows,getRowId:row=>row.id,
    manualSorting:advanced,manualPagination:advanced,
    rowCount:advanced?currentRemote.total:undefined,
    state:{sorting,pagination,rowSelection},
    onSortingChange:onSort,
    onPaginationChange,
    onRowSelectionChange:setRowSelection,
    enableMultiSort:false,
  });
  const visible=table.getRowModel().rows;
  function search(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(composing.current)return;
    invalidateAndRefresh();
    setQuery(draft.trim());setPagination(p=>({...p,pageIndex:0}));
  }
  return <section aria-label="TanStack Table v9 实际表格">
    <h2>{level==='basic'?'Headless 表格与稳定 rowId':level==='business'?'本地筛选、排序和分页':'手动分页、失败和请求竞态'}</h2>
    <p>运行官方 v9 表格引擎。数据为本地 RSS fixture；高级模式用可取消延迟模拟服务端，不伪称真实 HTTP。</p>
    {level!=='basic'&&<form onSubmit={search} onKeyDown={event=>{
      if(event.key==='Enter'&&(event.nativeEvent.isComposing||event.nativeEvent.keyCode===229||
          composing.current||Date.now()<composingEndBefore.current))
        event.preventDefault();
    }} className="demo-controls"><label>检索 RSS 来源
      <input aria-label="检索RSS来源" value={draft} onChange={e=>setDraft(e.target.value)}
        onCompositionStart={()=>{composing.current=true;composingEndBefore.current=0;}}
        onCompositionEnd={e=>{
          composing.current=false;composingEndBefore.current=Date.now()+80;
          setDraft(e.currentTarget.value);
        }}/>
    </label><button type="submit">查询</button></form>}
    {advanced&&<div className="demo-controls">
      <button type="button" onClick={()=>{invalidateAndRefresh();setFail(false);setServerLimit(feedSeed.length);}}>恢复并刷新</button>
      <button type="button" onClick={()=>{invalidateAndRefresh();setServerLimit(2);}}>模拟后台缩减到2条</button>
      <button type="button" onClick={()=>{invalidateAndRefresh();setFail(true);}}>模拟服务端 503</button>
    </div>}
    <p role="status">{pending?'正在读取本地服务端分页…':currentError||('当前显示 '+visible.length+' 行')}</p>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}>
      <caption>RSS 订阅来源，选中状态按持久业务 ID 保存</caption>
      <thead>{table.getHeaderGroups().map(group=><tr key={group.id}>{group.headers.map(header=>{
        const direction=header.column.getIsSorted();
        return <th key={header.id} scope="col" aria-sort={direction==='asc'?'ascending':direction==='desc'?'descending':'none'}
          style={{borderBottom:'1px solid #ccd7cb',padding:'10px',textAlign:'left'}}>
          {header.isPlaceholder?null:header.column.getCanSort()
            ?<button type="button" onClick={header.column.getToggleSortingHandler()}><table.FlexRender header={header}/>{direction==='asc'?' ↑':direction==='desc'?' ↓':''}</button>
            :<table.FlexRender header={header}/>}
        </th>;
      })}</tr>)}</thead>
      <tbody>{visible.map(row=><tr key={row.id}>{row.getVisibleCells().map(cell=>
        <td key={cell.id} style={{borderBottom:'1px solid #e1e8db',padding:'10px'}}><table.FlexRender cell={cell}/></td>)}</tr>)}
        {visible.length===0&&<tr><td colSpan={5}>没有匹配的来源</td></tr>}</tbody>
    </table></div>
    {level!=='basic'&&<div className="demo-controls">
      <button type="button" disabled={pending||!table.getCanPreviousPage()} onClick={()=>table.previousPage()}>上一页</button>
      <span>第{pagination.pageIndex+1} / {Math.max(1,table.getPageCount())}页</span>
      <button type="button" disabled={pending||!table.getCanNextPage()} onClick={()=>table.nextPage()}>下一页</button>
      <label>每页
        <select aria-label="每页行数" value={pagination.pageSize} onChange={e=>table.setPageSize(Number(e.target.value))}>
          {[3,5,10].map(n=><option key={n} value={n}>{n}</option>)}
        </select>
      </label>
    </div>}
    <p>已选中的业务 ID：{Object.keys(rowSelection).filter(id=>rowSelection[id]).join(', ')||'暂无'}
      <button type="button" onClick={()=>setRowSelection({})}>清空选择</button></p>
    <p>高级分页的当前页数据不包含所有跨页选中行；不能靠 getSelectedRowModel 推断完整跨页结果。</p>
  </section>;
}
