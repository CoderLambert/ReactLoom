import { useLocation } from '@tanstack/react-router'
import { useQueryStates } from 'nuqs'
import { useEffect, useRef, useState } from 'react'
import { feeds, pageLink, type QueryUpdate, queryParsers, URL_KEYS } from './query-contract.mjs'
import { TanStackNuqsAdapter } from './tanstack-adapter'
import {
  beginComposition,
  createCompositionGuard,
  deriveSearchView,
  endComposition,
  recordKey,
  releaseKey,
  sanitizeQuery,
  suppressSubmit,
} from './url-policy.mjs'
import './styles.css'

type Props = { level: 'basic' | 'business' | 'advanced' }
function QueryWorkshop({ level }: Props) {
  const [state, setState] = useQueryStates(queryParsers, { urlKeys: URL_KEYS, history: 'replace' })
  const location = useLocation()
  const view = deriveSearchView({ level, ...state }, feeds)
  const [draft, setDraft] = useState(() => sanitizeQuery(state.query))
  const [draftGroup, setDraftGroup] = useState(view.safeGroup)
  const [status, setStatus] = useState('URL已读取；草稿尚未应用')
  const [lastWrite, setLastWrite] = useState<{
    history: 'push' | 'replace'
    reason: string
  } | null>(null)
  const guard = useRef(createCompositionGuard())
  const alive = useRef(true)
  const generation = useRef(0)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      generation.current += 1
    }
  }, [])
  useEffect(() => {
    if (!guard.current.composing) {
      setDraft(sanitizeQuery(state.query))
      setDraftGroup(view.safeGroup)
    }
  }, [state.query, view.safeGroup])

  function write(update: QueryUpdate | null, history: 'push' | 'replace', reason: string) {
    const current = ++generation.current
    setLastWrite({ history, reason })
    setStatus('已更新SDK状态，等待URL队列')
    void setState(update, { history }).then(
      () => {
        if (alive.current && current === generation.current)
          setStatus('SDK队列已结束；实际地址以当前URL为准')
      },
      () => {
        if (alive.current && current === generation.current)
          setStatus('URL写入失败，可重新应用筛选')
      },
    )
  }
  function apply() {
    if (suppressSubmit(guard.current)) return
    const clean = sanitizeQuery(draft)
    setDraft(clean)
    const group = draftGroup === 'tech' || draftGroup === 'business' ? draftGroup : 'all'
    write(
      {
        query: clean || null,
        page: null,
        ...(level === 'basic' ? {} : { group: group === 'all' ? null : group }),
      },
      'replace',
      '应用筛选并重置页码',
    )
  }
  function clear() {
    setDraft('')
    setDraftGroup('all')
    guard.current = createCompositionGuard()
    write(null, 'replace', '清除全部实验键，保留宿主参数')
  }
  const rows = level === 'basic' ? view.matches : view.pageItems
  const dirty = draft !== view.safeQuery || (level !== 'basic' && draftGroup !== view.safeGroup)
  return (
    <section
      className="c19-workshop"
      aria-label="nuqs 实际URL状态示例"
      data-testid="c19-workshop"
      data-level={level}
    >
      <h2>
        {level === 'basic'
          ? 'URL查询与可分享状态'
          : level === 'business'
            ? '联合筛选和分页'
            : '历史记录与深链接边界'}
      </h2>
      <p>
        真实nuqs parser/hook与TanStack Router适配器；本地5条订阅fixture，无网络查询。只写ll_c19_键。
      </p>
      <form
        className="c19-controls"
        onSubmit={(event) => {
          event.preventDefault()
          apply()
        }}
      >
        <label>
          搜索{' '}
          <input
            aria-label="RSS 搜索"
            value={draft}
            onCompositionStart={() => beginComposition(guard.current)}
            onCompositionEnd={(event) => {
              endComposition(guard.current)
              setDraft(event.currentTarget.value)
            }}
            onKeyDown={(event) =>
              recordKey(guard.current, {
                key: event.key,
                isComposing: event.nativeEvent.isComposing,
                keyCode: event.nativeEvent.keyCode,
              })
            }
            onKeyUp={(event) => releaseKey(guard.current, event.key)}
            onBlur={() => {
              guard.current.enterHeld = false
            }}
            onChange={(event) => setDraft(event.target.value)}
          />
        </label>
        {level !== 'basic' && (
          <label>
            分组{' '}
            <select
              aria-label="分组筛选"
              value={draftGroup}
              onChange={(event) => setDraftGroup(event.target.value)}
            >
              <option value="all">全部</option>
              <option value="tech">技术</option>
              <option value="business">商业</option>
            </select>
          </label>
        )}
        <button type="submit">应用筛选</button>
        <button type="button" onClick={clear}>
          清除实验参数
        </button>
      </form>
      <p data-testid="c19-draft-state">
        {dirty ? '草稿未应用，结果仍对应URL状态' : '草稿与已解析筛选一致'}
      </p>
      <p>
        已解析：query={view.safeQuery || '（空）'}，group={view.safeGroup}
        {level !== 'basic' && `，page=${view.safePage}/${view.pageCount}`}
      </p>
      <ul aria-label="筛选结果">
        {rows.map((item) => (
          <li key={item.id} data-testid="c19-result-row" data-feed-id={item.id}>
            {item.name} · {item.group}
          </li>
        ))}
      </ul>
      {!view.matches.length && <p data-testid="c19-empty">没有匹配的订阅</p>}
      {level !== 'basic' && (
        <div className="c19-controls">
          <button
            type="button"
            disabled={view.safePage <= 1}
            onClick={() =>
              write({ page: view.safePage - 1 }, level === 'advanced' ? 'push' : 'replace', '翻页')
            }
          >
            上一页
          </button>
          <span data-testid="c19-page">
            第 {view.safePage} / {view.pageCount} 页
          </span>
          <button
            type="button"
            disabled={view.safePage >= view.pageCount}
            onClick={() =>
              write({ page: view.safePage + 1 }, level === 'advanced' ? 'push' : 'replace', '翻页')
            }
          >
            下一页
          </button>
        </div>
      )}
      <p role="status" data-testid="c19-status">
        {status}
      </p>
      <output data-testid="c19-url">{location.searchStr}</output>
      <details>
        <summary>查看SDK解析与业务模型</summary>
        <pre data-testid="c19-model">
          {JSON.stringify(
            {
              sdk: state,
              router: location.search,
              safe: { query: view.safeQuery, group: view.safeGroup, page: view.safePage },
              pageCount: view.pageCount,
              matchedIds: view.matches.map((item) => item.id),
              visibleIds: rows.map((item) => item.id),
              lastWrite,
            },
            null,
            2,
          )}
        </pre>
      </details>
      {level === 'advanced' && (
        <div className="c19-links">
          <p>以下是真实同路由深链接，只改变本实验page键；原始非法值不自动改写URL。</p>
          <a href={pageLink(location.pathname, location.searchStr, location.hash, 'abc')}>
            打开 page=abc 深链接
          </a>
          {' · '}
          <a href={pageLink(location.pathname, location.searchStr, location.hash, '99')}>
            打开 page=99 深链接
          </a>
          {' · '}
          <a href={pageLink(location.pathname, location.searchStr, location.hash, '2tail')}>
            打开 page=2tail 深链接
          </a>
        </div>
      )}
      <p>
        应用筛选/清除使用replace；仅进阶翻页请求push。Promise不是请求或保存成功，Back/Forward由真实适配器同步；IME只改草稿，普通Enter才应用。
      </p>
    </section>
  )
}
export default function NuqsExample({ level }: Props) {
  return (
    <TanStackNuqsAdapter>
      <QueryWorkshop key={level} level={level} />
    </TanStackNuqsAdapter>
  )
}
