import {useMemo, useRef, useState} from 'react';
import MiniSearch from 'minisearch';
import {scopeSearchDocuments} from './scope-policy.mjs';

type Level = 'basic' | 'business' | 'advanced';
type Group = '技术' | '产品' | '开源';
type Doc = {id: string; title: string; summary: string; group: Group};
export const initialDocs: Doc[] = [
  {id: '1', title: 'React Suspense 实战', summary: '异步 UI 与错误边界', group: '技术'},
  {id: '2', title: 'TypeScript 业务类型', summary: '运行时验证与领域模型', group: '技术'},
  {id: '3', title: 'React Query 缓存', summary: '竞态取消与分页实践', group: '技术'},
  {id: '4', title: '创业产品增长', summary: '定价实验与用户研究', group: '产品'},
  {id: '5', title: '开源 Node 工具', summary: 'CLI 性能与构建速度', group: '开源'},
  {id: '6', title: 'React Loom 实验室', summary: '工程库文档和 Agent 笔记', group: '开源'},
];

export function buildMiniIndex(documents: Doc[]) {
  const index = new MiniSearch<Doc>({
    fields: ['title', 'summary'], storeFields: ['title', 'group'],
    searchOptions: {boost: {title: 3}, prefix: true, fuzzy: 0.2},
  });
  index.addAll(documents);
  return index;
}

export default function MiniSearchWorkshop({level}: {level: Level}) {
  const [documents, setDocuments] = useState<Doc[]>(initialDocs);
  const [draft, setDraft] = useState('React');
  const [query, setQuery] = useState('React');
  const [group, setGroup] = useState<Group | '全部'>('全部');
  const [tolerant, setTolerant] = useState(true);
  const composing = useRef(false);
  // Scope the index itself, not only rendered hits: autoSuggest can reveal terms.
  // This is a UI category demonstration, not a substitute for upstream authorization.
  const scopedDocs = useMemo(() => scopeSearchDocuments(documents, group), [documents, group]);
  const index = useMemo(() => buildMiniIndex(scopedDocs), [scopedDocs]);
  const byId = useMemo(() => new Map(scopedDocs.map(doc => [doc.id, doc])), [scopedDocs]);

  const matches = useMemo(() => {
    if (!query.trim()) return scopedDocs.map(doc => ({doc, score: null as number | null}));
    // Filter before result limiting; a category filter after slice could hide hits.
    return index.search(query.trim(), {
      fuzzy: tolerant ? 0.2 : false, prefix: true,
      filter: result => byId.has(String(result.id)),
    }).slice(0, 20).map(result => ({
      doc: byId.get(String(result.id)),
      score: result.score as number | null,
    })).filter((hit): hit is {doc: Doc; score: number | null} => Boolean(hit.doc));
  }, [index, byId, scopedDocs, query, tolerant]);

  const suggestions = useMemo(() => level === 'advanced' && query.trim()
    ? index.autoSuggest(query.trim(), {fuzzy: tolerant ? 0.2 : false, prefix: true}).slice(0, 3)
    : [], [index, query, tolerant, level]);

  function updateDocument() {
    setDocuments(old => old.map(doc => doc.id === '1'
      ? {...doc, title: 'React Suspense 与现代数据加载', summary: '已更新的 RSS 正文，需要重建索引'} : doc));
  }

  return <section aria-label="MiniSearch 全文倒排索引演示">
    <h2>{level === 'basic' ? '本地全文索引与相关性评分' :
      level === 'business' ? 'RSS 分组与权限边界' : '拼写容错、联想和索引更新'}</h2>
    <form className="demo-controls" onSubmit={event => {
      event.preventDefault(); if (!composing.current) setQuery(draft.trim());
    }}>
      <label>检索词 <input aria-label="检索词" value={draft}
        onCompositionStart={() => {composing.current = true;}}
        onCompositionEnd={() => {composing.current = false;}}
        onChange={event => setDraft(event.target.value)} /></label>
      <button type="submit">检索</button>
      {level !== 'basic' && <label>分类 <select aria-label="分类" value={group}
        onChange={event => setGroup(event.target.value as Group | '全部')}>
        <option value="全部">全部</option><option value="技术">技术</option>
        <option value="产品">产品</option><option value="开源">开源</option>
      </select></label>}
    </form>
    {level === 'advanced' && <div className="demo-controls">
      <label><input type="checkbox" checked={tolerant}
        onChange={event => setTolerant(event.target.checked)} />允许轻微拼写容错</label>
      <button type="button" onClick={updateDocument}>更新 RSS 标题并重建索引</button>
      {suggestions.length > 0 && <p>查询建议：{suggestions.map(hit => hit.suggestion).join('、')}</p>}
    </div>}
    <p role="status">匹配 {matches.length} 条；本地共有 {documents.length} 条。</p>
    <ol data-testid="minisearch-results">{matches.map(({doc, score}) =>
      <li key={doc.id}><strong>{doc.title}</strong> · {doc.group}
        <p>{doc.summary}</p>
        {score !== null && <small>相关性分数 {score.toFixed(3)}（越高越匹配）</small>}
      </li>)}</ol>
    <p>分类先裁剪索引，再运行搜索及联想；此处仍是可信 fixture，真实 ACL 必须由后端先授权。</p>
  </section>;
}

