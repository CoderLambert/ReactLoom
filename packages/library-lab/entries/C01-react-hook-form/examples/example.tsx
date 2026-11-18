import { useCallback, useEffect, useRef, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { canonicalFeedUrl, findDuplicateFeedIndex } from './feed-url-policy.mjs'
import './workshop.css'
import {
  canApplySubmitResult,
  fingerprintDraft,
  shouldBlockCompositionEnter,
} from './form-policy.mjs'

export type Source = { name: string; url: string }
export type SubscriptionDraft = { group: string; sources: Source[] }
type Props = { level: 'basic' | 'business' | 'advanced' }

const defaultDraft: SubscriptionDraft = {
  group: '技术',
  sources: [{ name: '前端工程', url: 'https://example.com/rss.xml' }],
}

function validateHttps(value: string): true | string {
  return canonicalFeedUrl(value) === null ? '请输入不包含用户名或密码的 HTTPS 完整地址' : true
}

function delayWithSignal(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('已取消', 'AbortError'))
      return
    }
    const done = () => {
      signal.removeEventListener('abort', abort)
      resolve()
    }
    const timer = window.setTimeout(done, ms)
    const abort = () => {
      window.clearTimeout(timer)
      signal.removeEventListener('abort', abort)
      reject(new DOMException('已取消', 'AbortError'))
    }
    signal.addEventListener('abort', abort, { once: true })
  })
}

export default function SubscriptionForm({ level }: Props) {
  const {
    control,
    register,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    getValues,
    formState: { errors, isSubmitting, isDirty, submitCount },
  } = useForm<SubscriptionDraft>({
    defaultValues: defaultDraft,
    mode: 'onBlur',
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'sources' })
  const [saved, setSaved] = useState<SubscriptionDraft | null>(null)
  const [feedback, setFeedback] = useState('尚未提交')
  const controller = useRef<AbortController | null>(null)
  const generation = useRef(0)
  const draft = useWatch({ control })
  const draftFingerprint = fingerprintDraft(draft)
  const previousDraft = useRef(draftFingerprint)
  const composing = useRef(false)
  const compositionEndedAt = useRef(Number.NEGATIVE_INFINITY)
  const invalidateSubmission = useCallback(() => {
    const active = controller.current
    if (!active) return
    generation.current++
    active.abort()
    controller.current = null
    setFeedback('草稿发生变化：旧提交已取消，请重新提交')
  }, [])

  // A changed form invalidates any pending response, not just explicit Reset.
  // useWatch observes dynamic append/remove as well as text edits.
  useEffect(() => {
    if (previousDraft.current === draftFingerprint) return
    previousDraft.current = draftFingerprint
    clearErrors('root.server')
    invalidateSubmission()
  }, [clearErrors, draftFingerprint, invalidateSubmission])

  const savedIsCurrent = saved !== null && fingerprintDraft(saved) === draftFingerprint

  useEffect(
    () => () => {
      generation.current++
      controller.current?.abort()
    },
    [],
  )

  const stop = () => {
    generation.current++
    controller.current?.abort()
    controller.current = null
    setFeedback('本地模拟请求已取消')
  }

  async function submit(value: SubscriptionDraft) {
    const expectedFingerprint = fingerprintDraft(value)
    const token = ++generation.current
    controller.current?.abort()
    const active = new AbortController()
    controller.current = active
    clearErrors('root.server')
    setFeedback('正在验证订阅草稿…')
    try {
      // 本地业务 fixture：模拟耗时与 409 映射，不访问外部 HTTP。
      if (level === 'advanced') await delayWithSignal(450, active.signal)
      if (
        !canApplySubmitResult({
          expectedFingerprint,
          currentFingerprint: fingerprintDraft(getValues()),
          expectedEpoch: token,
          currentEpoch: generation.current,
          aborted: active.signal.aborted,
        })
      )
        return
      // Host and default port are canonicalized; path/query remain case sensitive.
      const duplicateIndex = findDuplicateFeedIndex(value.sources)
      if (duplicateIndex !== -1) {
        setError(
          `sources.${duplicateIndex}.url`,
          { type: 'duplicate', message: '与本分组已有 RSS URL 重复' },
          { shouldFocus: true },
        )
        setError('root.server', { type: 'duplicate', message: '同一分组不能重复订阅相同 URL' })
        setFeedback('客户端检测到规范化 URL 重复')
        return
      }
      if (level === 'advanced') {
        const conflict = value.sources.findIndex((source) => source.url.includes('/duplicate'))
        if (conflict >= 0) {
          setError(
            `sources.${conflict}.url` as const,
            { type: 'server', message: '模拟服务端 409：该源已存在' },
            { shouldFocus: true },
          )
          setError('root.server', { type: 'server', message: '模拟服务端拒绝了重复订阅' })
          setFeedback('服务端 409 演示：字段错误已正确回填')
          return
        }
      }
      setSaved({ group: value.group, sources: value.sources.map((source) => ({ ...source })) })
      setFeedback('校验通过，已生成本地预览；没有真正写入服务端')
    } catch (error) {
      if (token === generation.current && !active.signal.aborted) {
        setError('root.server', { type: 'unknown', message: String(error) })
        setFeedback('本地模拟提交失败')
      }
    } finally {
      if (token === generation.current) controller.current = null
    }
  }

  const advanced = level === 'advanced'
  return (
    <section className="c01-workshop" aria-label="React Hook Form 实际 SDK 示例">
      <h2>
        {level === 'basic'
          ? 'RSS 订阅表单'
          : advanced
            ? '字段级错误、取消与竞态'
            : '动态 RSS 来源列表'}
      </h2>
      <p>RHF 管理真实输入与字段数组；提交端是明确标注的本地业务 fixture，不需要 API 密钥。</p>
      <p>
        {level === 'basic'
          ? '先清空分组或输入非 HTTPS 地址并移开焦点，观察字段错误；修正后提交得到同一份嵌套数据。'
          : advanced
            ? '提交后有 450ms 本地等待。尝试冲突地址、修改草稿和取消，观察哪一次结果可以回填。'
            : '新增两行、修改内容再删除第一行，对照剩余行身份和草稿；重复 URL 会落到具体字段。'}
      </p>
      <form
        noValidate
        onChangeCapture={invalidateSubmission}
        onCompositionStartCapture={() => {
          composing.current = true
        }}
        onCompositionEndCapture={() => {
          composing.current = false
          compositionEndedAt.current = performance.now()
        }}
        onKeyDownCapture={(event) => {
          if (
            shouldBlockCompositionEnter({
              key: event.key,
              composing: composing.current,
              isComposing: event.nativeEvent.isComposing,
              keyCode: event.nativeEvent.keyCode,
              sinceCompositionEndMs: performance.now() - compositionEndedAt.current,
            })
          )
            event.preventDefault()
        }}
        onSubmit={(event) => {
          if (composing.current) {
            event.preventDefault()
            return
          }
          void handleSubmit(submit, () => setFeedback('请按字段提示修正后再次提交'))(event)
        }}
      >
        <div className="demo-controls">
          <label>
            分组名称{' '}
            <input
              aria-label="分组名称"
              aria-invalid={!!errors.group}
              aria-describedby={errors.group ? 'rhf-group-error' : undefined}
              {...register('group', {
                required: '请输入分组名',
                minLength: { value: 2, message: '最少两个字符' },
              })}
            />
          </label>
          <div className="c01-error-slot c01-group-error-slot">
            {errors.group && (
              <small id="rhf-group-error" role="alert">
                {errors.group.message}
              </small>
            )}
          </div>
        </div>
        {fields.map((field, index) => (
          <fieldset
            key={field.id}
            data-testid="c01-source-row"
            data-field-id={field.id}
            style={{ border: '1px solid #c7d7c9', margin: '12px 0', padding: 14 }}
          >
            <legend>来源 {index + 1}</legend>
            <div className="demo-controls">
              <label>
                标题{' '}
                <input
                  aria-label={`来源 ${index + 1} 标题`}
                  aria-invalid={!!errors.sources?.[index]?.name}
                  aria-describedby={
                    errors.sources?.[index]?.name ? `rhf-${field.id}-name-error` : undefined
                  }
                  {...register(`sources.${index}.name` as const, {
                    required: '请输入标题',
                    minLength: { value: 2, message: '至少两个字符' },
                  })}
                />
              </label>
              <label>
                RSS URL{' '}
                <input
                  aria-label={`来源 ${index + 1} URL`}
                  type="url"
                  aria-invalid={!!errors.sources?.[index]?.url}
                  aria-describedby={
                    errors.sources?.[index]?.url ? `rhf-${field.id}-url-error` : undefined
                  }
                  {...register(`sources.${index}.url` as const, {
                    required: '请输入 URL',
                    validate: validateHttps,
                  })}
                />
              </label>
              {level !== 'basic' && (
                <button
                  type="button"
                  disabled={fields.length <= 1}
                  onClick={() => {
                    invalidateSubmission()
                    remove(index)
                  }}
                >
                  移除该源
                </button>
              )}
            </div>
            <div className="c01-error-slot">
              {errors.sources?.[index]?.name && (
                <p id={`rhf-${field.id}-name-error`} role="alert">
                  {errors.sources[index]?.name?.message}
                </p>
              )}
            </div>
            <div className="c01-error-slot">
              {errors.sources?.[index]?.url && (
                <p id={`rhf-${field.id}-url-error`} role="alert">
                  {errors.sources[index]?.url?.message}
                </p>
              )}
            </div>
          </fieldset>
        ))}
        {level !== 'basic' && (
          <button
            type="button"
            onClick={() => {
              invalidateSubmission()
              append({ name: '新来源', url: 'https://example.com/feed' })
            }}
          >
            新增 RSS 来源
          </button>
        )}
        <div className="demo-controls">
          <button type="submit" disabled={isSubmitting}>
            验证并预览
          </button>
          {advanced && (
            <button type="button" onClick={stop}>
              取消本地提交
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              stop()
              reset()
              setSaved(null)
              setFeedback('已恢复初始草稿')
            }}
          >
            重置表单
          </button>
        </div>
      </form>
      <p role="status">
        {feedback} · {isDirty ? '存在未保存修改' : '输入处于默认状态'}
      </p>
      <dl className="c01-state" data-testid="c01-form-state">
        <div>
          <dt>草稿状态</dt>
          <dd>{isDirty ? '已修改' : '默认值'}</dd>
        </div>
        <div>
          <dt>提交状态</dt>
          <dd>{isSubmitting ? '处理中' : '空闲'}</dd>
        </div>
        <div>
          <dt>提交次数</dt>
          <dd>{submitCount}</dd>
        </div>
      </dl>
      <details className="c01-inspector">
        <summary>查看草稿与动态行身份</summary>
        <p>下标用于字段路径，field.id 用于 React 行身份；删除前一行不会把剩余行当成新输入。</p>
        <ul data-testid="c01-row-identities">
          {fields.map((field, index) => (
            <li key={field.id}>
              sources.{index} · field.id={field.id}
            </li>
          ))}
        </ul>
        <pre data-testid="c01-draft-json">{JSON.stringify(draft, null, 2)}</pre>
      </details>
      {errors.root?.server && <p role="alert">{errors.root.server.message}</p>}
      {advanced && (
        <p>
          将任意 URL 改为 <code>https://example.com/duplicate</code>，可模拟服务端
          409；取消后不应回写旧结果。
        </p>
      )}
      {savedIsCurrent && (
        <>
          <h3>通过校验的本地数据</h3>
          <output className="demo-output">{JSON.stringify(saved, null, 2)}</output>
        </>
      )}
    </section>
  )
}
