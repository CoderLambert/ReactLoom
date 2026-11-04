import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import CatalogSearch from '../components/catalog-search'
import { GROUPS } from '../lib/catalog.mjs'
import { useCatalog } from '../lib/catalog-context'
import { filterCatalogIndex } from '../lib/catalog-index.mjs'
import type { CatalogEntry } from '../lib/types'

function sourceCompleteCount(entries: CatalogEntry[]) {
  return entries.filter((entry) => entry.contentState !== 'missing').length
}

function reactMountableCount(entries: CatalogEntry[]) {
  return entries.filter((entry) => entry.surfaces.includes('react')).length
}

function nodeCiOnlyCount(entries: CatalogEntry[]) {
  return entries.filter((entry) => entry.surfaces.length === 1 && entry.surfaces[0] === 'node-ci')
    .length
}

function frameCount(entries: CatalogEntry[]) {
  return entries.filter((entry) => entry.surfaces.includes('browser-frame')).length
}

function receiptPassCount(entries: CatalogEntry[]) {
  return entries.reduce((sum, entry) => sum + entry.receiptPasses, 0)
}

function cardState(entry: CatalogEntry) {
  if (entry.surfaces.includes('react')) return '可挂载 React · 待收据'
  if (entry.surfaces.includes('browser-frame')) return '独立画面 · 待收据'
  if (entry.surfaces.includes('worker')) return 'Worker · 待收据'
  if (entry.surfaces.includes('node-ci')) return '仅命令复现 · 页面不挂载'
  return '待接入'
}

export default function Home() {
  const entries = useCatalog()
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })
  const filtered = filterCatalogIndex(entries, search.q, search.group, search.only === 'runnable')
  const frames = frameCount(entries)
  return (
    <>
      <section className="hero">
        <p className="eyebrow">SOURCE, NOTES, THEN A RECEIPT</p>
        <h1>
          前端工具库，
          <br />
          <em>先读边界，再动手跑。</em>
        </h1>
        <p className="hero-copy">
          这里的条目是源码和中文笔记。能在页面里挂载、只能复制命令、以及带当前收据的
          PASS，是三件不同的事。仓库构建通过不会把某一条写成已验收。
        </p>
        <div className="stats">
          <div>
            <strong>{sourceCompleteCount(entries)}</strong>
            <span>源码完整</span>
          </div>
          <div>
            <strong>{reactMountableCount(entries)}</strong>
            <span>可挂载 React</span>
          </div>
          <div>
            <strong>{nodeCiOnlyCount(entries)}</strong>
            <span>仅 Node 命令</span>
          </div>
          <div>
            <strong>{receiptPassCount(entries)}</strong>
            <span>收据 PASS</span>
          </div>
        </div>
        <p className="hero-copy">
          {frames > 0 ? `另有 ${frames} 个库只在独立画面中打开。` : null}
          收据 PASS 只计 sdk、build、browser 在当前索引里仍为 PASS 的条数；没有 evidence/runs
          收据时这里是 0。
        </p>
      </section>
      <section aria-label="库目录">
        <div className="section-title">
          <h2>
            {search.group in GROUPS ? GROUPS[search.group as keyof typeof GROUPS] : '探索工具库'}
          </h2>
          <span role="status">{filtered.length} 个结果</span>
        </div>
        <div className="search-row">
          <label className="mobile-group">
            领域分类{' '}
            <select
              aria-label="选择领域分类"
              value={search.group}
              onChange={(e) =>
                void navigate({
                  to: '/',
                  search: (prev) => ({ ...prev, group: e.target.value }),
                  replace: true,
                })
              }
            >
              <option value="all">全部六组</option>
              {Object.entries(GROUPS).map(([id, name]) => (
                <option value={id} key={id}>
                  {id} · {name}
                </option>
              ))}
            </select>
          </label>
          <div className="search-box">
            <span aria-hidden="true">⌕</span>
            <CatalogSearch
              query={search.q}
              onQueryChange={(q) =>
                void navigate({ to: '/', search: (prev) => ({ ...prev, q }), replace: true })
              }
            />
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={search.only === 'runnable'}
              onChange={(e) =>
                void navigate({
                  to: '/',
                  search: (prev) => ({ ...prev, only: e.target.checked ? 'runnable' : '' }),
                  replace: true,
                })
              }
            />
            仅看可在页面挂载
          </label>
        </div>
        <div className="cards">
          {filtered.map((entry) => (
            <Link
              className="library-card"
              key={entry.entryId}
              to="/libraries/$slug"
              params={{ slug: entry.slug }}
              search={{ tab: 'demo', example: undefined }}
            >
              <div className="card-heading">
                <span className="entry-id">{entry.entryId}</span>
                <span className="card-arrow" aria-hidden="true">
                  ↗
                </span>
              </div>
              <h3>{entry.name}</h3>
              <p>{entry.summary}</p>
              <div className="card-bottom">
                <span>{cardState(entry)}</span>
                <small>{entry.contentState === 'missing' ? '资料待补' : '资料可读'}</small>
              </div>
            </Link>
          ))}
        </div>
        {!filtered.length && (
          <div className="empty">
            <h3>没有找到匹配的工具库</h3>
            <p>尝试更短的关键词或切换到全部分类。</p>
          </div>
        )}
      </section>
    </>
  )
}
