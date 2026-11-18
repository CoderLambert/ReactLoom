import Decimal from 'decimal.js'
import { useState } from 'react'
import { normalizeAmount } from './amount-policy.mjs'

import {
  calculateInvoice,
  type InvoiceInput,
  type InvoiceResult,
  roundingContrast,
} from './invoice.mjs'

const Addition = Decimal.clone({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

type Props = { level: 'basic' | 'business' | 'advanced' }
export default function DecimalExample({ level }: Props) {
  const [input, setInput] = useState<InvoiceInput>({
    unitPrice: '19.99',
    quantity: '3',
    taxPercent: '7.5',
  })
  const [result, setResult] = useState<InvoiceResult | null>(null)
  const [error, setError] = useState('')
  const [left, setLeft] = useState('0.1')
  const [right, setRight] = useState('0.2')
  let precise = ''
  let additionError = ''
  let native = ''
  try {
    const a = normalizeAmount('左操作数', left)
    const b = normalizeAmount('右操作数', right)
    precise = new Addition(a).plus(b).toString()
    // Number is used only in this explicitly labelled comparison, never in invoice.mjs.
    native = String(Number(a) + Number(b))
  } catch (caught) {
    additionError = caught instanceof Error ? caught.message : String(caught)
  }
  const contrast = roundingContrast()

  function updateInput(key: keyof InvoiceInput, value: string) {
    setInput((old) => ({ ...old, [key]: value }))
    // An invoice computed for previous fields must not remain visible after editing.
    setResult(null)
    setError('')
  }

  function calculate() {
    try {
      const calculated = calculateInvoice(input)
      setResult(calculated)
      setError('')
    } catch (caught) {
      setResult(null)
      setError(caught instanceof Error ? caught.message : String(caught))
    }
  }

  return (
    <section aria-label="decimal.js 真正执行的精度实验">
      <h2>
        {level === 'basic'
          ? '0.1 + 0.2 的十进制真相'
          : level === 'business'
            ? '新闻订阅采购费用'
            : '舍入模式、舍入点与模块隔离'}
      </h2>
      <p>所有金额按字符串传给真实 decimal.js；展示结果始终序列化为字符串。</p>
      {level === 'basic' && (
        <>
          <p>
            编辑两个十进制字符串，观察同一输入在两种数值模型中的和。最多四位小数，负数与科学计数不属于本例金额输入。
          </p>
          <div className="demo-controls">
            <label>
              左操作数{' '}
              <input
                aria-label="左操作数"
                value={left}
                onChange={(event) => setLeft(event.target.value)}
              />
            </label>
            <label>
              右操作数{' '}
              <input
                aria-label="右操作数"
                value={right}
                onChange={(event) => setRight(event.target.value)}
              />
            </label>
          </div>
          {additionError ? (
            <p role="alert">{additionError}</p>
          ) : (
            <div className="demo-output">
              原生 Number：<output data-testid="native-number">{native}</output>
              <br />
              decimal.js：<output data-testid="decimal-value">{precise}</output>
            </div>
          )}
        </>
      )}

      {level === 'business' && (
        <>
          <div className="demo-controls">
            <label>
              单价{' '}
              <input
                value={input.unitPrice}
                aria-label="单价"
                onChange={(event) => updateInput('unitPrice', event.target.value)}
              />
            </label>
            <label>
              数量{' '}
              <input
                value={input.quantity}
                aria-label="数量"
                onChange={(event) => updateInput('quantity', event.target.value)}
              />
            </label>
            <label>
              税率 (%){' '}
              <input
                value={input.taxPercent}
                aria-label="税率"
                onChange={(event) => updateInput('taxPercent', event.target.value)}
              />
            </label>
            <button type="button" onClick={calculate}>
              按业务规则计算
            </button>
          </div>
          {error && <p role="alert">{error}</p>}
          {result && (
            <output className="demo-output" data-testid="invoice">
              {JSON.stringify(result, null, 2)}
            </output>
          )}
          <p>
            本示例先将行小计舍入到分，再计算税；这只是明确声明的业务
            fixture，不代表所有国家和合同的税务规则。
          </p>
        </>
      )}

      {level === 'advanced' && (
        <section>
          <h3>边界：恰好半分</h3>
          <div className="demo-output">
            ROUND_HALF_UP('1.005').toFixed(2) →{' '}
            <output data-testid="half-up">{contrast.halfUp}</output>
            <br />
            ROUND_HALF_EVEN('1.005').toFixed(2) →{' '}
            <output data-testid="half-even">{contrast.halfEven}</output>
          </div>
          <p>
            单价 0.335 × 3：按整行金额舍入 ={' '}
            <output data-testid="extended-line">{contrast.extendedLine}</output>；
            先舍入单价再乘数量 ={' '}
            <output data-testid="rounded-unit">{contrast.roundedEachUnit}</output>。
            两种结果不同，必须以合同指定的舍入点为准。
          </p>
          <p>
            这里使用 Decimal.clone 获得隔离构造器，不在共享模块修改 Decimal 全局配置。
            业务入参先进行精度与范围检查，不接受科学计数法或 Infinity 进入价格字段。
          </p>
        </section>
      )}
    </section>
  )
}
