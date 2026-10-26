import {useMemo, useRef, useState} from 'react';
import {useVirtualizer} from '@tanstack/react-virtual';

type Level = 'basic' | 'business' | 'advanced';
type Article = {id: string; title: string; summary: string};

const makeArticle = (index: number): Article => ({
  id: 'rss-' + (index + 1),
  title: (index % 4 === 0 ? '工程实践' : index % 4 === 1 ? '组件方案' : index % 4 === 2 ? '前端性能' : '浏览器平台') + ' / 文章 ' + (index + 1),
  summary: ('本地虚构新闻摘要。').repeat(index % 11 + 1),
});

function VirtualList({items, advanced = false}: {items: Article[]; advanced?: boolean}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [visible, setVisible] = useState('');
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => viewport.current,
    getItemKey: (index: number) => items[index]?.id ?? 'missing-' + index,
    estimateSize: () => 94,
    overscan: 5,
    useFlushSync: false,
    onChange: instance => {
      if (!instance.isScrolling) {
        const range = instance.range;
        setVisible(range ? (range.startIndex + 1) + '–' + (range.endIndex + 1) : '空');
      }
    },
  });
  const virtualRows = virtualizer.getVirtualItems();
  return <section>
    <div className="demo-controls">
      <button type="button" disabled={!items.length} onClick={() => virtualizer.scrollToIndex(Math.max(0, items.length - 20), {align: 'center'})}>
        跳转靠近末尾
      </button>
      <button type="button" disabled={!items.length} onClick={() => virtualizer.scrollToIndex(0, {align: 'start'})}>
        回到顶部
      </button>
    </div>
    <p role="status">数据 {items.length} 条 · DOM窗口 {virtualRows.length} 条 · 当前测量范围 {visible || '初始化中'}</p>
    <div ref={viewport} role="region" aria-label="虚拟文章滚动窗口" tabIndex={0}
      style={{height: 365, overflowY: 'auto', border: '1px solid #cbd7cd', position: 'relative', overscrollBehavior: 'contain'}}>
      <div style={{height: virtualizer.getTotalSize(), width: '100%', position: 'relative'}}>
        {virtualRows.map(row => {
          const item = items[row.index];
          if (!item) return null;
          const isExpanded = expanded.has(item.id);
          return <div key={row.key} data-index={row.index} ref={virtualizer.measureElement}
            style={{position: 'absolute', top: 0, left: 0, width: '100%', boxSizing: 'border-box',
              transform: 'translateY(' + row.start + 'px)', padding: '4px 10px'}}>
            <article style={{padding: '12px', background: '#fff', border: '1px solid #e0e6db', borderRadius: 6}}>
              <h3 style={{margin: 0, fontSize: 14}}>{item.title}</h3>
              <p style={{fontSize: 13, margin: '4px 0'}}>{item.summary}</p>
              {advanced && <>
                {isExpanded && <p style={{margin: '6px 0', whiteSpace: 'pre-wrap'}}>
                  {'按需展开的额外排障步骤和长日志说明。\n'.repeat(8)}
                </p>}
                <button type="button" aria-expanded={isExpanded} onClick={() => setExpanded(current => {
                  const next = new Set(current);
                  if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
                  return next;
                })}>{isExpanded ? '收起长文' : '展开长文'}</button>
              </>}
            </article>
          </div>;
        })}
      </div>
    </div>
    <p>每个渲染节点有 data-index 和 measureElement；行高随内容变化，避免依赖错误的固定高度假设。</p>
  </section>;
}

function SearchableFeed({advanced}: {advanced: boolean}) {
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const all = useMemo(() => Array.from({length: 3400}, (_, i) => makeArticle(i)), []);
  const items = useMemo(() => all.filter(item =>
    (category === 'all' || item.title.startsWith(category)) &&
    (item.title + item.summary).toLowerCase().includes(query.toLowerCase())), [all, category, query]);
  const search = () => setQuery(draft.trim());
  return <section aria-label="TanStack Virtual 业务过滤">
    <h2>{advanced ? '动态高度：测量失效与深度跳转' : 'RSS 虚拟结果：查询与业务主键'}</h2>
    <form className="demo-controls" onSubmit={e => {e.preventDefault(); search();}}>
      <label>关键词 <input value={draft} onChange={e => setDraft(e.target.value)}
        aria-label="搜索文章" /></label>
      <label>分类 <select value={category} onChange={e => setCategory(e.target.value)}>
        <option value="all">全部</option><option value="工程实践">工程实践</option>
        <option value="组件方案">组件方案</option><option value="前端性能">前端性能</option>
      </select></label>
      <button type="submit">筛选</button>
    </form>
    <p>更新查询后重建该视图的测量索引，避免不同结果集复用旧索引。</p>
    <VirtualList key={category + '|' + query} items={items} advanced={advanced} />
  </section>;
}

function Basic() {
  const items = useMemo(() => Array.from({length: 8000}, (_, i) => makeArticle(i)), []);
  return <section aria-label="TanStack Virtual 入门">
    <h2>Headless：8,000 条记录、按需渲染可见行</h2>
    <p>本示例自己负责滚动容器、绝对定位、业务键、测量与可访问语义。缓存和请求不属于 Virtualizer。</p>
    <VirtualList items={items}/>
  </section>;
}

export default function TanstackVirtualWorkshop({level}: {level: Level}) {
  return level === 'basic' ? <Basic/> : <SearchableFeed advanced={level === 'advanced'} />;
}
