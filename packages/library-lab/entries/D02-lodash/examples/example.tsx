import {useEffect, useMemo, useRef, useState} from 'react';
import {debounce, groupBy, orderBy, uniqBy, chunk} from 'lodash-es';

type Level = 'basic' | 'business' | 'advanced';
type Props = {level: Level};
type Feed = {id: string; category: 'tech'|'business'|'news'; title: string; score: number};
export const feeds: Feed[] = [
  {id:'ai',category:'tech',title:'模型推理实践',score:81},
  {id:'web',category:'tech',title:'React 工程演进',score:92},
  {id:'ai',category:'tech',title:'旧版重复记录',score:17},
  {id:'market',category:'business',title:'产品与市场',score:84},
  {id:'world',category:'news',title:'国际要闻',score:74},
  {id:'startup',category:'business',title:'创业观察',score:88},
  {id:'open',category:'tech',title:'开源项目研究',score:95},
];
export function buildDigest(source: Feed[]) {
  const unique = uniqBy(source, 'id');
  const grouped = groupBy(unique, 'category');
  const groups = Object.entries(grouped).map(([category,items])=>({
    category, count: items.length, items: orderBy(items, ['score','id'], ['desc','asc']),
  }));
  return {unique, groups: orderBy(groups, ['count','category'], ['desc','asc']), batches:chunk(unique,3)};
}
export default function LodashExample({level}: Props) {
  const [query,setQuery]=useState('');
  const [debounced,setDebounced]=useState('');
  const [updates,setUpdates]=useState(0);
  const composing=useRef(false);
  const digest=useMemo(()=>buildDigest(feeds),[]);
  const schedule=useMemo(()=>debounce((value:string)=>{setDebounced(value);setUpdates(n=>n+1);},250),[]);
  useEffect(()=>()=>schedule.cancel(),[schedule]);
  const filtered=useMemo(()=>digest.unique.filter(item=>item.title.toLocaleLowerCase().includes(debounced.toLocaleLowerCase())),[digest,debounced]);
  return <section aria-label="lodash-es 实际工具函数实验">
    <h2>{level==='basic'?'基于ID去重':level==='business'?'RSS频道分组与稳定排序':'Debounce 输入与卸载清理'}</h2>
    {level==='basic'&&<><p>同一来源ID重复时保留第一条，不是保留最高分；演示 uniqBy 的明确语义。</p>
      <output className="demo-output" data-testid="lodash-output">{JSON.stringify({original:feeds.length,unique:digest.unique.length,ids:digest.unique.map(f=>f.id),batches:digest.batches.map(x=>x.length)},null,2)}</output></>}
    {level==='business'&&<><p>先对业务主键去重，再按分类分组；组内按热度降序、ID 升序稳定决胜。</p>
      <output className="demo-output" data-testid="lodash-output">{JSON.stringify(digest.groups,null,2)}</output></>}
    {level==='advanced'&&<><label htmlFor="d02-query">搜索已去重的 RSS 标题</label><input id="d02-query" value={query} onChange={event=>{setQuery(event.target.value);if(!composing.current)schedule(event.target.value);}}
      onCompositionStart={()=>{composing.current=true;schedule.cancel();}}
      onCompositionEnd={event=>{composing.current=false;schedule.cancel();setDebounced(event.currentTarget.value);}} aria-describedby="d02-info" />
      <div className="demo-controls"><button type="button" onClick={()=>schedule.flush()}>立即应用</button><button type="button" onClick={()=>{schedule.cancel();setQuery('');setDebounced('');}}>清空</button></div>
      <p id="d02-info">输入防抖 250ms，组件卸载调用 cancel；取消不会自动处理业务请求的 AbortSignal。</p>
      <p>待输入：{query} / 已应用：{debounced} / 合并提交次数：{updates}</p>
      <output className="demo-output" data-testid="lodash-output">{JSON.stringify(filtered.map(item=>item.title),null,2)}</output></>}
  </section>;
}
