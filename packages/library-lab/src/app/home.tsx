import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import CatalogSearch from '../components/catalog-search'
import { GROUPS } from '../lib/catalog.mjs'
import { useCatalog } from '../lib/catalog-context'
import { filterCatalogIndex } from '../lib/catalog-index.mjs'
export default function Home() {
  const entries = useCatalog()
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })
  const filtered = filterCatalogIndex(entries, search.q, search.group, search.only === 'runnable')
  const runnable = entries.filter((e) => e.hasDemo).length
  return (
    <>
      <section className="hero">
        <p className="eyebrow">FROM KNOWLEDGE TO WORKING CODE</p>
        <h1>
          前端工具，
          <br />
          <em>在这里真正用起来。</em>
        </h1>
        <p className="hero-copy">
          从真实示例理解原理，用工程笔记掌握边界。让每一次实践，都成为开发者与 AI Agent
          可以复用的知识。
        </p>
        <div className="stats">
          <div>
            <strong>{entries.length}</strong>
            <span>工具库条目</span>
          </div>
          <div>
            <strong>6</strong>
            <span>工程领域</span>
          </div>
          <div>
            <strong>{runnable}</strong>
            <span>已有示例</span>
          </div>
        </div>
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
            仅看已有示例
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
                <span>{entry.hasDemo ? '示例已接入 · 待核验' : '待接入'}</span>
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
