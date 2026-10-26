import {useMemo,useRef,useState} from 'react';
import Fuse from 'fuse.js';
type Level='basic'|'business'|'advanced';
type Group='技术'|'商业'|'开源';
type Article={id:string;title:string;summary:string;group:Group;tags:string[]};
const initial:Article[]=[
 {id:'01',title:'React 组件边界实践',summary:'错误边界和状态隔离',group:'技术',tags:['React','组件']},
 {id:'02',title:'前端性能分析',summary:'渲染瓶颈与代码分割',group:'技术',tags:['性能','Vite']},
 {id:'03',title:'Ract 查询实验',summary:'故意拼写错误以测试模糊检索',group:'技术',tags:['搜索']},
 {id:'04',title:'创业公司观察',summary:'企业产品和增长策略',group:'商业',tags:['产品']},
 {id:'05',title:'开源工具周报',summary:'GitHub 新项目、库和开发者工具',group:'开源',tags:['GitHub','开源']},
 {id:'06',title:'TypeScript 严格模式',summary:'领域对象和运行时数据校验',group:'技术',tags:['类型','架构']},
];
export function createArticleIndex(docs:Article[],threshold:number){
 return new Fuse(docs,{
   includeScore:true,includeMatches:true,threshold,ignoreLocation:true,
   keys:[{name:'title',weight:0.65},{name:'summary',weight:0.25},{name:'tags',weight:0.10}],
 });
}
export default function FuseWorkshop({level}:{level:Level}){
 const [docs,setDocs]=useState<Article[]>(initial);
 const [draft,setDraft]=useState('React');
 const [query,setQuery]=useState('React');
 const [group,setGroup]=useState<Group|'全部'>('全部');
 const [threshold,setThreshold]=useState(0.35);
 const composing=useRef(false);
 // Scope the searchable collection before indexing and before the result limit.
 // Production ACL and tenant constraints must be applied at this boundary.
 const scopedDocs=useMemo(()=>group==='全部'?docs:docs.filter(item=>item.group===group),[docs,group]);
 const engine=useMemo(()=>createArticleIndex(scopedDocs,threshold),[scopedDocs,threshold]);
 const results=useMemo(()=>{
   return query.trim()?engine.search(query.trim(),{limit:20}).map(hit=>({
     item:hit.item,score:hit.score??null,matches:hit.matches?.map(part=>part.key)??[],
   })):scopedDocs.map(item=>({item,score:null,matches:[] as (string|undefined)[]}));
 },[engine,scopedDocs,query]);
 function addRecord(){
   if(docs.some(item=>item.id==='new'))return;
   setDocs(old=>[...old,{id:'new',title:'React Query 新订阅',summary:'新导入 RSS 频道，真实触发索引重建',group:'技术',tags:['React','RSS']}]);
 }
 return <section aria-label="Fuse.js 浏览器模糊搜索">
  <h2>{level==='basic'?'带分数的模糊查询':level==='business'?'RSS 频道分类、排序与输入法':'阈值比较和动态索引变更'}</h2>
  <p>真正调用 Fuse.js 7.5.0 Fuse.search，不请求网络；搜索结果仅以文本显示，不渲染第三方 HTML。</p>
  <form className="demo-controls" onSubmit={e=>{e.preventDefault();if(!composing.current)setQuery(draft.trim());}}>
   <label>检索关键词 <input aria-label="检索关键词" value={draft} onChange={e=>setDraft(e.target.value)}
      onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={()=>{composing.current=false;}}/></label>
   <button type="submit">开始检索</button>
   {level!=='basic'&&<label>频道分组 <select aria-label="频道分组" value={group} onChange={e=>setGroup(e.target.value as typeof group)}>
    {(['全部','技术','商业','开源'] as const).map(v=><option key={v}>{v}</option>)}</select></label>}
  </form>
  {level==='advanced'&&<div className="demo-controls">
   <label>threshold <select aria-label="容错阈值" value={threshold} onChange={e=>setThreshold(Number(e.target.value))}>
    {[0,0.15,0.35,0.55].map(value=><option value={value} key={value}>{value.toFixed(2)}</option>)}</select></label>
   <button type="button" onClick={addRecord}>增量导入新 RSS（重建索引）</button>
  </div>}
  <p role="status">匹配 {results.length}/{scopedDocs.length} 条；空查询展示当前分组所有文档。</p>
  {results.length?<ol data-testid="fuse-results">{results.map(({item,score,matches})=>
   <li key={item.id}><strong>{item.title}</strong> · {item.group}
    <p>{item.summary}</p>
    {score!==null&&<small>得分 {score.toFixed(3)}（越小越相似） · 命中字段 {matches.filter(Boolean).join('、')}</small>}
   </li>)}</ol>:<p>没有匹配项，尝试降低筛选范围或提高 threshold。</p>}
  <p>Fuse 负责模糊匹配，不是服务端全文索引；大数据量应对比 MiniSearch/Pagefind 或服务端搜索。</p>
 </section>;
}
