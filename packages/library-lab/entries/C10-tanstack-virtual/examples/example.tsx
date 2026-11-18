import { useVirtualizer } from '@tanstack/react-virtual'
import { useCallback, useMemo, useRef, useState } from 'react'
import { normalizeFilterQuery, stableRowId, viewIdentity } from './filter-policy.mjs'
import {
  type Article,
  createVirtualOptions,
  filterArticles,
  makeArticles,
} from './virtual-contract'
import './styles.css'

type Level = 'basic' | 'business' | 'advanced'
function VirtualList({
  items,
  advanced = false,
  identity,
}: {
  items: Article[]
  advanced?: boolean
  identity: string
}) {
  const viewport = useRef<HTMLElement>(null)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [settledRange, setSettledRange] = useState('初始化中')
  const options = useMemo(() => createVirtualOptions(items), [items])
  const getItemKey = useCallback((index: number) => stableRowId(items, index), [items])
  const virtualizer = useVirtualizer({
    ...options,
    getScrollElement: () => viewport.current,
    getItemKey,
    useFlushSync: false,
    onChange: (instance) => {
      if (!instance.isScrolling) {
        const range = instance.range
        setSettledRange(range ? `${range.startIndex + 1}–${range.endIndex + 1}` : '空')
      }
    },
  })
  const rows = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()
  const observation = {
    count: items.length,
    virtualCount: rows.length,
    totalSize,
    firstIndex: rows[0]?.index ?? null,
    lastIndex: rows.at(-1)?.index ?? null,
    firstKey: rows[0]?.key ?? null,
    lastKey: rows.at(-1)?.key ?? null,
    scrollOffset: virtualizer.scrollOffset ?? 0,
  }
  return (
    <section data-testid="c10-view" data-view-identity={identity}>
      <div className="c10-controls">
        <button
          type="button"
          disabled={!items.length}
          onClick={() =>
            virtualizer.scrollToIndex(Math.max(0, items.length - 20), { align: 'center' })
          }
        >
          跳转靠近末尾
        </button>
        <button
          type="button"
          disabled={!items.length}
          onClick={() => virtualizer.scrollToIndex(0, { align: 'start' })}
        >
          回到顶部
        </button>
      </div>
      <p role="status" data-testid="c10-window-status">
        数据 {items.length} 条 · DOM窗口 {rows.length} 条 · 停滚后范围 {settledRange}
      </p>
      <output className="c10-model" data-testid="c10-model">
        {JSON.stringify(observation)}
      </output>
      {!items.length && <p data-testid="c10-empty">没有匹配文章；调整条件或重置筛选。</p>}
      <section
        ref={viewport}
        aria-label="虚拟文章滚动窗口"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to focus the scroll viewport for native PageDown and arrows.
        tabIndex={0}
        className="c10-viewport"
        data-testid="c10-scroll"
      >
        <div className="c10-spacer" data-testid="c10-spacer" style={{ height: totalSize }}>
          {rows.map((row) => {
            const item = items[row.index]
            if (!item) throw new RangeError('virtual row is outside the current view')
            const isExpanded = expanded.has(item.id)
            return (
              <div
                key={row.key}
                data-index={row.index}
                data-row-id={item.id}
                data-testid="c10-row"
                ref={virtualizer.measureElement}
                className="c10-row"
                style={{ transform: `translateY(${row.start}px)` }}
              >
                <article>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  {advanced && (
                    <>
                      {isExpanded && (
                        <p className="c10-long">
                          {'按需展开的额外排障步骤和长日志说明。\n'.repeat(8)}
                        </p>
                      )}
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() =>
                          setExpanded((current) => {
                            const next = new Set(current)
                            if (next.has(item.id)) next.delete(item.id)
                            else next.add(item.id)
                            return next
                          })
                        }
                      >
                        {isExpanded ? '收起长文' : '展开长文'}
                      </button>
                    </>
                  )}
                </article>
              </div>
            )
          })}
        </div>
      </section>
      <p>
        窗口来自真实Virtualizer；测量ref与data-index位于同一个外层行。94px是未测量前的估计，没有固定行高。
      </p>
    </section>
  )
}

function SearchableFeed({ advanced }: { advanced: boolean }) {
  const [draft, setDraft] = useState('')
  const [draftCategory, setDraftCategory] = useState('all')
  const [filter, setFilter] = useState({ category: 'all', query: '', revision: 0 })
  const composing = useRef(false)
  const confirmationEnterHeld = useRef(false)
  const all = useMemo(() => makeArticles(3400), [])
  const items = useMemo(
    () => filterArticles(all, filter.category, filter.query),
    [all, filter.category, filter.query],
  )
  const identity = viewIdentity(filter.category, filter.query, filter.revision)
  function search() {
    if (composing.current || confirmationEnterHeld.current) return
    setFilter((previous) => ({
      category: draftCategory,
      query: normalizeFilterQuery(draft),
      revision: previous.revision + 1,
    }))
  }
  return (
    <>
      <h2>{advanced ? '变高测量与视图重建' : '提交筛选与稳定业务键'}</h2>
      <form
        className="c10-controls"
        onSubmit={(event) => {
          event.preventDefault()
          search()
        }}
      >
        <label>
          关键词{' '}
          <input
            aria-label="搜索文章"
            maxLength={120}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onCompositionStart={() => {
              composing.current = true
              confirmationEnterHeld.current = false
            }}
            onCompositionEnd={(event) => {
              composing.current = false
              setDraft(event.currentTarget.value)
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') {
                confirmationEnterHeld.current = false
                return
              }
              if (
                composing.current ||
                event.nativeEvent.isComposing ||
                event.nativeEvent.keyCode === 229
              ) {
                confirmationEnterHeld.current = true
                event.preventDefault()
              } else if (confirmationEnterHeld.current) event.preventDefault()
            }}
            onKeyUp={(event) => {
              if (event.key === 'Enter') confirmationEnterHeld.current = false
            }}
            onBlur={() => {
              confirmationEnterHeld.current = false
            }}
          />
        </label>
        <label>
          分类{' '}
          <select
            aria-label="分类"
            value={draftCategory}
            onChange={(event) => setDraftCategory(event.target.value)}
          >
            <option value="all">全部</option>
            <option value="工程实践">工程实践</option>
            <option value="组件方案">组件方案</option>
            <option value="前端性能">前端性能</option>
          </select>
        </label>
        <button type="submit">筛选</button>
        <button
          type="button"
          onClick={() => {
            composing.current = false
            confirmationEnterHeld.current = false
            setDraft('')
            setDraftCategory('all')
            setFilter((previous) => ({
              category: 'all',
              query: '',
              revision: previous.revision + 1,
            }))
          }}
        >
          重置筛选
        </button>
      </form>
      <p>
        分类与关键词都是草稿，按“筛选”统一提交。重复提交也增加revision，重挂此视图以清除旧滚动/测量和展开状态。
      </p>
      <output className="c10-model" data-testid="c10-filter-state">
        {JSON.stringify({ ...filter, count: items.length })}
      </output>
      <VirtualList key={identity} identity={identity} items={items} advanced={advanced} />
    </>
  )
}

function BasicFeed() {
  const items = useMemo(() => makeArticles(8000), [])
  return (
    <>
      <h2>8,000条数据与小型DOM窗口</h2>
      <p>本地fixture全部在内存；组件负责容器/标记，SDK负责范围与尺寸模型。不是分页或网络加载。</p>
      <VirtualList identity={viewIdentity('all', '', 0)} items={items} />
    </>
  )
}

export default function TanstackVirtualWorkshop({ level }: { level: Level }) {
  return (
    <section
      className="c10-workshop"
      aria-label="TanStack Virtual 真实虚拟列表"
      data-testid="c10-workshop"
      data-level={level}
    >
      {level === 'basic' ? <BasicFeed /> : <SearchableFeed advanced={level === 'advanced'} />}
    </section>
  )
}
