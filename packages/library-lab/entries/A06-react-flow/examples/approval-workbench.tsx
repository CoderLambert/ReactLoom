import { useState } from 'react'
import ApprovalDesigner from './approval-designer'
import {
  createDefinition,
  type Level,
  LIMITS,
  parseDefinition,
  publishDefinition,
  validateDefinition,
} from './approval-model.ts'
import {
  actOnRequest,
  type Decision,
  inspectRequest,
  submitRequest,
  type Values,
} from './approval-runtime.ts'
import { parseWorkspace, saveWorkspace, type Workspace } from './approval-storage.ts'
import './approval-workbench.css'

const statusNames = { pending: '待审批', approved: '审批通过', rejected: '已驳回' }
const storageKey = (level: Level) => `reactloom:lab:A06:approval:v1:${level}`
function load(level: Level): {
  workspace: Workspace
  error: string
  saved: string
  raw: string | null
} {
  const fallback: Workspace = {
    schemaVersion: 1,
    draft: createDefinition(level),
    release: null,
    requests: [],
  }
  let raw: string | null = null
  try {
    raw = localStorage.getItem(storageKey(level))
    const workspace = raw ? parseWorkspace(raw) : fallback
    return { workspace, error: '', saved: raw ? JSON.stringify(workspace) : '', raw }
  } catch (error) {
    return {
      workspace: fallback,
      error: `本地数据无法恢复，原数据尚未覆盖；保存将替换本条目的数据：${String(error)}`,
      saved: '',
      raw,
    }
  }
}
function Workbench({ level }: { level: Level }) {
  const [initial] = useState(() => load(level))
  const [workspace, setWorkspace] = useState(initial.workspace)
  const [saved, setSaved] = useState(initial.saved)
  const [expectedRaw, setExpectedRaw] = useState(initial.raw)
  const [tab, setTab] = useState<'design' | 'apply' | 'requests'>('design')
  const [error, setError] = useState(initial.error)
  const [message, setMessage] = useState('先配置并发布，再填写申请。示例配置可直接发布体验。')
  const [values, setValues] = useState<Values>({})
  const [selectedRequest, setSelectedRequest] = useState(
    initial.workspace.requests.at(-1)?.id ?? '',
  )
  const [actor, setActor] = useState('直属经理')
  const [comment, setComment] = useState('')
  const [json, setJson] = useState('')
  const current =
    workspace.requests.find((r) => r.id === selectedRequest) ?? workspace.requests.at(-1)
  const inspection = current ? inspectRequest(current) : null
  const actors = [
    ...new Set(
      (
        current?.release.definition.nodes ??
        workspace.release?.definition.nodes ??
        workspace.draft.nodes
      )
        .filter((n) => n.data.kind === 'approval')
        .map((n) => n.data.approver)
        .filter(Boolean),
    ),
  ]
  const activeActor = actors.includes(actor) ? actor : (actors[0] ?? '')
  const issues = validateDefinition(workspace.draft)
  const dirty = JSON.stringify(workspace) !== saved
  function attempt(action: () => void) {
    try {
      action()
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }
  // Write the complete next state before presenting a successful business action.
  function commit(next: Workspace, note: string) {
    saveWorkspace(localStorage, storageKey(level), next, expectedRaw)
    setExpectedRaw(JSON.stringify(next))
    setWorkspace(next)
    setSaved(JSON.stringify(next))
    setMessage(note)
  }
  function decide(decision: Decision['decision']) {
    if (!current || !inspection?.current) return
    const expectedNode = inspection.current.id
    attempt(() => {
      const updated = actOnRequest(current, expectedNode, activeActor, decision, comment)
      commit(
        {
          ...workspace,
          requests: workspace.requests.map((r) => (r.id === current.id ? updated : r)),
        },
        decision === 'approve' ? '审批已通过，工单已按配置流转。' : '工单已驳回。',
      )
      setComment('')
    })
  }
  return (
    <section className="lc-app" aria-label="低代码审批工作台">
      <header className="lc-header">
        <div>
          <p className="lc-kicker">REACT FLOW / LOW CODE STUDIO</p>
          <h2>把审批规则，变成可运行的业务</h2>
          <p>配置表单 → 编排审批 → 发布版本 → 提交与处理工单</p>
        </div>
        <div className="lc-version">
          <strong>{workspace.release ? `已发布 v${workspace.release.version}` : '尚未发布'}</strong>
          <span>{dirty ? '存在未保存的更改' : '工作区已保存'}</span>
        </div>
      </header>
      <p className="lc-local-note">
        本地运行项目 · 数据仅保存在当前浏览器 ·
        审批角色可切换用于演示，不提供真实身份鉴权。请使用样例数据。
      </p>
      <div className="lc-topbar">
        <nav aria-label="工作台页面">
          {(
            [
              ['design', '配置流程'],
              ['apply', '填写申请'],
              ['requests', '工单中心'],
            ] as const
          ).map(([id, label]) => (
            <button
              type="button"
              key={id}
              aria-pressed={tab === id}
              onClick={() => {
                setTab(id)
                setError('')
              }}
            >
              {label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => attempt(() => commit(workspace, '工作区已保存到当前浏览器。'))}
        >
          保存工作区
        </button>
      </div>
      {error && (
        <p className="lc-error" role="alert">
          {error}
        </p>
      )}
      <p className="lc-message" role="status">
        {message}
      </p>
      {tab === 'design' && (
        <>
          <div className="lc-publish-bar">
            <span>{issues.length ? `待完善 ${issues.length} 项` : '结构校验通过，可以发布'}</span>
            <button
              className="lc-primary"
              type="button"
              onClick={() =>
                attempt(() => {
                  const release = publishDefinition(workspace.draft, workspace.release)
                  commit(
                    { ...workspace, release },
                    `已发布 v${release.version}。后续申请使用该版本；在途工单仍使用原版本。`,
                  )
                  setValues({})
                })
              }
            >
              发布流程
            </button>
          </div>
          {issues.length > 0 && (
            <details className="lc-validation">
              <summary>查看发布校验问题</summary>
              <ul>
                {issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </details>
          )}
          <ApprovalDesigner
            draft={workspace.draft}
            onChange={(draft) => {
              setWorkspace((previous) => ({ ...previous, draft }))
              setError('')
            }}
            onError={setError}
          />
          {level === 'advanced' && (
            <details className="lc-panel">
              <summary>JSON 配置导入 / 导出</summary>
              <p>导入只替换草稿，需要通过校验；不会发布或修改已有工单。最多 200 KB。</p>
              <label>
                流程 JSON
                <textarea
                  rows={8}
                  maxLength={LIMITS.json + 1}
                  value={json}
                  spellCheck={false}
                  onChange={(e) => setJson(e.target.value)}
                />
              </label>
              <div className="lc-row">
                <button
                  type="button"
                  onClick={() =>
                    attempt(() => {
                      const definition = parseDefinition(JSON.stringify(workspace.draft))
                      setJson(JSON.stringify(definition, null, 2))
                      setMessage('已生成配置 JSON，可选择文本复制。')
                    })
                  }
                >
                  导出配置
                </button>
                <button
                  type="button"
                  onClick={() =>
                    attempt(() => {
                      const draft = parseDefinition(json)
                      setWorkspace((previous) => ({ ...previous, draft }))
                      setMessage('配置已导入草稿；请保存或发布。')
                    })
                  }
                >
                  导入配置
                </button>
              </div>
            </details>
          )}
        </>
      )}
      {tab === 'apply' && (
        <section className="lc-form-page">
          {workspace.release ? (
            <>
              <div>
                <span className="lc-pill">运行已发布版本 v{workspace.release.version}</span>
                <h3>{workspace.release.definition.name}</h3>
                <p>表单来自发布配置。草稿改动在再次发布前不会影响这里。</p>
              </div>
              <form
                className="lc-panel lc-request-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  attempt(() => {
                    if (!workspace.release) throw new Error('请先发布流程')
                    if (workspace.requests.length >= LIMITS.requests)
                      throw new Error('本地最多保存 50 张工单')
                    const request = submitRequest(workspace.release, values, crypto.randomUUID())
                    commit(
                      { ...workspace, requests: [...workspace.requests, request] },
                      '申请已提交，请在工单中心处理。',
                    )
                    setSelectedRequest(request.id)
                    setValues({})
                    setComment('')
                    setTab('requests')
                  })
                }}
              >
                {workspace.release.definition.fields.map((field) => (
                  <label key={field.id} htmlFor={`lc-form-${field.id}`}>
                    {field.label}
                    {field.required ? ' *' : ''}
                    {field.type === 'select' ? (
                      <select
                        id={`lc-form-${field.id}`}
                        aria-label={`${field.label}${field.required ? ' *' : ''}`}
                        required={field.required}
                        value={values[field.id] ?? ''}
                        onChange={(e) =>
                          setValues((old) => ({ ...old, [field.id]: e.target.value }))
                        }
                      >
                        <option value="">请选择</option>
                        {field.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={`lc-form-${field.id}`}
                        aria-label={`${field.label}${field.required ? ' *' : ''}`}
                        type={field.type === 'number' ? 'number' : 'text'}
                        required={field.required}
                        maxLength={2000}
                        min={field.type === 'number' ? 0 : undefined}
                        max={field.type === 'number' ? 1e12 : undefined}
                        step={field.type === 'number' ? 'any' : undefined}
                        value={values[field.id] ?? ''}
                        onChange={(e) =>
                          setValues((old) => ({
                            ...old,
                            [field.id]:
                              field.type === 'number' && e.target.value !== ''
                                ? Number(e.target.value)
                                : e.target.value,
                          }))
                        }
                      />
                    )}
                  </label>
                ))}
                <button type="submit" className="lc-primary">
                  提交申请
                </button>
              </form>
            </>
          ) : (
            <div className="lc-empty">
              <h3>还没有可填写的申请</h3>
              <p>先发布有效版本，系统将按配置生成表单。</p>
              <button type="button" onClick={() => setTab('design')}>
                前往配置
              </button>
            </div>
          )}
        </section>
      )}
      {tab === 'requests' && (
        <div className="lc-inbox">
          <aside className="lc-panel">
            <h3>工单列表 · {workspace.requests.length}</h3>
            {!workspace.requests.length && <p>暂无申请。</p>}
            {[...workspace.requests].reverse().map((request, index) => (
              <button
                type="button"
                className="lc-ticket"
                key={request.id}
                aria-pressed={current?.id === request.id}
                onClick={() => {
                  setSelectedRequest(request.id)
                  setComment('')
                  setError('')
                }}
              >
                <strong>
                  申请 #{workspace.requests.length - index} · v{request.release.version}
                </strong>
                <span>{statusNames[inspectRequest(request).status]}</span>
                <small>{new Date(request.submittedAt).toLocaleString()}</small>
              </button>
            ))}
          </aside>
          {current && inspection ? (
            <article className="lc-panel lc-ticket-detail">
              <span className="lc-pill" data-testid="request-version">
                绑定发布版本 v{current.release.version}
              </span>
              <h3>{current.release.definition.name}</h3>
              <p
                className={`lc-request-status lc-status-${inspection.status}`}
                data-testid="request-status"
              >
                {inspection.current
                  ? `待审批：${inspection.current.data.approver}`
                  : statusNames[inspection.status]}
              </p>
              <dl className="lc-values">
                {current.release.definition.fields.map((field) => (
                  <div key={field.id}>
                    <dt>{field.label}</dt>
                    <dd>{String(current.values[field.id] ?? '—')}</dd>
                  </div>
                ))}
              </dl>
              {inspection.current && (
                <fieldset className="lc-review">
                  <legend>{inspection.current.data.label}</legend>
                  <label>
                    当前操作角色
                    <select value={activeActor} onChange={(e) => setActor(e.target.value)}>
                      {actors.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="lc-muted">
                    本地角色切换用于演示。当前仅允许「{inspection.current.data.approver}」处理。
                  </p>
                  <label>
                    审批意见
                    <textarea
                      maxLength={500}
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </label>
                  <div className="lc-row">
                    <button
                      type="button"
                      className="lc-primary"
                      disabled={activeActor !== inspection.current.data.approver}
                      onClick={() => decide('approve')}
                    >
                      通过申请
                    </button>
                    <button
                      type="button"
                      className="lc-danger"
                      disabled={activeActor !== inspection.current.data.approver}
                      onClick={() => decide('reject')}
                    >
                      驳回申请
                    </button>
                  </div>
                </fieldset>
              )}
              <h4>操作与流转记录</h4>
              <ol className="lc-history" data-testid="request-history">
                {inspection.history.map((item) => (
                  <li key={item.nodeId}>
                    <strong>{item.message}</strong>
                    <time dateTime={item.at}>{new Date(item.at).toLocaleString()}</time>
                  </li>
                ))}
              </ol>
            </article>
          ) : (
            <div className="lc-empty">
              <h3>让配置真正跑起来</h3>
              <p>发布并提交申请后，这里会展示待办、分支流转与处理记录。</p>
            </div>
          )}
        </div>
      )}
      <footer className="lc-footer">
        JSON 定义驱动表单与审批 · 版本快照隔离 · 预定义规则执行 · 无任意脚本
      </footer>
    </section>
  )
}
export default function ApprovalWorkbench({ level }: { level: Level }) {
  return <Workbench key={level} level={level} />
}
