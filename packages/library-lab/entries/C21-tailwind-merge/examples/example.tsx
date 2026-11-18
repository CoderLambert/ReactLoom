import { useState } from 'react'
import {
  calculateMerge,
  DEFAULT_BASE,
  DEFAULT_CALLER,
  PRESETS,
  paddingConflicts,
} from './merge-model.mjs'
import './styles.css'

export { cn } from './merge-model.mjs'

export default function TailwindMergeExample() {
  const [presetId, setPresetId] = useState('component')
  const [base, setBase] = useState(DEFAULT_BASE)
  const [caller, setCaller] = useState(DEFAULT_CALLER)
  const [selected, setSelected] = useState(false)
  const [size, setSize] = useState<'compact' | 'comfortable'>('compact')
  const [custom, setCustom] = useState(false)
  const result = calculateMerge({ base, caller, selected, size, custom })

  function preset(id: string) {
    const next = PRESETS.find((item) => item.id === id)
    if (!next) return
    setPresetId(id)
    setBase(next.base)
    setCaller(next.caller)
    setSelected(false)
    setSize('compact')
    setCustom(false)
  }

  return (
    <section
      className="c21-workshop"
      data-testid="c21-workshop"
      aria-label="tailwind-merge 完整合并实验"
    >
      <h2>从组件默认值到调用者覆盖</h2>
      <p>
        先用 clsx 组合条件，再用真实 tailwind-merge 3.7.0。输出直接作为下面预览的
        className，不手写合并结果。
      </p>
      <div className="c21-controls">
        <label>
          实验预设{' '}
          <select
            aria-label="实验预设"
            value={presetId}
            onChange={(event) => preset(event.currentTarget.value)}
          >
            {PRESETS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => preset('component')}>
          重置合并实验
        </button>
      </div>
      <div className="c21-fields">
        <label>
          组件基础类{' '}
          <input
            aria-label="组件基础类"
            maxLength={500}
            value={base}
            onChange={(event) => setBase(event.currentTarget.value)}
          />
        </label>
        <label>
          调用者 className{' '}
          <input
            aria-label="调用者 className"
            maxLength={500}
            value={caller}
            onChange={(event) => setCaller(event.currentTarget.value)}
          />
        </label>
      </div>
      <div className="c21-controls">
        <label>
          <input
            type="checkbox"
            checked={selected}
            onChange={(event) => setSelected(event.currentTarget.checked)}
          />
          选中变体
        </label>
        <label>
          卡片尺寸{' '}
          <select
            aria-label="卡片尺寸"
            value={size}
            onChange={(event) => {
              const value = event.currentTarget.value
              if (value === 'compact' || value === 'comfortable') setSize(value)
            }}
          >
            <option value="compact">紧凑</option>
            <option value="comfortable">舒适</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={custom}
            onChange={(event) => setCustom(event.currentTarget.checked)}
          />
          启用自定义 px 规则
        </label>
      </div>
      <dl className="c21-results">
        <dt>条件变体类（clsx）</dt>
        <dd>
          <code data-testid="c21-variants">{result.inputs.variants || '（空）'}</code>
        </dd>
        <dt>只是连接（twJoin）</dt>
        <dd>
          <output data-testid="tw-joined">{result.joined || '（空）'}</output>
        </dd>
        <dt>默认分组（twMerge）</dt>
        <dd>
          <output data-testid="c21-default">{result.defaultMerged || '（空）'}</output>
        </dd>
        <dt>当前规则的最终结果</dt>
        <dd>
          <output data-testid="tw-merged">{result.merged || '（空）'}</output>
        </dd>
      </dl>
      <p role="status" data-testid="c21-status">
        实时同步计算 · {custom ? '扩展 px 分组' : '默认配置'} · 调用者类最后参与合并
      </p>
      <details>
        <summary>查看 SDK 默认方向冲突组</summary>
        <p>
          这是 getDefaultConfig 的真实配置摘录，不是自由输入 token 的内部诊断接口。pr
          不会反向删除整个 px。
        </p>
        <pre data-testid="c21-conflicts">{JSON.stringify(paddingConflicts, null, 2)}</pre>
      </details>
      <div className="c21-preview-boundary">
        <article data-testid="c21-preview" className={result.merged}>
          <h3>前端工程实践精选</h3>
          <p>实际 DOM 使用上方最终字符串。观察左右 padding、背景和 hover/断点变化。</p>
          <button
            type="button"
            aria-pressed={selected}
            onClick={() => setSelected((value) => !value)}
          >
            {selected ? '取消选择文章' : '选择文章'}
          </button>
        </article>
      </div>
      <p>
        预设中的 Tailwind token 由现有 Tailwind 4.3.3 构建生成；运行时随意输入的新类不保证有
        CSS。自定义 c21-pad-* 的 CSS 随本例提供，配置开关只改变识别规则。
      </p>
      <p>
        预览区域有布局/绘制限制；这些输入面向开发者本地实验，不是终端用户主题接口。twMerge 不读取
        CSS、不编译样式，也不做安全净化。
      </p>
    </section>
  )
}
