import { useId, useState } from 'react'
import { IMaskInput } from 'react-imask'
import { validCalendarDay } from './calendar-policy.mjs'
import './styles.css'

type Level = 'basic' | 'business' | 'advanced'
type MaskSource = {
  value: string
  unmaskedValue: string
  typedValue: unknown
  masked: { readonly isComplete: boolean }
}
type Snapshot = {
  value: string
  unmaskedValue: string
  typedValue: unknown
  isComplete: boolean
}
const readMask = (mask: MaskSource): Snapshot => ({
  value: mask.value,
  unmaskedValue: mask.unmaskedValue,
  typedValue: mask.typedValue,
  isComplete: mask.masked.isComplete,
})

export default function MaskedInputs({ level }: { level: Level }) {
  return <MaskSession key={level} level={level} />
}

function MaskSession({ level }: { level: Level }) {
  const inputId = useId()
  const helpId = useId()
  const dateId = useId()
  const [raw, setRaw] = useState('')
  const [accepts, setAccepts] = useState(0)
  const [completes, setCompletes] = useState(0)
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [generation, setGeneration] = useState(0)
  const [note, setNote] = useState('')
  const [composing, setComposing] = useState(false)
  const advanced = level === 'advanced'
  const label = level === 'basic' ? '编号' : level === 'business' ? '金额' : '事件日期'
  const dateInvalid = advanced && raw.length === 10 && !validCalendarDay(raw)

  function accept(value: unknown, mask: MaskSource) {
    setRaw(String(value ?? ''))
    setSnapshot(readMask(mask))
    setAccepts((count) => count + 1)
  }
  function complete(_value: unknown, mask: MaskSource) {
    setSnapshot(readMask(mask))
    setCompletes((count) => count + 1)
  }
  function reset() {
    setRaw('')
    setAccepts(0)
    setCompletes(0)
    setSnapshot(null)
    setNote('')
    setComposing(false)
    setGeneration((value) => value + 1)
  }

  return (
    <section
      aria-label="IMask真实SDK示例"
      className="c06-workshop"
      data-testid="c06-workshop"
      data-level={level}
      data-generation={generation}
    >
      <h2>
        {level === 'basic'
          ? '八位编号：显示值与业务值'
          : level === 'business'
            ? '金额：格式与实际数值边界'
            : '日期：填满、真实公历与中文备注'}
      </h2>
      <p>
        真实react-imask7.6.1管理输入DOM与光标；React仅观察onAccept，不把业务快照反写input.value。
      </p>
      <div className="c06-controls">
        <label htmlFor={inputId}>{label}</label>
        {level === 'basic' && (
          <IMaskInput
            key={generation}
            id={inputId}
            type="text"
            inputMode="numeric"
            mask="0000-0000"
            unmask={true}
            placeholder="1234-5678"
            aria-label="编号"
            aria-describedby={helpId}
            onAccept={accept}
            onComplete={complete}
          />
        )}
        {level === 'business' && (
          <IMaskInput
            key={generation}
            id={inputId}
            type="text"
            inputMode="decimal"
            mask={Number}
            radix="."
            scale={2}
            thousandsSeparator=","
            unmask={true}
            placeholder="1234.50"
            aria-label="金额"
            aria-describedby={helpId}
            onAccept={accept}
            onComplete={complete}
          />
        )}
        {advanced && (
          <IMaskInput
            key={generation}
            id={inputId}
            type="text"
            inputMode="numeric"
            mask="0000-00-00"
            unmask={false}
            placeholder="2026-02-30"
            aria-label="事件日期"
            aria-invalid={dateInvalid}
            aria-describedby={`${helpId} ${dateId}`}
            onAccept={accept}
            onComplete={complete}
          />
        )}
        <button type="button" onClick={reset}>
          重置当前控件
        </button>
      </div>
      <p id={helpId}>
        {level === 'basic'
          ? '输入12345678：视图1234-5678，业务值12345678。试试中间删除/插入，普通按键不会重挂控件。'
          : level === 'business'
            ? '输入1234.50再离开：视图可带逗号，业务字符串不带逗号；默认不补固定两位小数。'
            : '输入2026-02-30与2024-02-29对照：Pattern填满不代表公历存在；不完整时允许继续输入。'}
      </p>
      <p role="status" data-testid="c06-events">
        onAccept 已触发 {accepts} 次；onComplete {completes} 次；当前值：
        <output data-testid="imask-value">{raw || '（空）'}</output>
      </p>
      <h3>真实maskRef的末次事件快照</h3>
      <pre data-testid="c06-snapshot">{JSON.stringify(snapshot, null, 2)}</pre>
      <p>
        value/unmaskedValue/typedValue/isComplete直接读取回调给出的SDK实例；null表示尚无事件。
        它们是事件快照，计数不是按键次数或SDK实例数量。
      </p>
      {advanced && (
        <>
          <p id={dateId} role="status" data-testid="c06-date">
            日期语义：
            {!raw
              ? '尚未填写'
              : raw.length < 10
                ? '尚未填满，允许继续输入'
                : validCalendarDay(raw)
                  ? '有效日历日期'
                  : '格式化不等于有效日期，例如2026-02-30'}
          </p>
          <h3>中文输入法边界</h3>
          <label>
            不应用数字掩码的中文备注
            <input
              type="text"
              aria-label="中文备注"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              onCompositionStart={() => setComposing(true)}
              onCompositionEnd={() => setComposing(false)}
              onBlur={() => setComposing(false)}
              placeholder="输入中文备注"
            />
          </label>
          <p role="status" data-testid="c06-ime">
            IME：{composing ? '正在组合字词' : '可以正常输入'}
          </p>
          <p>自由文本不用数字掩码；本例没有提交快捷键，不把合成事件探针当成真实系统输入法验收。</p>
        </>
      )}
      {level === 'business' && (
        <p>
          typedValue是JS
          number，scale控制输入外观，不提供财务精度。保存/计算需另定十进制字符串或整数分合同；本例没有账本或网络。
        </p>
      )}
      <p>
        只有显式重置和场景切换重挂SDK控件，清本轮快照/计数/备注；reset不承诺保留焦点。
        React包装器卸载时destroy自己的mask，应用不删除全局监听或样式。
      </p>
    </section>
  )
}
