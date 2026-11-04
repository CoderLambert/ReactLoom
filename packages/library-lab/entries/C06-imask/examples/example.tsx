import {useState} from 'react';
import {IMaskInput} from 'react-imask';
import {validCalendarDay} from './calendar-policy.mjs';
type Props = {level: 'basic' | 'business' | 'advanced'};

export default function MaskedInputs({level}: Props) {
  const [raw,setRaw] = useState('');
  const [accepts,setAccepts] = useState(0);
  const [generation,setGeneration] = useState(0);
  const [composing,setComposing] = useState(false);
  const reset = () => {setRaw('');setAccepts(0);setGeneration(n=>n+1);};
  const update = (value: unknown) => {setRaw(String(value ?? ''));setAccepts(n=>n+1);};
  const advanced = level === 'advanced';
  return <section aria-label="IMask真实SDK示例">
    <h2>{level === 'basic'?'八位编号输入':level === 'business'?'金额输入和实际 unmasked value':'日期输入与语义校验'}</h2>
    <p>输入过程由真实 react-imask 管理；观察 onAccept 返回值。掩码只控制格式，并不能代替业务校验。</p>
    <div className="demo-controls">
      {level==='basic'&&<label>编号 <IMaskInput key={generation} mask="0000-0000" unmask={true} placeholder="1234-5678" aria-label="编号" onAccept={update}/></label>}
      {level==='business'&&<label>金额 <IMaskInput key={generation} mask={Number} radix="." scale={2} thousandsSeparator="," unmask={true} placeholder="1234.50" aria-label="金额" onAccept={update}/></label>}
      {advanced&&<label>事件日期 <IMaskInput key={generation} mask="0000-00-00" unmask={false} placeholder="2026-10-27" aria-label="事件日期" onAccept={update}/></label>}
      <button type="button" onClick={reset}>重置当前控件</button>
    </div>
    <p>onAccept 已触发 {accepts} 次；当前值：<output data-testid="imask-value">{raw || '（空）'}</output></p>
    {advanced&&<p role="status">日期语义：{!raw?'尚未填写':validCalendarDay(raw)?'有效日历日期':'格式化不等于有效日期，例如2026-02-30'}</p>}
    {level==='business'&&<p>金额在后续计算前还需要使用 decimal.js 等十进制库，不能用 JS 浮点数直接做财务结算。</p>}
    {advanced&&<><h3>中文输入法边界</h3><label>不应用数字掩码的中文备注 <input aria-label="中文备注" onCompositionStart={()=>setComposing(true)} onCompositionEnd={()=>setComposing(false)} placeholder="输入中文备注"/></label><p role="status">IME：{composing?'正在组合字词':'可以正常输入'}</p><p>格式掩码不应绑定到自由文本输入；候选词确认期间避免触发提交。</p></>}
  </section>;
}
