import {useRef, useState} from 'react';
import {NuqsAdapter} from 'nuqs/adapters/tanstack-router';
import {parseAsInteger, parseAsString, useQueryState} from 'nuqs';

type Props={level:'basic'|'business'|'advanced'};
type Feed={id:string;name:string;group:'tech'|'business'};
const feeds:Feed[]=[
 {id:'rss-001',name:'React 官方博客',group:'tech'},
 {id:'rss-002',name:'前端部署实践',group:'tech'},
 {id:'rss-003',name:'产品发布日志',group:'business'},
 {id:'rss-004',name:'技术架构周刊',group:'tech'},
 {id:'rss-005',name:'商业市场观察',group:'business'},
];
function QueryWorkshop({level}:Props){
 // Prefix keys: this route already owns tab and example, which must not be overwritten.
 const [query,setQuery]=useQueryState('ll_c19_q',parseAsString.withDefault('').withOptions({history:'replace'}));
 const [page,setPage]=useQueryState('ll_c19_page',parseAsInteger.withDefault(1).withOptions({history:level==='advanced'?'push':'replace'}));
 const [group,setGroup]=useQueryState('ll_c19_group',parseAsString.withDefault('all'));
 const [draft,setDraft]=useState(query);
 const composing=useRef(false);
 const normalizedGroup=group==='tech'||group==='business'?group:'all';
 const matches=feeds.filter(item=>(normalizedGroup==='all'||item.group===normalizedGroup)&&item.name.toLowerCase().includes(query.toLowerCase()));
 const safePage=Math.max(1,Math.min(5,Number.isFinite(page)?page:1));
 const pageItems=matches.slice((safePage-1)*2,safePage*2);
 const commit=(value:string)=>{void setQuery(value||null);void setPage(null);};
 return <section aria-label="nuqs 实际URL状态示例">
  <h2>{level==='basic'?'字符串查询与 URL':level==='business'?'RSS筛选与分页':'push/replace 与错误参数'}</h2>
  <p>使用真实 nuqs parser、hook 和 TanStack Router 适配器；参数使用 ll_c19_ 前缀，不覆盖当前页面的 tab/example。</p>
  <div className="demo-controls"><label>搜索
   <input aria-label="RSS 搜索" value={draft} onCompositionStart={()=>{composing.current=true;}}
   onCompositionEnd={event=>{composing.current=false;commit(event.currentTarget.value);}}
   onChange={event=>{setDraft(event.target.value);if(!composing.current)commit(event.target.value);}}/>
  </label>
  {level!=='basic'&&<label>分组 <select aria-label="分组筛选" value={normalizedGroup}
   onChange={event=>{void setGroup(event.target.value==='all'?null:event.target.value);void setPage(null);}}>
   <option value="all">全部</option><option value="tech">技术</option><option value="business">商业</option>
  </select></label>}
  <button type="button" onClick={()=>{setDraft('');void setQuery(null);void setPage(null);void setGroup(null);}}>清除实验参数</button></div>
  <p>已解析：query={query||'（空）'}, page={safePage}, group={normalizedGroup}</p>
  <ul aria-label="筛选结果">{(level==='basic'?matches:pageItems).map(item=><li key={item.id}>{item.name} · {item.group}</li>)}</ul>
  {!matches.length&&<p role="status">没有匹配的订阅</p>}
  {level!=='basic'&&<div className="demo-controls">
   <button type="button" disabled={safePage<=1} onClick={()=>void setPage(safePage-1)}>上一页</button>
   <span>第 {safePage} 页</span>
   <button type="button" disabled={safePage*2>=matches.length} onClick={()=>void setPage(safePage+1)}>下一页</button>
  </div>}
  {level==='advanced'&&<><p>本模式翻页使用 push，使浏览器返回可以恢复此前页码；搜索仍 replace，避免每个按键新增历史条目。</p><p>试着在地址栏将 ll_c19_page 改为非法文本：parser 会使用默认值，业务仍需限制页码范围。</p></>}
 </section>;
}
export default function NuqsExample({level}:Props){
 return <NuqsAdapter><QueryWorkshop level={level}/></NuqsAdapter>;
}
