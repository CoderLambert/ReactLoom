import { useEffect, useId, useState } from 'react'
import { validateFeedBoundaries } from './rss-policy.mjs'
import { createValidators } from './schemas'
import './styles.css'

export { batchSchema, feedSchema, windowSchema } from './schemas'

type Level = 'basic' | 'business' | 'advanced'
type Stage = 'idle' | 'dirty' | 'json' | 'schema' | 'domain' | 'success'
const validators = createValidators()
const validSamples = {
  basic: { id: 'frontend', title: '前端工程', url: 'https://example.org/rss' },
  business: {
    team: 'news',
    feeds: [
      { id: 'official', title: '官方动态', url: 'https://example.org/releases' },
      { id: 'dev', title: '开发实战', url: 'https://example.net/feed' },
    ],
  },
  advanced: { enabled: true, maxConcurrent: 3 },
}
const invalidSamples = {
  basic: { id: 'BAD ID', title: 'a', url: 'http://example.org/rss', extra: true },
  business: { team: '', feeds: [] },
  advanced: { enabled: true, maxConcurrent: 0, unreviewed: true },
}
const domainSamples = {
  basic: { id: 'frontend', title: '前端工程', url: 'https://reader:secret@example.org/rss' },
  business: {
    team: 'news',
    feeds: [
      { id: 'one', title: '一号订阅', url: 'https://EXAMPLE.COM:443/Feed?q=A' },
      { id: 'two', title: '二号订阅', url: 'https://example.com/Feed?q=A#section' },
    ],
  },
}
const initial = (level: Level) =>
  level === 'advanced' ? invalidSamples.advanced : validSamples[level]

export default function AjvExample({ level }: { level: Level }) {
  const inputId = useId()
  const errorsId = useId()
  const [input, setInput] = useState(() => JSON.stringify(initial(level), null, 2))
  const [stage, setStage] = useState<Stage>('idle')
  const [message, setMessage] = useState('等待明确校验当前输入')
  const [errors, setErrors] = useState<{ key: string; text: string }[]>([])
  const [output, setOutput] = useState('')
  useEffect(() => {
    setInput(JSON.stringify(initial(level), null, 2))
    setStage('idle')
    setMessage('已切换场景，请重新校验')
    setErrors([])
    setOutput('')
  }, [level])
  function replace(value: unknown, notice: string) {
    setInput(JSON.stringify(value, null, 2))
    setStage('idle')
    setMessage(notice)
    setErrors([])
    setOutput('')
  }
  function run() {
    let value: unknown
    setOutput('')
    try {
      value = JSON.parse(input)
    } catch (error) {
      setStage('json')
      setMessage('JSON 语法解析失败，尚未调用 Ajv')
      setErrors([{ key: 'json', text: String(error) }])
      return
    }
    const validate = validators[level]
    if (!validate(value)) {
      // Ajv replaces validator.errors on the next invocation; store display values now.
      setErrors(
        (validate.errors ?? []).map((issue) => {
          const detail =
            issue.keyword === 'required'
              ? issue.params.missingProperty
              : issue.keyword === 'additionalProperties'
                ? issue.params.additionalProperty
                : ''
          return {
            key: `${issue.instancePath}|${issue.schemaPath}|${issue.keyword}|${JSON.stringify(issue.params)}`,
            text: `${issue.instancePath || '/'} · ${issue.keyword} · ${issue.message ?? '不符合 Schema'}${detail ? ` (${detail})` : ''}`,
          }
        }),
      )
      setStage('schema')
      setMessage('JSON Schema 不通过；未执行业务规则')
      return
    }
    const issues = validateFeedBoundaries(level, value)
    if (issues.length) {
      setErrors(
        issues.map((issue) => ({ key: issue.path, text: `${issue.path} · ${issue.message}` })),
      )
      setStage('domain')
      setMessage('JSON Schema 已通过，RSS 业务规则不通过')
      return
    }
    setErrors([])
    setStage('success')
    setMessage('校验通过；输入数据未经隐式修改')
    setOutput(JSON.stringify(value, null, 2))
  }
  return (
    <section
      className="c05-workshop"
      aria-label="Ajv 真实 JSON Schema 验证"
      data-testid="c05-workshop"
      data-level={level}
      data-stage={stage}
    >
      <h2>
        {level === 'basic'
          ? '结构与业务边界'
          : level === 'business'
            ? '整对象唯一与订阅身份'
            : '条件必填与错误聚合'}
      </h2>
      <p>
        真实 Ajv 8.20.0 编译可信静态 Schema；本地 JSON fixture，不抓取订阅或编译用户提供的 Schema。
      </p>
      <label htmlFor={inputId}>输入 JSON</label>
      <textarea
        id={inputId}
        value={input}
        spellCheck={false}
        aria-invalid={errors.length > 0}
        aria-describedby={errors.length ? errorsId : undefined}
        onChange={(event) => {
          setInput(event.target.value)
          setStage('dirty')
          setMessage('输入已修改，旧结果已失效')
          setErrors([])
          setOutput('')
        }}
      />
      <div className="c05-controls">
        <button type="button" onClick={run}>
          调用 Ajv.validate
        </button>
        <button
          type="button"
          onClick={() => replace(invalidSamples[level], '已载入字段反例，请校验')}
        >
          载入字段反例
        </button>
        <button
          type="button"
          onClick={() => replace(validSamples[level], '已载入合法输入，请校验')}
        >
          载入合法输入
        </button>
        {level !== 'advanced' && (
          <button
            type="button"
            onClick={() => replace(domainSamples[level], '已载入分层反例，请校验')}
          >
            载入结构通过但业务失败
          </button>
        )}
        <button type="button" onClick={() => replace(initial(level), '已恢复初始示例')}>
          恢复样例
        </button>
      </div>
      <p role="status" data-testid="c05-status">
        {message}
      </p>
      {errors.length > 0 && (
        <ul id={errorsId} role="alert" data-testid="c05-errors">
          {errors.map((error) => (
            <li key={error.key}>{error.text}</li>
          ))}
        </ul>
      )}
      {output && (
        <output className="c05-output" data-testid="ajv-result">
          {output}
        </output>
      )}
      <p>
        Schema 不自动 trim、补默认值、转数字或删除字段。第二阶段的
        HTTPS/凭据/身份去重是本例策略，不检查 DNS、重定向或网络权限。
      </p>
    </section>
  )
}
