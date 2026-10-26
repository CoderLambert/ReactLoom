import {useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {Virtuoso, type VirtuosoHandle} from 'react-virtuoso';

type Level = 'basic' | 'business' | 'advanced';
type Article = {id: string; title: string; summary: string};

function sampleArticle(index: number): Article {
  return {
    id: 'article-' + index,
    title: '第 ' + index + ' 篇 · ' + (index % 3 === 0 ? 'React 工程' : index % 3 === 1 ? '性能追踪' : '架构笔记'),
    summary: ('虚构的 RSS 内容，供测量文本高度与阅读体验使用。').repeat(1 + index % 8),
  };
}

const card = (article: Article, suffix?: ReactNode) => (
  <article style={{padding: '12px 16px', borderBottom: '1px solid #dce4db', background: '#fff'}}>
    <h3 style={{margin: 0, fontSize: 15}}>{article.title}</h3>
    <p style={{margin: '6px 0 0', fontSize: 13}}>{article.summary}</p>
    {suffix}
  </article>
);

function Basic() {
  const data = useMemo(() => Array.from({length: 10000}, (_, index) => sampleArticle(index + 1)), []);
  const listRef = useRef<VirtuosoHandle>(null);
  const [visible, setVisible] = useState('未滚动');
  return <section aria-label="Virtuoso 基础示例">
    <h2>变高列表：10,000 条数据，不渲染 10,000 个 DOM 卡片</h2>
    <p>文本长度各异；虚拟化只降低 DOM 规模，不会减少当前已创建的 JS 数组对象。</p>
    <button type="button" onClick={() => listRef.current?.scrollToIndex({index: 9000, align: 'center'})}>跳至第 9001 条</button>
    <p role="status">实际可见范围：{visible}</p>
    <Virtuoso ref={listRef} style={{height: 360, border: '1px solid #c9d7ca'}}
      data={data} defaultItemHeight={86}
      computeItemKey={(_index, article) => article.id}
      rangeChanged={range => setVisible((range.startIndex + 1) + '–' + (range.endIndex + 1))}
      itemContent={(_index, article) => card(article)}
    />
  </section>;
}

function Business() {
  const all = useMemo(() => Array.from({length: 630}, (_, index) => sampleArticle(index + 1)), []);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(30);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('本地确定性 fixture，不发送 HTTP');
  const pending = useRef(false);
  const composing = useRef(false);
  const generation = useRef(0);
  const timer = useRef<number | null>(null);
  const filtered = useMemo(() => all.filter(item => (item.title + item.summary).toLowerCase().includes(query.toLowerCase())), [all, query]);
  const visible = filtered.slice(0, limit);
  const hasMore = visible.length < filtered.length;

  useEffect(() => () => {
    generation.current += 1;
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  const applySearch = () => {
    if (composing.current) return;
    generation.current += 1;
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    pending.current = false;
    setLoading(false);
    setQuery(draft.trim());
    setLimit(30);
    setNotice('筛选变更：取消上轮本地延迟任务并重置滚动锚点');
  };

  const loadMore = () => {
    if (pending.current || !hasMore) return;
    pending.current = true;
    setLoading(true);
    const token = ++generation.current;
    timer.current = window.setTimeout(() => {
      if (token !== generation.current) return;
      setLimit(count => Math.min(count + 30, filtered.length));
      pending.current = false;
      setLoading(false);
      timer.current = null;
    }, 260);
  };

  return <section aria-label="Virtuoso RSS 列表">
    <h2>RSS 阅读流：筛选、分页门禁与滚动窗口</h2>
    <form onSubmit={event => {event.preventDefault(); applySearch();}} className="demo-controls">
      <label>文章关键词 <input aria-label="文章关键词" value={draft} onChange={e => setDraft(e.target.value)}
        onCompositionStart={() => {composing.current = true; setNotice('输入法合成中；不会提交搜索');}}
        onCompositionEnd={() => {composing.current = false; setNotice('输入完成后按搜索提交');}} /></label>
      <button type="submit">搜索</button>
    </form>
    <p role="status">{notice} · {visible.length}/{filtered.length} 篇 {loading ? '加载下一段…' : ''}</p>
    <Virtuoso key={query} style={{height: 390, border: '1px solid #c9d7ca'}}
      data={visible} computeItemKey={(_index, item) => item.id}
      endReached={loadMore}
      itemContent={(_index, item) => card(item)}
    />
    <div className="demo-controls"><button type="button" onClick={loadMore} disabled={loading || !hasMore}>
      {hasMore ? '加载下一段' : '已是最后一段'}
    </button></div>
    <p>本地延迟仅模拟用户等待；真正 API 应加入 AbortSignal、游标验证、请求并发门禁和响应版本隔离。</p>
  </section>;
}

type History = {firstItemIndex: number; items: Article[]};
function Advanced() {
  const [history, setHistory] = useState<History>(() => ({
    firstItemIndex: 100000,
    items: Array.from({length: 30}, (_, i) => sampleArticle(501 + i)),
  }));
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [atBottom, setAtBottom] = useState(true);

  const prepend = () => setHistory(prev => {
    const first = Number(prev.items[0]?.id.split('-')[1] ?? 501);
    const count = Math.min(10, first - 1, prev.firstItemIndex);
    if (count <= 0) return prev;
    return {
      firstItemIndex: prev.firstItemIndex - count,
      items: [...Array.from({length: count}, (_, index) => sampleArticle(first - count + index)), ...prev.items],
    };
  });

  const append = () => setHistory(prev => {
    const last = Number(prev.items.at(-1)?.id.split('-')[1] ?? 530);
    return {...prev, items: [...prev.items, sampleArticle(last + 1)]};
  });

  return <section aria-label="Virtuoso 历史记录">
    <h2>历史前插：保持旧消息身份和滚动位置</h2>
    <p>前插数据与 firstItemIndex 在一次状态更新中完成；从不把数组下标当业务 ID。</p>
    <div className="demo-controls">
      <button type="button" onClick={prepend}>向前加载 10 条</button>
      <button type="button" onClick={append}>添加最新消息</button>
    </div>
    <p role="status">消息 {history.items.length} 条，窗口起点 {history.firstItemIndex}，{atBottom ? '当前在底部' : '正在阅读历史'}</p>
    <Virtuoso style={{height: 380, border: '1px solid #c9d7ca'}} data={history.items}
      firstItemIndex={history.firstItemIndex}
      computeItemKey={(_index, item) => item.id}
      atBottomStateChange={setAtBottom}
      followOutput={bottom => bottom ? 'auto' : false}
      itemContent={(_index, item) => card(item, <div>
        {expanded.has(item.id) && <p style={{whiteSpace: 'pre-wrap', fontSize: 13}}>{('展开的历史消息详细说明。\n').repeat(8)}</p>}
        <button type="button" aria-expanded={expanded.has(item.id)}
          onClick={() => setExpanded(current => {
            const next = new Set(current);
            if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
            return next;
          })}>{expanded.has(item.id) ? '折叠说明' : '展开说明'}</button>
      </div>)}
    />
    <p>展开实际插入长文本，验证可变高度重测；前插时不得改变已有消息的业务键。</p>
  </section>;
}

export default function VirtuosoWorkshop({level}: {level: Level}) {
  return level === 'basic' ? <Basic /> : level === 'business' ? <Business /> : <Advanced />;
}
