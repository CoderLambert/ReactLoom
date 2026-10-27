import {useState} from 'react';
import Decimal from 'decimal.js';
import {calculateInvoice, roundingContrast, type InvoiceInput, type InvoiceResult} from './invoice.mjs';

type Props = {level: 'basic' | 'business' | 'advanced'};
export default function DecimalExample({level}: Props) {
  const [input, setInput] = useState<InvoiceInput>({
    unitPrice: '19.99',
    quantity: '3',
    taxPercent: '7.5',
  });
  const [result, setResult] = useState<InvoiceResult | null>(null);
  const [error, setError] = useState('');
  const precise = new Decimal('0.1').plus('0.2').toString();
  const contrast = roundingContrast();
  const native = String(0.1 + 0.2);

  function updateInput(key: keyof InvoiceInput, value: string) {
    setInput(old => ({...old, [key]: value}));
    // An invoice computed for previous fields must not remain visible after editing.
    setResult(null);
    setError('');
  }

  function calculate() {
    try {
      const calculated = calculateInvoice(input);
      setResult(calculated);
      setError('');
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  }

  return <section aria-label="decimal.js 真正执行的精度实验">
    <h2>{level === 'basic' ? '0.1 + 0.2 的十进制真相'
      : level === 'business' ? '新闻订阅采购费用' : '税金、四舍五入与全局配置'}</h2>
    <p>所有金额按字符串传给真实 decimal.js；展示结果始终序列化为字符串。</p>
    <div className="demo-output">
      原生 Number：<output data-testid="native-number">{native}</output><br/>
      decimal.js：<output data-testid="decimal-value">{precise}</output>
    </div>

    {level !== 'basic' && <>
      <div className="demo-controls">
        <label>单价 <input value={input.unitPrice} aria-label="单价"
          onChange={event => updateInput('unitPrice', event.target.value)}/></label>
        <label>数量 <input value={input.quantity} aria-label="数量"
          onChange={event => updateInput('quantity', event.target.value)}/></label>
        <label>税率 (%) <input value={input.taxPercent} aria-label="税率"
          onChange={event => updateInput('taxPercent', event.target.value)}/></label>
        <button type="button" onClick={calculate}>按业务规则计算</button>
      </div>
      {error && <p role="alert">{error}</p>}
      {result && <output className="demo-output" data-testid="invoice">
        {JSON.stringify(result, null, 2)}
      </output>}
      <p>本示例先将行小计舍入到分，再计算税；这只是**明确声明的业务 fixture**，不代表所有国家和合同的税务规则。</p>
    </>}

    {level === 'advanced' && <section>
      <h3>边界：恰好半分</h3>
      <div className="demo-output">
        ROUND_HALF_UP('1.005').toFixed(2) →{' '}
        <output data-testid="half-up">{contrast.halfUp}</output><br/>
        ROUND_HALF_EVEN('1.005').toFixed(2) →{' '}
        <output data-testid="half-even">{contrast.halfEven}</output>
      </div>
      <p>单价 0.335 × 3：按整行金额舍入 = <output data-testid="extended-line">{contrast.extendedLine}</output>；
        先舍入单价再乘数量 = <output data-testid="rounded-unit">{contrast.roundedEachUnit}</output>。
        两种结果不同，必须以合同指定的舍入点为准。</p>
      <p>这里使用 Decimal.clone 获得隔离构造器，不在共享模块修改 Decimal 全局配置。
        业务入参先进行精度与范围检查，不接受科学计数法或 Infinity 进入价格字段。</p>
    </section>}
  </section>;
}
