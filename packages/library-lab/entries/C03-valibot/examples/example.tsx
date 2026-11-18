import { useEffect, useId, useState } from 'react'
import * as v from 'valibot'
import { BatchSchema, FeedSchema, WindowSchema } from './schemas'
import './styles.css'

type Level = 'basic' | 'business' | 'advanced'
type ReadableIssue = { path: string; message: string }
type View = {
  status: 'idle' | 'dirty' | 'json' | 'success' | 'schema'
  text: string
  issues: ReadableIssue[]
}
const feed = { name: '  前端工程  ', url: 'https://example.com/Feed?q=A#section', category: 'tech' }
const json = (value: unknown) => JSON.stringify(value, null, 2)
const samples = {
  basic: json({ ...feed, extra: '未知字段会被object移除' }),
  business: json({
    owner: '  新闻项目  ',
    feeds: [feed, { name: '商业新闻', url: 'https://example.org/rss', category: 'business' }],
  }),
  advanced: json({ start: '2026-11-05', end: '2026-11-02' }),
}
const presets: Record<Level, { label: string; payload: string }[]> = {
  basic: [
    {
      label: '载入字段错误',
      payload: json({ name: ' a ', url: 'https://user:pass@example.com/rss', category: 'news' }),
    },
  ],
  business: [
    {
      label: '载入批量错误',
      payload: json({
        owner: ' ',
        feeds: [feed, { name: '另一频道', url: 'http://example.org/rss', category: 'business' }],
      }),
    },
    {
      label: '载入超量批次',
      payload: json({
        owner: '新闻项目',
        feeds: Array.from({ length: 4 }, (_, index) => ({ ...feed, name: `频道${index + 1}` })),
      }),
    },
  ],
  advanced: [
    { label: '载入非法结束日', payload: json({ start: '2026-02-28', end: '2026-02-30' }) },
    { label: '载入联合错误', payload: json({ start: '2026-11-05', end: '2026-11-02', note: 42 }) },
    {
      label: '载入合法区间',
      payload: json({ start: '2024-02-29', end: '2024-03-01', note: '闰日发布' }),
    },
  ],
}
const emptyView = (text: string, status: View['status'] = 'idle'): View => ({
  status,
  text,
  issues: [],
})
export default function ValibotExample({ level }: { level: Level }) {
  const inputId = useId()
  const [payload, setPayload] = useState(samples[level])
  const [view, setView] = useState<View>(() => emptyView('点击验证以执行真实 Valibot safeParse'))
  const schema = level === 'basic' ? FeedSchema : level === 'business' ? BatchSchema : WindowSchema
  useEffect(() => {
    setPayload(samples[level])
    setView(emptyView('场景已切换，需要重新验证'))
  }, [level])
  function load(value: string) {
    setPayload(value)
    setView(emptyView('已载入示例，需要点击验证'))
  }
  function validate() {
    let input: unknown
    try {
      input = JSON.parse(payload)
    } catch {
      setView(emptyView('FAIL: 输入不是有效 JSON，尚未运行 safeParse', 'json'))
      return
    }
    const outcome = v.safeParse(schema, input, { abortEarly: false })
    if (outcome.success)
      setView({
        status: 'success',
        text: `PASS: ${JSON.stringify(outcome.output, null, 2)}`,
        issues: [],
      })
    else
      setView({
        status: 'schema',
        text: `FAIL: ${outcome.issues.length} 项校验问题`,
        issues: outcome.issues.map((issue) => ({
          path: v.getDotPath(issue) ?? '(根对象)',
          message: issue.message,
        })),
      })
  }
  return (
    <section
      aria-label="Valibot真实SDK实验"
      className="c03-workshop"
      data-testid="c03-workshop"
      data-level={level}
    >
      <h2>
        {level === 'basic'
          ? '输入、输出与字段错误'
          : level === 'business'
            ? '批量导入与嵌套路径'
            : '真实日期与跨字段错误'}
      </h2>
      <p>真实Valibot1.4.2同步校验；数据为本地RSS配置，不抓取URL、不提交网络，也不持久记录输入。</p>
      <label htmlFor={inputId}>输入 JSON</label>
      <textarea
        id={inputId}
        spellCheck={false}
        value={payload}
        onChange={(event) => {
          setPayload(event.target.value)
          setView(emptyView('输入已改变，需要重新验证', 'dirty'))
        }}
      />
      <div className="c03-controls">
        <button type="button" onClick={validate}>
          运行 safeParse
        </button>
        <button type="button" onClick={() => load(samples[level])}>
          恢复示例
        </button>
        {presets[level].map((preset) => (
          <button type="button" key={preset.label} onClick={() => load(preset.payload)}>
            {preset.label}
          </button>
        ))}
      </div>
      <div data-testid="c03-result" data-status={view.status}>
        <output data-testid="valibot-output" aria-live="polite">
          {view.text}
        </output>
        {view.issues.length > 0 && (
          <table data-testid="c03-issues" aria-label="实际校验问题">
            <thead>
              <tr>
                <th scope="col">字段路径</th>
                <th scope="col">校验消息</th>
              </tr>
            </thead>
            <tbody>
              {view.issues.map((issue) => (
                <tr key={`${issue.path}:${issue.message}`}>
                  <th scope="row">{issue.path}</th>
                  <td>{issue.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p>
        编辑输入只清旧结果，不自动解析或改写草稿。路径从真实issue提取，仅显示字段和消息，不输出含原始input的issue整包。
      </p>
    </section>
  )
}
