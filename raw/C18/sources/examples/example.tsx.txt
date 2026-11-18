import { useEffect, useState } from 'react'
import { I18nextProvider, Trans, useTranslation } from 'react-i18next'
import type { Language } from './language-switch.mjs'
import { SafeEmphasis } from './safe-emphasis.mjs'
import {
  createWorkspace,
  isLanguage,
  type Workspace,
  type WorkspaceSnapshot,
} from './workspace.mjs'
import './styles.css'

type Level = 'basic' | 'business' | 'advanced'

function LocalizedPanel({
  level,
  scope,
  workspace,
  view,
}: {
  level: Level
  scope: string
  workspace: Workspace
  view: WorkspaceSnapshot
}) {
  // The hook's i18n wrapper changes identity with language in 17.0.16.
  // The queue uses workspace.instance, not that per-render snapshot.
  const { t, ready } = useTranslation(['common', 'feed'], { useSuspense: false })
  const [count, setCount] = useState(2)
  const [name, setName] = useState('Lambert')
  if (!ready) return <p role="status">等待命名空间就绪…</p>
  return (
    <article className="c18-panel" aria-label={scope + '翻译面板'} data-testid={'c18-' + scope}>
      <h3>
        {scope} · {t('common:title')}
      </h3>
      <div className="c18-controls">
        <label>
          语言{' '}
          <select
            aria-label={scope + '语言'}
            value={view.requested}
            onChange={(event) => {
              const next = event.currentTarget.value
              if (isLanguage(next)) workspace.request(next)
            }}
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </label>
        <label>
          未读数量{' '}
          <input
            aria-label={scope + '未读数量'}
            type="number"
            min="0"
            max="99"
            step="1"
            value={count}
            onChange={(event) =>
              setCount(
                Math.max(0, Math.min(99, Math.trunc(Number(event.currentTarget.value) || 0))),
              )
            }
          />
        </label>
      </div>
      {level !== 'basic' && (
        <label>
          用户昵称{' '}
          <input
            aria-label={scope + '用户昵称'}
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
          />
        </label>
      )}
      <div className="c18-output" data-testid={'react-i18next-' + scope}>
        <p data-testid="c18-greeting">{t('common:greeting', { name })}</p>
        <p data-testid="c18-unread">
          {t('feed:label')} · {t('feed:unread', { count })}
        </p>
        {level !== 'basic' && (
          <p data-testid="c18-legal">
            <Trans i18nKey="legal" ns="common" components={{ strong: <SafeEmphasis /> }} />
          </p>
        )}
        {level === 'advanced' && (
          <p>缺省回退：{t('feed:absent', { defaultValue: '（等待本地化）' })}</p>
        )}
      </div>
      {level === 'advanced' && (
        <div className="c18-controls">
          <label>
            <input
              type="checkbox"
              aria-label={scope + '手动放行切换'}
              checked={view.manual}
              onChange={(event) => workspace.setManual(event.currentTarget.checked)}
            />
            手动放行切换（本地 Promise fixture）
          </label>
          <button
            type="button"
            onClick={() => workspace.release()}
            disabled={!view.awaitingRelease}
          >
            放行在途切换
          </button>
          <button type="button" onClick={() => workspace.reject()} disabled={!view.awaitingRelease}>
            拒绝在途切换
          </button>
          <button
            type="button"
            onClick={() => workspace.request(view.requested)}
            disabled={view.status !== 'error'}
          >
            重试最新选择
          </button>
        </div>
      )}
      <p role="status" data-testid="c18-status">
        请求 {view.requested} / 实际 {view.actual} / 已提交 {view.committed} / {view.status}
        {view.awaitingRelease ? ' / 等待本地放行' : ''}
      </p>
      <pre data-testid="c18-state">{JSON.stringify(view, null, 2)}</pre>
      {view.error && <p role="alert">{view.error}</p>}
    </article>
  )
}

function ScopedTranslation({
  level,
  scope,
  initial,
}: {
  level: Level
  scope: string
  initial: Language
}) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [view, setView] = useState<WorkspaceSnapshot | null>(null)
  useEffect(() => {
    const local = createWorkspace(initial, setView)
    setWorkspace(local)
    setView(local.snapshot())
    void local.start()
    return () => local.dispose()
  }, [initial])
  if (!workspace || !view?.ready)
    return <p role={view?.error ? 'alert' : 'status'}>{view?.error || '加载独立语言资源…'}</p>
  return (
    <I18nextProvider i18n={workspace.instance} defaultNS="common">
      <LocalizedPanel level={level} scope={scope} workspace={workspace} view={view} />
    </I18nextProvider>
  )
}

export default function ReactI18nextWorkshop({ level }: { level: Level }) {
  const [revision, setRevision] = useState(0)
  return (
    <section
      className="c18-workshop"
      data-testid="c18-workshop"
      data-level={level}
      aria-label="react-i18next 实际绑定教学"
    >
      <h2>
        {level === 'basic'
          ? 'useTranslation 与动态语言'
          : level === 'business'
            ? '多命名空间与 Trans 富文本'
            : '两个隔离的语言 Provider'}
      </h2>
      <p>
        真实 React 订阅与私有 i18next 实例。翻译资源是源码内 fixture；手动放行/拒绝是本地 Promise
        gate，没有网络和计时服务。
      </p>
      <button type="button" onClick={() => setRevision((value) => value + 1)}>
        重置当前演示
      </button>
      <div key={level + ':' + revision} className="c18-workspaces">
        <ScopedTranslation level={level} scope="工作区 A" initial="zh" />
        {level === 'advanced' && <ScopedTranslation level={level} scope="工作区 B" initial="en" />}
      </div>
    </section>
  )
}
