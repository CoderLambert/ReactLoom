import {useState} from 'react';
import Decimal from 'decimal.js';

type Props = {level: 'basic' | 'business' | 'advanced'};
type InvoiceInput = {unitPrice: string; quantity: string; taxPercent: string};
type InvoiceResult = {subtotal: string; tax: string; total: string};

// 不修改 Decimal.set 的全局默认配置，以免污染其他业务模块。
const Money = Decimal.clone({precision: 28, rounding: Decimal.ROUND_HALF_UP});
const Bankers = Decimal.clone({precision: 28, rounding: Decimal.ROUND_HALF_EVEN});

function amount(label: string, input: string): Decimal {
  const value = input.trim();
  if (!/^(?:0|[1-9]\d{0,9})(?:\.\d{1,4})?$/.test(value)) {
    throw new Error(label + ' 必须是非负十进制字符串，最多四位小数');
  }
  return new Money(value);
}

export function calculateInvoice(input: InvoiceInput): InvoiceResult {
  const unit = amount('单价', input.unitPrice);
  if (!/^[1-9]\d{0,3}$/.test(input.quantity)) {
    throw new Error('数量必须是 1–9999 的整数');
  }
  const qty = new Money(input.quantity);
  const taxRate = amount('税率', input.taxPercent);
  if (taxRate.greaterThan(100)) throw new Error('税率不超过 100%');

  // 本演示采用“行小计四舍五入到分，再计算税”的业务规则。
  // 生产应按实际合同和税务法规确定算法及舍入点。
  const subtotal = unit.times(qty).toDecimalPlaces(2);
  const tax = subtotal.times(taxRate).dividedBy(100).toDecimalPlaces(2);
  const total = subtotal.plus(tax);
  return {subtotal: subtotal.toFixed(2), tax: tax.toFixed(2), total: total.toFixed(2)};
}

export default function DecimalExample({level}: Props) {
  const [input, setInput] = useState<InvoiceInput>({
    unitPrice: '19.99',
    quantity: '3',
    taxPercent: '7.5',
  });
  const [result, setResult] = useState<InvoiceResult | null>(null);
  const [error, setError] = useState('');
  const precise = new Money('0.1').plus('0.2').toString();
  const native = String(0.1 + 0.2);

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
          onChange={event => setInput(old => ({...old, unitPrice: event.target.value}))}/></label>
        <label>数量 <input value={input.quantity} aria-label="数量"
          onChange={event => setInput(old => ({...old, quantity: event.target.value}))}/></label>
        <label>税率 (%) <input value={input.taxPercent} aria-label="税率"
          onChange={event => setInput(old => ({...old, taxPercent: event.target.value}))}/></label>
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
        <output data-testid="half-up">{new Money('1.005').toFixed(2)}</output><br/>
        ROUND_HALF_EVEN('1.005').toFixed(2) →{' '}
        <output data-testid="half-even">{new Bankers('1.005').toFixed(2)}</output>
      </div>
      <p>这里使用 Decimal.clone 获得隔离构造器，不在共享模块修改 Decimal 全局配置。
        业务入参先进行精度与范围检查，不接受科学计数法或 Infinity 进入价格字段。</p>
    </section>}
  </section>;
}
