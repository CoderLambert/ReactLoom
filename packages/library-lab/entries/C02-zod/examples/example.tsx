import { useEffect, useId, useState } from 'react'
import { BatchPolicySchema, FeedSchema, ImportEventSchema } from './schemas'

export type { BatchInput, BatchOutput, Feed } from './schemas'
export { BatchPolicySchema, FeedSchema, ImportEventSchema } from './schemas'

type Props = { level: 'basic' | 'business' | 'advanced' }

const validExamples = {
  basic: { title: '  前端实战  ', url: 'https://example.com/rss.xml' },
  business: { kind: 'opml', filename: 'feeds.opml', groups: ['技术', '开源'] },
  advanced: {
    ttlMinutes: '15',
    sources: [{ title: '开发资讯', url: 'https://example.com/feed' }],
  },
}
const invalidExamples = {
  basic: { title: 'a', url: 'javascript:alert(1)', admin: true },
  business: { kind: 'opml', filename: 'feeds.txt', groups: [] },
  advanced: {
    ttlMinutes: '',
    sources: [
      { title: '同一个源', url: 'https://example.com/feed' },
      { title: '仍是此源', url: 'https://example.com/feed' },
    ],
  },
}

export default function ZodBoundaryExample({ level }: Props) {
  const inputId = useId()
  const errorId = useId()
  const [raw, setRaw] = useState(() => JSON.stringify(validExamples[level], null, 2))
  const [errors, setErrors] = useState<string[]>([])
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState('等待解析输入')
  useEffect(() => {
    setRaw(JSON.stringify(validExamples[level], null, 2))
    setErrors([])
    setOutput('')
    setStatus('已切换场景，等待验证')
  }, [level])

  function validate() {
    let input: unknown
    try {
      input = JSON.parse(raw)
    } catch (error) {
      setErrors(['JSON 语法错误：' + String(error)])
      setOutput('')
      setStatus('JSON 解析失败')
      return
    }
    const schema =
      level === 'basic' ? FeedSchema : level === 'business' ? ImportEventSchema : BatchPolicySchema
    const result = schema.safeParse(input)
    if (!result.success) {
      setErrors(
        result.error.issues.map((issue) => {
          const field = issue.path.length ? issue.path.join('.') : '(根对象)'
          return field + '：' + issue.message
        }),
      )
      setOutput('')
      setStatus('运行时数据校验失败')
      return
    }
    setErrors([])
    setOutput(JSON.stringify(result.data, null, 2))
    setStatus('已验证并生成经过规范化的输出数据')
  }

  return (
    <section aria-label="Zod 实际运行示例" data-testid="c02-workshop" data-level={level}>
      <h2>
        {level === 'basic'
          ? 'unknown → 安全的 RSS DTO'
          : level === 'business'
            ? 'RSS / OPML 判别联合输入'
            : '跨字段规则与输入输出类型'}
      </h2>
      <p>仅使用真实 Zod schema.safeParse，不进行网络调用、不把 TypeScript 断言当验证。</p>
      <label htmlFor={inputId}>待校验 JSON</label>
      <textarea
        id={inputId}
        aria-label="待校验 JSON"
        style={{
          display: 'block',
          boxSizing: 'border-box',
          width: '100%',
          minHeight: 220,
          fontFamily: 'monospace',
          marginTop: 8,
        }}
        aria-invalid={errors.length > 0}
        aria-describedby={errors.length ? errorId : undefined}
        spellCheck={false}
        value={raw}
        onChange={(event) => {
          setRaw(event.target.value)
          setErrors([])
          setOutput('')
          setStatus('内容已修改，需要重新校验')
        }}
      />
      <div className="demo-controls">
        <button type="button" onClick={validate}>
          运行 safeParse
        </button>
        <button
          type="button"
          onClick={() => {
            setRaw(JSON.stringify(invalidExamples[level], null, 2))
            setOutput('')
            setErrors([])
            setStatus('已加载反例，请重新校验')
          }}
        >
          加载失败样例
        </button>
        <button
          type="button"
          onClick={() => {
            setRaw(JSON.stringify(validExamples[level], null, 2))
            setOutput('')
            setErrors([])
            setStatus('已恢复有效样例')
          }}
        >
          重置
        </button>
        {level === 'advanced' && (
          <button
            type="button"
            onClick={() => {
              setRaw(
                JSON.stringify(
                  {
                    ttlMinutes: '15',
                    sources: [
                      { title: '甲源', url: 'https://EXAMPLE.COM:443/Feed?q=A#one' },
                      { title: '乙源', url: 'https://example.com/Feed?q=A#two' },
                    ],
                  },
                  null,
                  2,
                ),
              )
              setOutput('')
              setErrors([])
              setStatus('已加载规范化身份重复样例，请验证')
            }}
          >
            加载重复来源
          </button>
        )}
      </div>
      <p role="status" data-testid="c02-status">
        {status}
      </p>
      {!!errors.length && (
        <div role="alert" id={errorId} data-testid="c02-issues">
          <h3>结构化校验错误</h3>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      {output && (
        <>
          <h3>真实 parsed.data（不是原始输入）</h3>
          <output className="demo-output" data-testid="c02-output">
            {output}
          </output>
        </>
      )}
      {level === 'advanced' && (
        <p>
          将 TTL 改成空字符串，或把两个 URL 改成相同地址。空值不可偷偷转换成
          0；重复错误须显示精确字段路径。
        </p>
      )}
    </section>
  )
}
