import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {AgGridProvider,AgGridReact} from 'ag-grid-react';
import {AllCommunityModule,themeQuartz,type ColDef,type CellEditRequestEvent} from 'ag-grid-community';
import {applyStatusEdit,reconcileFeedSnapshot} from './edit-policy.mjs';

type Level='basic'|'business'|'advanced';
type Status='active'|'paused'|'error';
type Source={id:string;name:string;category:string;articles:number;status:Status;revision:number};
const STATUSES:Status[]=['active','paused','error'];
const MODULES=[AllCommunityModule]; // only Community, no Enterprise or license key.
const THEME=themeQuartz.withParams({fontFamily:'system-ui',accentColor:'#296b51'});
function makeRows(count:number):Source[]{
 return Array.from({length:count},(_,i)=>({
  id:'feed-'+String(i+1).padStart(4,'0'),
  name:['Frontend Weekly','Open Source Radar','AI Engineering'][i%3]+' '+(i+1),
  category:['前端','开源','AI'][i%3], articles:(i*7)%130,
  status:STATUSES[i%3],revision:1
 }));
}
export default function AgGridExample({level}:{level:Level}){
 const [rows,setRows]=useState<Source[]>(()=>makeRows(level==='basic'?12:level==='business'?150:1500));
 const rowsRef=useRef(rows); // synchronous domain snapshot for edit / refresh races
 const [lastEdit,setLastEdit]=useState('尚未编辑');
 const [filter,setFilter]=useState('');
 const [status,setStatus]=useState('本地数据就绪');
 const controller=useRef<AbortController|null>(null);
 const generation=useRef(0);
 useEffect(()=>{const snapshot=makeRows(level==='basic'?12:level==='business'?150:1500);rowsRef.current=snapshot;setRows(snapshot);return()=>{controller.current?.abort();generation.current++;};},[level]);
 const columns=useMemo<ColDef<Source>[]>(()=>[
  {field:'id',headerName:'来源 ID',minWidth:130},
  {field:'name',headerName:'频道',minWidth:190,flex:1,filter:'agTextColumnFilter'},
  {field:'category',headerName:'分类',minWidth:105,filter:'agTextColumnFilter'},
  {field:'articles',headerName:'文章数',minWidth:100,filter:'agNumberColumnFilter'},
  {field:'status',headerName:'状态',minWidth:145,editable:true,cellEditor:'agSelectCellEditor',
   cellEditorParams:{values:STATUSES}},
  {field:'revision',headerName:'版本',minWidth:85}
 ],[]);
 const defaultColDef=useMemo<ColDef<Source>>(()=>({sortable:true,resizable:true}),[]);
 const onCellEditRequest=useCallback((event:CellEditRequestEvent<Source>)=>{
  if(event.colDef.field!=='status'||!event.data)return;
  const next=String(event.newValue) as Status;
  if(!STATUSES.includes(next))return;
  const result=applyStatusEdit(rowsRef.current,event.data.id,next,event.data.revision);
  if(result.outcome==='applied'){
   rowsRef.current=result.rows;setRows(result.rows);setLastEdit(event.data.id+' → '+next);
   setStatus('状态编辑已按 revision 提交到本地模型');
  }else if(result.outcome==='conflict')setStatus('409：旧版本编辑已拒绝；请按最新行版本重试');
  else if(result.outcome!=='unchanged')setStatus('编辑未应用：'+result.outcome);
 },[]);
 const getRowId=useCallback((params:{data:Source})=>params.data.id,[]);
 const shown=useMemo(()=>filter?rows.filter(row=>row.name.toLocaleLowerCase().includes(filter.toLocaleLowerCase())):rows,[rows,filter]);
 async function reload(delay:number){
  generation.current++;controller.current?.abort();
  const sequence=generation.current;const next=new AbortController();controller.current=next;setStatus('正在加载本地数据（演示请求竞态）');
  try{
   await new Promise<void>((resolve,reject)=>{
    const timer=window.setTimeout(()=>{next.signal.removeEventListener('abort',cancel);resolve();},delay);
    const cancel=()=>{window.clearTimeout(timer);reject(new DOMException('Aborted','AbortError'));};
    next.signal.addEventListener('abort',cancel,{once:true});
   });
   if(sequence!==generation.current||next.signal.aborted)return;
   const refreshed=reconcileFeedSnapshot(rowsRef.current,makeRows(level==='advanced'?1500:150));
   rowsRef.current=refreshed;setRows(refreshed);setStatus('已接收最新快照；同 ID 较新的本地编辑不会被旧快照覆盖');
  }catch{if(sequence===generation.current)setStatus('已取消上一批请求');}
 }
 return <section aria-label="AG Grid Community 网格">
  <h2>{level==='basic'?'可排序编辑的 RSS 来源表':level==='business'?'订阅中心状态管理':'千行网格与请求竞态'}</h2>
  {level!=='basic'&&<label>过滤频道名称 <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="输入关键字"/></label>}
  <p>总数 {rows.length}，当前显示 {shown.length}。行身份使用业务 ID，不使用数组索引。</p>
  {level==='advanced'&&<div className="demo-controls">
   <button type="button" onClick={()=>void reload(700)}>启动慢数据加载</button>
   <button type="button" onClick={()=>void reload(100)}>启动快数据加载</button>
   <button type="button" onClick={()=>{generation.current++;controller.current?.abort();setStatus('已取消');}}>取消加载</button>
   <button type="button" onClick={()=>setStatus('模拟旧版本写入：'+applyStatusEdit(rowsRef.current,'feed-0001','paused',0).outcome+'（期望 conflict）')}>模拟旧版本编辑</button>
  </div>}
  <p role="status">{status}。上一次状态编辑：{lastEdit}</p>
  <AgGridProvider modules={MODULES}><div style={{height:370,width:'100%',minWidth:0}}>
   <AgGridReact<Source> rowData={shown} columnDefs={columns} defaultColDef={defaultColDef} theme={THEME}
    getRowId={getRowId} readOnlyEdit onCellEditRequest={onCellEditRequest}
    pagination={level!=='basic'} paginationPageSize={25} paginationPageSizeSelector={[25,50,100]}
   />
  </div></AgGridProvider>
  <p>双击状态列选择 active/paused/error。请求带行 revision 做 compare-and-swap；快照按稳定 ID 合并较新的本地状态，不复活服务器删除的行。此示例仅使用 Community 能力。</p>
 </section>;
}
