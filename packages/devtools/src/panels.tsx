'use client'

import type { ButtonHTMLAttributes, ComponentType, ReactNode } from 'react'
import { useSyncExternalStore } from 'react'
import type { LighthouseState } from './lighthouse-types.js'
import type { ScanController } from './scan-controller.js'

export type { LighthouseReport, LighthouseState } from './lighthouse-types.js'

interface PanelProps {
  Button: ComponentType<ButtonHTMLAttributes<HTMLButtonElement>>
}

function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section
      aria-label={label}
      style={{ padding: 24, overflow: 'auto', height: '100%', color: 'inherit' }}
    >
      <div style={{ maxWidth: 900, display: 'grid', gap: 16 }}>{children}</div>
    </section>
  )
}

export function ReactScanPanel({
  controller,
  Button,
}: PanelProps & { controller: ScanController }) {
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  )
  return (
    <Panel label="React Scan controls">
      <strong style={{ fontSize: 20 }}>React Scan</strong>
      <p>高亮组件重新渲染。默认关闭，开启后无需重启开发服务器。</p>
      <p role="status">扫描状态：{state.enabled ? '运行中' : '已暂停'}</p>
      <div>
        <Button onClick={() => controller.configure(!state.enabled, state.toolbar)}>
          {state.enabled ? '暂停扫描' : '开启扫描'}
        </Button>
      </div>
      <label>
        <input
          type="checkbox"
          checked={state.toolbar}
          onChange={(event) => controller.configure(state.enabled, event.currentTarget.checked)}
        />{' '}
        显示 React Scan 详细检查工具栏
      </label>
      <p>需要查看组件、props 和渲染原因时打开详细工具栏；关闭后控制入口仍在这里。</p>
      {state.error ? <p role="alert">{state.error}</p> : null}
    </Panel>
  )
}

export function LighthousePanel({
  state,
  loading = false,
  error = null,
  onRun,
  onRefresh,
  Button,
}: PanelProps & {
  state?: LighthouseState
  loading?: boolean
  error?: string | null
  onRun: () => void
  onRefresh: () => void
}) {
  const running = state?.running ?? false
  const report = state?.report
  return (
    <Panel label="Lighthouse audits">
      <strong style={{ fontSize: 20 }}>Lighthouse</strong>
      <p>查看本地报告，或审计当前开发服务器的首页。</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <Button disabled={running || loading} onClick={onRun}>
          {running ? '审计进行中…' : '运行开发页审计'}
        </Button>
        <Button disabled={running || loading} onClick={onRefresh}>
          刷新报告
        </Button>
      </div>
      <p>开发页包含热更新和调试工具，评分仅供排查。正式评分请在本模板目录执行：</p>
      <pre style={{ padding: 12, border: '1px solid currentColor', borderRadius: 8 }}>
        pnpm lighthouse
      </pre>
      <p role="status">
        {running
          ? 'Lighthouse 正在运行，报告会自动更新。'
          : loading
            ? '读取报告…'
            : report
              ? '已读取最近一次本地报告。'
              : '暂无报告。运行一次审计后会显示评分。'}
      </p>
      {error || state?.error ? <p role="alert">{error || state?.error}</p> : null}
      {report ? (
        <>
          <p style={{ overflowWrap: 'anywhere' }}>
            {report.url} · {report.fetchedAt}
          </p>
          <dl style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            {report.categories.map((category) => (
              <div key={category.id}>
                <dt>{category.title}</dt>
                <dd style={{ margin: 0, fontSize: 28 }}>
                  {category.score === null ? '—' : Math.round(category.score * 100)}
                </dd>
              </div>
            ))}
          </dl>
          <dl>
            {report.metrics.map((metric) => (
              <div key={metric.title} style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <dt>{metric.title}</dt>
                <dd style={{ margin: 0 }}>{metric.value}</dd>
              </div>
            ))}
          </dl>
          <strong>需要关注的审计项</strong>
          {report.audits.length ? (
            <ul>
              {report.audits.map((audit) => (
                <li key={audit.title}>
                  {audit.title}
                  {audit.value ? `：${audit.value}` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p>当前报告没有未通过的审计项。</p>
          )}
          <p>完整 JSON 和 HTML 报告位于本模板的 .lighthouseci/。</p>
        </>
      ) : null}
    </Panel>
  )
}
