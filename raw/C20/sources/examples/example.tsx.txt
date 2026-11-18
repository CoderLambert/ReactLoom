import clsx from 'clsx'
import { clsx as lite } from 'clsx/lite'
import { useState } from 'react'
import { cardClassInputs } from './class-policy.mjs'
import { comparisonPresets } from './comparison-presets.mjs'
import './class-names.css'

type Tone = 'neutral' | 'success' | 'warning'

function formatArguments(inputs: unknown[]) {
  return inputs.map((input) => JSON.stringify(input, null, 2) ?? 'undefined').join(',\n')
}

export default function ClassNamesExample() {
  const [selected, setSelected] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [tone, setTone] = useState<Tone>('neutral')
  const [presetId, setPresetId] = useState('strings')
  const inputs = cardClassInputs({ selected, disabled, tone })
  const className = clsx(...inputs)
  const preset = comparisonPresets.find((item) => item.id === presetId) ?? comparisonPresets[0]
  const fullResult = clsx(...preset.inputs)
  const liteResult = lite(...preset.inputs)

  return (
    <section className="clsx-lab" aria-label="clsx 条件类名实验">
      <header>
        <h2>从组件状态到 className</h2>
        <p>切换卡片状态，查看传给 clsx 的参数与实际返回值；再用同一组参数比较完整版和 lite。</p>
      </header>

      <section className="clsx-lab__panel" aria-labelledby="clsx-card-title">
        <h3 id="clsx-card-title">1. 让状态决定卡片样式</h3>
        <fieldset className="clsx-lab__controls">
          <legend>卡片状态</legend>
          <label>
            <input
              type="checkbox"
              checked={selected}
              onChange={(event) => setSelected(event.target.checked)}
            />
            选中
          </label>
          <label>
            <input
              type="checkbox"
              checked={disabled}
              onChange={(event) => setDisabled(event.target.checked)}
            />
            禁用操作
          </label>
          <label>
            提示语气
            <select
              value={tone}
              onChange={(event) => {
                const value = event.target.value
                if (value === 'neutral' || value === 'success' || value === 'warning') {
                  setTone(value)
                }
              }}
            >
              <option value="neutral">普通</option>
              <option value="success">已归档</option>
              <option value="warning">待审核</option>
            </select>
          </label>
        </fieldset>

        <article className={className}>
          <span className="clsx-lab__eyebrow">
            {tone === 'success' ? '已归档' : tone === 'warning' ? '待审核' : '工程阅读'}
          </span>
          <h4>ReactLoom 每日工程精选</h4>
          <p>选中改变边框，语气改变背景，禁用改变外观并阻止收藏按钮操作。</p>
          <button
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => setSelected((value) => !value)}
          >
            {selected ? '取消收藏' : '收藏文章'}
          </button>
        </article>

        <div className="clsx-lab__io">
          <div>
            <h4>输入：clsx(...inputs)</h4>
            <pre data-testid="class-input">{formatArguments(inputs)}</pre>
          </div>
          <div>
            <h4>实际返回的 className</h4>
            <output data-testid="class-output">{JSON.stringify(className)}</output>
            <p className="clsx-lab__hint">
              上方卡片直接使用这个字符串。按钮能否操作由原生 disabled 属性控制，选中状态由
              aria-pressed 表达。
            </p>
          </div>
        </div>
      </section>

      <section className="clsx-lab__panel" aria-labelledby="clsx-comparison-title">
        <h3 id="clsx-comparison-title">2. 同一组参数，比较 full / lite</h3>
        <label className="clsx-lab__preset">
          输入预设
          <select value={preset.id} onChange={(event) => setPresetId(event.target.value)}>
            {comparisonPresets.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <p>{preset.explanation}</p>
        <h4>传给两个函数的同一组参数</h4>
        <pre data-testid="comparison-input">{formatArguments(preset.inputs)}</pre>
        <div className="clsx-lab__io">
          <div>
            <h4>clsx(...inputs)</h4>
            <output data-testid="full-output">{JSON.stringify(fullResult)}</output>
          </div>
          <div>
            <h4>lite(...inputs)</h4>
            <output data-testid="lite-output">{JSON.stringify(liteResult)}</output>
          </div>
        </div>
        <p className="clsx-lab__hint">
          引号用于显示空字符串，实际 className 不含引号。预设是本地数据，页面不会执行输入代码。
        </p>
      </section>
    </section>
  )
}
