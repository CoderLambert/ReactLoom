import {useEffect, useId, useRef, useState} from 'react'
import axe from 'axe-core'

type Level = 'basic' | 'business' | 'advanced'
type Props = {level: Level}
type Finding = {id: string; impact: string | null | undefined; description: string; targets: string[]}
const TRANSPARENT_GIF = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='

export default function AxeAuditExample({level}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inputId = useId()
  const generation = useRef(0)
  const [repaired, setRepaired] = useState(false)
  const [busy, setBusy] = useState(false)
  const [findings, setFindings] = useState<Finding[] | null>(null)
  const [uncertain, setUncertain] = useState(0)
  const [notice, setNotice] = useState('按需执行真实 axe.run()；不会扫描其他页面')

  useEffect(() => () => {generation.current++}, [])

  async function audit() {
    const container = ref.current
    if (!container || busy) return
    const token = ++generation.current
    setBusy(true)
    setFindings(null)
    setNotice('正在分析当前示例DOM…')
    try {
      const report = await axe.run(container, {
        runOnly: {type: 'rule', values: ['image-alt', 'label', 'button-name']},
      })
      if (token !== generation.current) return
      setFindings(report.violations.map(item => ({
        id: item.id, impact: item.impact, description: item.description,
        targets: item.nodes.map(node => node.target.join(' > ')),
      })))
      setUncertain(report.incomplete.length)
      setNotice(`真实 axe-core 检查结束：${report.violations.length} 条规则有违反记录；${report.incomplete.length} 条结果需人工判定`)
    } catch (error) {
      if (token === generation.current) setNotice(`当前环境无法完成审计：${String(error)}`)
    } finally {
      if (token === generation.current) setBusy(false)
    }
  }

  function toggleRepair() {
    if (busy) return
    generation.current++
    setRepaired(v => !v)
    setFindings(null)
    setNotice('DOM已改变，请重新运行检查。通过这3条规则不等于全部WCAG合规')
  }

  return <section aria-label="axe-core 真实可访问性规则演示">
    <h2>{level === 'basic' ? '图片缺少替代文本' : level === 'business' ? '表单标签的真实可访问名称' : '多种缺陷与局部审计边界'}</h2>
    <p>将同一段DOM从故意缺陷切换到修复版，使用真正的 axe-core 分析当前容器。**只运行3条规则**，不冒充全面WCAG验收。</p>
    <div ref={ref} style={{border:'1px solid #d3dfd2',padding:20,borderRadius:9,marginBlock:18}}>
      <h3>被审计的局部组件</h3>
      {level !== 'business' && <img src={TRANSPARENT_GIF} width="140" height="65"
        style={{background:'#e3e7df',borderRadius:6}}
        {...(repaired ? {alt:'示例内容封面'} : {})} />}
      {level !== 'basic' && <div style={{marginBlock:12}}>
        {repaired && <label htmlFor={inputId}>RSS 订阅地址</label>}
        {!repaired && <span>RSS 订阅地址（故意没有程序关联）</span>}
        <input id={inputId} type="text" placeholder="https://example.org/feed.xml" style={{display:'block'}} />
      </div>}
      {level === 'advanced' && <button type="button" aria-label={repaired ? '添加当前RSS频道' : undefined}
        style={{width:44,height:36,border:'1px solid #cdd5ca',borderRadius:5}}>
        {repaired ? '添加' : null}
      </button>}
    </div>
    <div className="demo-controls">
      <label><input type="checkbox" checked={repaired} disabled={busy} onChange={toggleRepair} />使用修复版DOM</label>
      <button type="button" onClick={()=>void audit()} disabled={busy}>{busy ? '扫描中…' : '运行 axe-core 审计'}</button>
    </div>
    <p role="status">{notice}</p>
    {findings !== null && <>
      <p><strong>违反规则：</strong><output data-testid="axe-violation-count">{findings.length}</output>；人工复核项 {uncertain}</p>
      {findings.length === 0 && <p>仅当前所选 3 条规则未发现问题；其他WCAG规则和交互测试仍需进行。</p>}
      <ul>{findings.map(finding => <li key={finding.id}>
        <strong>{finding.id}</strong> · {finding.impact ?? '未定级'}：{finding.description}
        <ul>{finding.targets.map(target => <li key={target}><code>{target}</code></li>)}</ul>
      </li>)}</ul>
    </>}
    {level === 'advanced' && <p>axe报告只覆盖静态可计算规则；键盘顺序、对比度的人工边界、屏幕阅读器语义、动态焦点和真实任务完成率还要单独测试。</p>}
  </section>
}
