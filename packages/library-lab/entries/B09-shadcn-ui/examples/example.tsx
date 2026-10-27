import {useEffect,useRef,useState} from 'react';
import {Button} from './ui/button';
import {archiveByIds,isCurrentArchiveRun,pendingArchiveIds} from './archive-policy';

type Level = 'basic'|'business'|'advanced';
type Article={id:string;title:string;archived:boolean};
const INITIAL:Article[]=[
  {id:'a1',title:'React 工程工具精选',archived:false},
  {id:'a2',title:'开源项目趋势',archived:true},
  {id:'a3',title:'架构复盘周报',archived:false},
];
export default function ShadcnSourceExample({level}:{level:Level}){
  const [articles,setArticles]=useState<Article[]>(INITIAL);
  const [selected,setSelected]=useState<string[]>([]);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('这组组件源码随项目维护，不调用虚构的 shadcn 运行时。');
  const [variant,setVariant]=useState<'default'|'secondary'|'outline'|'destructive'>('default');
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const operationEpoch=useRef(0);
  function cancelPending(){
    operationEpoch.current++;
    if(timer.current!==null)clearTimeout(timer.current);
    timer.current=null;
  }
  useEffect(()=>{
    setBusy(false);
    return()=>{operationEpoch.current++;if(timer.current!==null)clearTimeout(timer.current);timer.current=null;};
  },[level]);
  function toggle(id:string){if(!busy)setSelected(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id]);}
  function archive(){
    if(busy)return;
    const snapshot=pendingArchiveIds(articles,selected);
    if(!snapshot.length){setMessage('所选条目均已归档，无需重复执行');return;}
    cancelPending();
    const epoch=operationEpoch.current;
    setBusy(true);
    timer.current=setTimeout(()=>{
      if(!isCurrentArchiveRun(epoch,operationEpoch.current))return;
      setArticles(old=>archiveByIds(old,snapshot));
      setMessage('批量归档了 '+snapshot.length+' 条数据（仅当前浏览器内存）');
      setSelected([]);setBusy(false);timer.current=null;
    },250);
  }
  return <section aria-label="shadcn/ui 自有源码模式">
    <h2>{level==='basic'?'本地Button源码与变体':level==='business'?'RSS列表操作与批量归档':'asChild、键盘与禁用边界'}</h2>
    <p>运行的是 <code>examples/ui/button.tsx</code> 的真实 Button 源码，底层使用 cva + Radix Slot；shadcn/ui不是可直接调用的按钮SDK。</p>
    <div className="demo-controls">
      <label>Variant <select value={variant} onChange={e=>setVariant(e.target.value as typeof variant)}>
        <option value="default">默认</option><option value="secondary">次级</option><option value="outline">描边</option><option value="destructive">危险操作</option>
      </select></label>
      <Button variant={variant} onClick={()=>setMessage('点击的是本地Button组件')} type="button">操作按钮</Button>
      <Button variant="outline" size="sm" onClick={()=>setMessage('小按钮事件正常')} type="button">小尺寸</Button>
      <Button variant="secondary" disabled type="button">禁用</Button>
    </div>
    {level!=='basic'&&<div style={{border:'1px solid #d8e2d7',borderRadius:8,padding:12}}>
      <h3>订阅文章（状态真实可操作）</h3>
      <ul style={{listStyle:'none',padding:0}}>{articles.map(article=><li key={article.id}
        style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
        <label style={{display:'flex',alignItems:'center',gap:8,flex:1}}>
          <input type="checkbox" disabled={busy} checked={selected.includes(article.id)} onChange={()=>toggle(article.id)}/>
          {article.title}
        </label>
        <span>{article.archived?'已归档':'待阅读'}</span>
      </li>)}</ul>
      <Button disabled={!selected.length||busy} type="button" onClick={archive}>
        {busy?'归档中…':'归档已选 '+selected.length+' 项'}
      </Button>
    </div>}
    {level==='advanced'&&<div className="demo-controls" style={{marginTop:14}}>
      <Button asChild variant="outline"><a href="https://ui.shadcn.com/docs/components/button" target="_blank" rel="noopener noreferrer">官方Button文档 ↗</a></Button>
      <Button variant="destructive" type="button" onClick={()=>{
        cancelPending();setBusy(false);setArticles(INITIAL);setSelected([]);setMessage('恢复本地示例数据');
      }}>重置本地数据</Button>
    </div>}
    <p role="status">{message}</p>
    <p>可访问性：Icon-only按钮要显式提供aria-label；asChild为链接时不要依赖原生button禁用属性。</p>
  </section>;
}