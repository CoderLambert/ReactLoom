import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react'
import { type ListRange, Virtuoso, type VirtuosoHandle } from 'react-virtuoso'
import { nextViewRevision, nextWindowLimit, normalizeFeedQuery } from './view-policy.mjs'
import './workshop.css'

type Level = 'basic' | 'business' | 'advanced'
type Article = { id: string; title: string; summary: string }
const HISTORY_CAP = 1000

function sampleArticle(index: number): Article {
  return {
    id: `article-${index}`,
    title: `第 ${index} 篇 · ${index % 3 === 0 ? 'React 工程' : index % 3 === 1 ? '性能追踪' : '架构笔记'}`,
    summary: '虚构的 RSS 内容，供测量文本高度与阅读体验使用。'.repeat(1 + (index % 8)),
  }
}

function card(article: Article, suffix?: ReactNode) {
  return (
    <article className="c09-card" data-article-id={article.id}>
      <h3>{article.title}</h3>
      <p>{article.summary}</p>
      {suffix}
    </article>
  )
}

function rangeText(range: ListRange | null) {
  return range ? `${range.startIndex + 1}–${range.endIndex + 1}` : '等待 SDK 测量'
}

function Basic() {
  const data = useMemo(
    () => Array.from({ length: 10000 }, (_, index) => sampleArticle(index + 1)),
    [],
  )
  const listRef = useRef<VirtuosoHandle>(null)
  const [range, setRange] = useState<ListRange | null>(null)
  return (
    <section className="c09-workshop" aria-label="Virtuoso 基础示例" data-testid="c09-basic">
      <h2>变高列表：10,000 条数据，只挂载当前窗口</h2>
      <p>
        虚拟化降低 DOM 规模；10,000 个数据对象仍在内存。区间来自 SDK
        rangeChanged，表示已渲染项，包含配置的缓冲区域。
      </p>
      <button
        type="button"
        onClick={() => listRef.current?.scrollToIndex({ index: 9000, align: 'center' })}
      >
        跳至第 9001 条
      </button>
      <p role="status" data-testid="c09-range">
        已渲染区间：{rangeText(range)}
      </p>
      <div data-testid="c09-viewport" className="c09-list">
        <Virtuoso
          ref={listRef}
          style={{ height: 360 }}
          data={data}
          defaultItemHeight={86}
          computeItemKey={(_index, article) => article.id}
          rangeChanged={setRange}
          itemContent={(_index, article) => card(article)}
        />
      </div>
    </section>
  )
}

function Business() {
  const all = useMemo(() => Array.from({ length: 630 }, (_, index) => sampleArticle(index + 1)), [])
  const inputId = useId()
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(30)
  const [viewRevision, setViewRevision] = useState(0)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('本地确定性 fixture，不发送 HTTP')
  const pending = useRef(false)
  const composing = useRef(false)
  const alive = useRef(false)
  const generation = useRef(0)
  const timer = useRef<number | null>(null)
  const filtered = useMemo(
    () =>
      all.filter((item) => (item.title + item.summary).toLowerCase().includes(query.toLowerCase())),
    [all, query],
  )
  const visible = filtered.slice(0, limit)
  const hasMore = visible.length < filtered.length

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      generation.current += 1
      pending.current = false
      if (timer.current !== null) window.clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  function cancelTask() {
    generation.current += 1
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
    pending.current = false
    setLoading(false)
  }

  function applySearch() {
    if (composing.current) {
      setNotice('输入法合成中；不会提交搜索')
      return
    }
    cancelTask()
    setQuery(normalizeFeedQuery(draft))
    setLimit(30)
    // Identical submissions also receive a new SDK viewport instance.
    setViewRevision(nextViewRevision)
    setNotice('筛选已提交：取消旧任务并重置滚动窗口')
  }

  function loadMore() {
    if (!alive.current || pending.current || !hasMore) return
    pending.current = true
    setLoading(true)
    setNotice('本地 260ms 延迟进行中（非 HTTP）')
    const token = ++generation.current
    timer.current = window.setTimeout(() => {
      if (!alive.current || token !== generation.current) return
      setLimit((count) => nextWindowLimit(count, filtered.length))
      pending.current = false
      setLoading(false)
      timer.current = null
      setNotice('本地下一段已追加（非 HTTP）')
    }, 260)
  }

  return (
    <section
      className="c09-workshop"
      aria-label="Virtuoso RSS 列表"
      data-testid="c09-business"
      data-loading={loading}
      data-view-revision={viewRevision}
    >
      <h2>RSS 阅读流：筛选、分页门禁与滚动窗口</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          applySearch()
        }}
        className="c09-controls"
      >
        <label htmlFor={inputId}>文章关键词</label>
        <input
          id={inputId}
          maxLength={160}
          value={draft}
          onChange={(event) => setDraft(event.currentTarget.value)}
          onCompositionStart={() => {
            composing.current = true
            setNotice('输入法合成中；不会提交搜索')
          }}
          onCompositionEnd={() => {
            composing.current = false
            setNotice('输入完成后按搜索提交')
          }}
        />
        <button type="submit">搜索</button>
      </form>
      <p role="status" data-testid="c09-load-status">
        {notice} · {visible.length}/{filtered.length} 篇 {loading ? '加载下一段…' : ''}
      </p>
      <p data-testid="c09-query">
        已提交关键词：{query || '（全部）'}；窗口版本：{viewRevision}
      </p>
      <div data-testid="c09-viewport" className="c09-list">
        <Virtuoso
          key={viewRevision}
          style={{ height: 390 }}
          data={visible}
          computeItemKey={(_index, item) => item.id}
          endReached={loadMore}
          itemContent={(_index, item) => card(item)}
        />
      </div>
      {filtered.length === 0 && <p data-testid="c09-empty">没有匹配文章，修改关键词后重新搜索。</p>}
      <div className="c09-controls">
        <button type="button" onClick={loadMore} disabled={loading || !hasMore}>
          {hasMore ? '加载下一段' : '已是最后一段'}
        </button>
        <button
          type="button"
          disabled={!loading}
          onClick={() => {
            cancelTask()
            setNotice('已取消本地延迟任务，当前条数不变')
          }}
        >
          取消本地加载
        </button>
      </div>
      <p>
        本地延迟仅模拟等待。真实接口另需
        AbortSignal、服务端游标、错误恢复及响应身份校验；虚拟化不会请求 RSS URL。
      </p>
    </section>
  )
}

type History = { firstItemIndex: number; items: Article[] }
function Advanced() {
  const listRef = useRef<VirtuosoHandle>(null)
  const [history, setHistory] = useState<History>(() => ({
    firstItemIndex: 100000,
    items: Array.from({ length: 30 }, (_, index) => sampleArticle(501 + index)),
  }))
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [atBottom, setAtBottom] = useState<boolean | null>(null)
  const first = Number(history.items[0]?.id.split('-')[1] ?? 501)
  const canPrepend = first > 1 && history.items.length < HISTORY_CAP

  function prepend() {
    setHistory((previous) => {
      const previousFirst = Number(previous.items[0]?.id.split('-')[1] ?? 501)
      const count = Math.min(
        10,
        previousFirst - 1,
        previous.firstItemIndex - 1,
        HISTORY_CAP - previous.items.length,
      )
      if (count <= 0) return previous
      return {
        firstItemIndex: previous.firstItemIndex - count,
        items: [
          ...Array.from({ length: count }, (_, index) =>
            sampleArticle(previousFirst - count + index),
          ),
          ...previous.items,
        ],
      }
    })
  }

  function append() {
    setHistory((previous) => {
      if (previous.items.length >= HISTORY_CAP) return previous
      const last = Number(previous.items.at(-1)?.id.split('-')[1] ?? 530)
      return { ...previous, items: [...previous.items, sampleArticle(last + 1)] }
    })
  }

  return (
    <section
      className="c09-workshop"
      aria-label="Virtuoso 历史记录"
      data-testid="c09-advanced"
      data-at-bottom={atBottom === null ? 'unknown' : String(atBottom)}
    >
      <h2>历史前插：保持旧消息身份和滚动位置</h2>
      <p>
        前插数据与 firstItemIndex 在一次更新中完成；业务 ID 与逻辑下标分别管理。fixture 最多 1,000
        条，不自动裁掉已有消息。
      </p>
      <div className="c09-controls">
        <button type="button" onClick={prepend} disabled={!canPrepend}>
          向前加载 10 条
        </button>
        <button type="button" onClick={append} disabled={history.items.length >= HISTORY_CAP}>
          添加最新消息
        </button>
        <button
          type="button"
          onClick={() => listRef.current?.scrollToIndex({ index: 'LAST', align: 'end' })}
        >
          跳至最新消息
        </button>
      </div>
      <p role="status" data-testid="c09-history-status">
        消息 {history.items.length} 条，窗口起点 {history.firstItemIndex}，
        {atBottom === null ? '等待 SDK 位置通知' : atBottom ? '当前在底部' : '正在阅读历史'}
      </p>
      <div data-testid="c09-viewport" className="c09-list">
        <Virtuoso
          ref={listRef}
          style={{ height: 380 }}
          data={history.items}
          firstItemIndex={history.firstItemIndex}
          computeItemKey={(_index, item) => item.id}
          atBottomStateChange={setAtBottom}
          followOutput={(bottom) => (bottom ? 'auto' : false)}
          itemContent={(_index, item) =>
            card(
              item,
              <div>
                {expanded.has(item.id) && (
                  <p className="c09-expanded">{'展开的历史消息详细说明。\n'.repeat(8)}</p>
                )}
                <button
                  type="button"
                  aria-label={`${expanded.has(item.id) ? '折叠' : '展开'} ${item.id} 说明`}
                  aria-expanded={expanded.has(item.id)}
                  onClick={() =>
                    setExpanded((current) => {
                      const next = new Set(current)
                      if (next.has(item.id)) next.delete(item.id)
                      else next.add(item.id)
                      return next
                    })
                  }
                >
                  {expanded.has(item.id) ? '折叠说明' : '展开说明'}
                </button>
              </div>,
            )
          }
        />
      </div>
      <p>
        展开插入真实长文本，由 SDK ResizeObserver
        重测。正在阅读历史时追加不强制跳到底；点击“跳至最新消息”才主动移动。
      </p>
    </section>
  )
}

export default function VirtuosoWorkshop({ level }: { level: Level }) {
  return level === 'basic' ? <Basic /> : level === 'business' ? <Business /> : <Advanced />
}
