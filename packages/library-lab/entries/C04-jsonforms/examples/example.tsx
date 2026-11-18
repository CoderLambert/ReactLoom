import { createAjv } from '@jsonforms/core'
import { JsonForms } from '@jsonforms/react'
import { vanillaCells, vanillaRenderers } from '@jsonforms/vanilla-renderers'
import type { ErrorObject } from 'ajv'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  basicSchema,
  basicUiSchema,
  type Subscription,
  type SubscriptionDraft,
  type SubscriptionPayload,
  subscriptionSchema,
  subscriptionUiSchema,
  toServerError,
  toSubscriptionPayload,
  validateSubmission,
} from './submission-policy.mjs'
import './forms.css'

type Level = 'basic' | 'business' | 'advanced'
const initial: Subscription = {
  name: 'Frontend Weekly',
  feedType: 'rss',
  url: 'https://example.org/feed.xml',
  enabled: true,
}
const validateDraft = createAjv().compile(subscriptionSchema)

function abortableDelay(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const onAbort = () => {
      window.clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

export default function JsonFormsExample({ level }: { level: Level }) {
  return <JsonFormsSession key={level} level={level} />
}

function JsonFormsSession({ level }: { level: Level }) {
  const [data, setData] = useState<SubscriptionDraft>({ ...initial })
  const [basic, setBasic] = useState<{ name?: string; enabled?: boolean }>({
    name: 'Library Lab',
    enabled: true,
  })
  const [errors, setErrors] = useState<number | null>(null)
  const [serverErrors, setServerErrors] = useState<ErrorObject[]>([])
  const [status, setStatus] = useState('可修改表单并观察 Schema 校验')
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState<SubscriptionPayload | null>(null)
  const [requestCount, setRequestCount] = useState(0)
  const [notifications, setNotifications] = useState(0)
  const [formEpoch, setFormEpoch] = useState(0)
  const epoch = useRef(0)
  const alive = useRef(true)
  const request = useRef<AbortController | null>(null)
  const generation = useRef(0)
  const dataRef = useRef<SubscriptionDraft>({ ...initial })
  const composing = useRef(false)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      generation.current++
      request.current?.abort()
      request.current = null
      composing.current = false
    }
  }, [])

  const onDataChange = useCallback(
    ({ data: next, errors: validation }: { data: SubscriptionDraft; errors?: ErrorObject[] }) => {
      // JSON Forms3.8 debounces its callback by 10ms; a removed provider may still notify.
      if (!alive.current || formEpoch !== epoch.current || !next) return
      setNotifications((value) => value + 1)
      if (JSON.stringify(dataRef.current) !== JSON.stringify(next)) {
        dataRef.current = next
        generation.current++
        request.current?.abort()
        request.current = null
        setSaving(false)
        setServerErrors([])
        setSubmitted(null)
        setStatus('SDK 已通知草稿变化；旧保存已取消，请重新提交')
        setData(next)
      }
      setErrors(validation?.length ?? 0)
    },
    [formEpoch],
  )

  async function submit() {
    if (composing.current) {
      setStatus('请先完成中文输入法选词，再提交')
      return
    }
    if (!validateDraft(dataRef.current)) {
      setStatus('当前已通知草稿未通过 Schema；未发起模拟提交')
      return
    }
    const snapshot = toSubscriptionPayload(dataRef.current)
    const id = ++generation.current
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setRequestCount((value) => value + 1)
    setSubmitted(snapshot)
    setSaving(true)
    setServerErrors([])
    setStatus('正在保存到内存模拟服务…')
    try {
      await abortableDelay(level === 'advanced' ? 500 : 160, controller.signal)
      if (!alive.current || controller.signal.aborted || id !== generation.current) return
      const invalid = validateSubmission(snapshot)
      if (invalid) {
        setServerErrors([toServerError(invalid.field, invalid.message)])
        setStatus('模拟 422：字段错误已回填；没有 HTTP 请求')
      } else if (snapshot.name.toLowerCase() === 'duplicate') {
        setServerErrors([toServerError('name', '该订阅名已存在（模拟 409）')])
        setStatus('模拟 409：名称冲突已回填；没有 HTTP 请求')
      } else setStatus('保存成功：仅内存模拟响应，未发起真实网络请求。')
    } catch (error) {
      if (alive.current && id === generation.current)
        setStatus(controller.signal.aborted ? '请求已取消' : `保存失败：${String(error)}`)
    } finally {
      if (alive.current && id === generation.current) {
        setSaving(false)
        request.current = null
      }
    }
  }

  function cancel() {
    generation.current++
    request.current?.abort()
    request.current = null
    setSaving(false)
    setSubmitted(null)
    setStatus('已取消，旧结果不会回写')
  }

  function reset() {
    generation.current++
    request.current?.abort()
    request.current = null
    epoch.current++
    setFormEpoch(epoch.current)
    dataRef.current = { ...initial }
    setData({ ...initial })
    setSaving(false)
    setSubmitted(null)
    setErrors(null)
    setServerErrors([])
    composing.current = false
    setStatus('已重置当前示例')
  }

  return (
    <section
      aria-label={level === 'basic' ? 'JSON Forms 入门' : 'JSON Forms 订阅配置'}
      className="c04-workshop"
      data-testid="c04-workshop"
      data-level={level}
      data-saving={saving}
      onCompositionStart={() => {
        composing.current = true
      }}
      onCompositionEnd={() => {
        composing.current = false
      }}
    >
      <h2>
        {level === 'basic'
          ? 'Schema 驱动控件与校验'
          : level === 'business'
            ? 'HIDE 与提交白名单'
            : '字段错误、提交快照与取消'}
      </h2>
      <p>
        真实 JSON Forms 3.8.0 + Vanilla 渲染器；JSON Schema 管数据，UI Schema 管布局，业务 payload
        独立生成。
      </p>
      {level === 'basic' ? (
        <>
          <JsonForms
            schema={basicSchema}
            uischema={basicUiSchema}
            data={basic}
            renderers={vanillaRenderers}
            cells={vanillaCells}
            onChange={({ data: next, errors: issues }) => {
              if (!alive.current) return
              setNotifications((value) => value + 1)
              setBasic((old) => (JSON.stringify(old) === JSON.stringify(next) ? old : next))
              setErrors(issues?.length ?? 0)
            }}
          />
          <pre data-testid="c04-draft">{JSON.stringify(basic, null, 2)}</pre>
        </>
      ) : (
        <>
          <p>切换 manual 会隐藏地址控件，但不删除草稿 URL；当前 payload 与模拟提交快照分别显示。</p>
          <JsonForms
            key={formEpoch}
            schema={subscriptionSchema}
            uischema={subscriptionUiSchema}
            data={data}
            renderers={vanillaRenderers}
            cells={vanillaCells}
            additionalErrors={serverErrors}
            validationMode="ValidateAndShow"
            onChange={onDataChange}
          />
          <p data-testid="c04-server-errors">模拟服务字段错误：{serverErrors.length}</p>
          <div className="c04-controls">
            <button
              type="button"
              disabled={saving || errors === null || errors > 0}
              onClick={() => void submit()}
            >
              保存内存草稿
            </button>
            <button type="button" disabled={!saving} onClick={cancel}>
              取消进行中的操作
            </button>
            <button type="button" onClick={reset}>
              重置
            </button>
          </div>
          <p role="status" data-testid="c04-status">
            {status}
          </p>
          <p data-testid="c04-request-count">本会话累计模拟提交次数：{requestCount}（非 HTTP）</p>
          <details>
            <summary>查看最终 payload</summary>
            <pre data-testid="c04-payload">
              {JSON.stringify(toSubscriptionPayload(data), null, 2)}
            </pre>
          </details>
          {submitted && <pre data-testid="c04-submitted">{JSON.stringify(submitted, null, 2)}</pre>}
          {level === 'advanced' && (
            <p>
              名称 duplicate
              触发模拟409；带用户名/密码/片段的HTTPS地址可触发模拟422。草稿变更通知、取消、重置或卸载使旧500ms任务失效。生产端仍需独立校验和授权。
            </p>
          )}
        </>
      )}
      <p role="status" data-testid="c04-schema-errors">
        SDK Schema 错误数：{errors ?? '等待通知'}
      </p>
      <p data-testid="c04-notifications">
        已处理的 SDK onChange：{notifications} 次（包括初始化与校验通知，不是提交次数）
      </p>
    </section>
  )
}
