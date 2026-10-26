import {useState} from 'react';
import {chunk, groupBy, orderBy, uniqBy} from 'es-toolkit/array';

export type Source = 'official' | 'community' | 'other';
export type Article = {url: string; title: string; source: Source; publishedAt: string};
type Props = {level: 'basic' | 'business' | 'advanced'};
const seed: unknown[] = [
  {url:'https://example.org/rss?utm_source=homepage&id=42',title:'Frontend Insights',source:'official',publishedAt:'2026-10-26T06:00:00Z'},
  {url:'https://example.org/rss?id=42&utm_campaign=email',title:'Same article older',source:'official',publishedAt:'2026-10-25T06:00:00Z'},
  {url:'https://community.example.org/post/7',title:'Engineering case study',source:'community',publishedAt:'2026-10-24T06:00:00Z'},
  {url:'https://example.org/rss?id=43',title:'Release notes',source:'official',publishedAt:'2026-10-27T06:00:00Z'},
  {url:'https://dev.example.org/post/5',title:'Performance deep dive',source:'community',publishedAt:'2026-10-23T06:00:00Z'},
];

export function canonicalUrl(raw: string): string {
  const url = new URL(raw);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('只接受 HTTP/HTTPS URL');
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith('utm_') || ['fbclid','gclid'].includes(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();
  return url.toString();
}

export function normalizeArticle(raw: unknown): Article {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('文章必须是对象');
  const item = raw as Record<string,unknown>;
  if (typeof item.title !== 'string' || !item.title.trim()) throw new Error('文章标题缺失');
  if (typeof item.url !== 'string') throw new Error('文章来源 URL 缺失');
  if (typeof item.publishedAt !== 'string' || !Number.isFinite(Date.parse(item.publishedAt))) {
    throw new Error('发布日期无效');
  }
  const source: Source = item.source === 'official' || item.source === 'community' ? item.source : 'other';
  return {title:item.title.trim(),url:canonicalUrl(item.url),source,publishedAt:new Date(item.publishedAt).toISOString()};
}

export function makeDigest(raw: readonly unknown[], pageSize: number) {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) throw new RangeError('pageSize 必须为1–100');
  const accepted: Article[] = [];
  const rejected: {index:number; reason:string}[] = [];
  raw.forEach((value,index) => {
    try {accepted.push(normalizeArticle(value));}
    catch (error) {rejected.push({index,reason:error instanceof Error?error.message:String(error)});}
  });
  // orderBy + uniqBy: same canonical URL retains newest article, not first arbitrary arrival.
  const newestFirst = orderBy(accepted,[item=>Date.parse(item.publishedAt),item=>item.url],['desc','asc']);
  const articles = uniqBy(newestFirst,item=>item.url);
  const grouped = groupBy(articles,item=>item.source);
  const bySource: Record<Source,Article[]> = {official:grouped.official??[],community:grouped.community??[],other:grouped.other??[]};
  return {articles,bySource,pages:chunk(articles,pageSize),rejected};
}

export default function ToolkitExample({level}: Props) {
  const [pageSize,setPageSize] = useState(2);
  const [injectBad,setInjectBad] = useState(false);
  const [output,setOutput] = useState('');
  const [error,setError] = useState('');
  function run() {
    try {
      const raw: unknown[] = injectBad
        ? [...seed, {url:'javascript:alert(1)',title:'invalid',publishedAt:'2026-10-26T00:00:00Z'}, {foo:1}]
        : [...seed];
      const digest = makeDigest(raw,pageSize);
      const summary = level === 'basic'
        ? {groupSizes:Object.fromEntries(Object.entries(digest.bySource).map(([k,v])=>[k,v.length])),firstPage:digest.pages[0]}
        : level === 'business'
          ? {input:raw.length,unique:digest.articles.length,pages:digest.pages}
          : {data:digest.bySource,rejected:digest.rejected,canonical:canonicalUrl('https://example.org/rss?utm_source=app&id=42')};
      setOutput(JSON.stringify(summary,null,2));setError('');
    } catch(e) {setOutput('');setError(e instanceof Error?e.message:String(e));}
  }
  return <section aria-label="es-toolkit SDK 实战">
    <h2>{level==='basic'?'纯工具函数分组与去重':level==='business'?'RSS 去重聚合分页':'输入污染与恢复'}</h2>
    <p>真实 es-toolkit/array 的 orderBy、uniqBy、groupBy、chunk；输入是本地 fixture，未访问 RSS 网络。</p>
    <div className="demo-controls"><label>每页文章数
      <select aria-label="每页文章数" value={pageSize} onChange={e=>setPageSize(Number(e.target.value))}>
        {[1,2,3,5].map(n=><option key={n} value={n}>{n}</option>)}
      </select>
    </label>{level==='advanced'&&<label><input type="checkbox" checked={injectBad} onChange={e=>setInjectBad(e.target.checked)}/>包含两个坏输入</label>}
    <button type="button" onClick={run}>运行真实工具函数</button></div>
    {error&&<p role="alert">{error}</p>}{output&&<pre data-testid="toolkit-output">{output}</pre>}
    <p>先降序排列再去重，保留最新文章。只移除已识别追踪参数，不能删除业务 ID。</p>
  </section>;
}
