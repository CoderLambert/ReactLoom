import {useEffect, useState} from 'react';
import {canonicalHttpsFeedUrl, isRealCivilDate} from './boundary-policy.mjs';
import * as v from 'valibot';

type Props = {level: 'basic' | 'business' | 'advanced'};

// Schema declarations are ordinary application code; the input must remain unknown.
const FeedSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(2, '名称至少2个字符')),
  url: v.pipe(v.string(), v.url('无效的URL'), v.check(url => canonicalHttpsFeedUrl(url) !== null, '仅允许无凭据的 HTTPS 完整地址')),
  category: v.picklist(['tech', 'business']),
});
const BatchSchema = v.object({
  feeds: v.pipe(v.array(FeedSchema), v.minLength(1, '至少选择一个RSS源')),
  owner: v.pipe(v.string(), v.trim(), v.minLength(2)),
});
const WindowSchema = v.pipe(
  v.object({
    start: v.pipe(v.string(), v.isoDate('日期须为YYYY-MM-DD'), v.check(value => isRealCivilDate(value), '不存在的公历日期')),
    end: v.pipe(v.string(), v.isoDate('日期须为YYYY-MM-DD')),
  }),
  v.forward(
    v.partialCheck([['start'], ['end']], input => input.start <= input.end, '结束日期不能早于开始日期'),
    ['end'],
  ),
);
const samples = {
  basic: JSON.stringify({name: '前端工程', url: 'https://example.com/feed', category: 'tech'}, null, 2),
  business: JSON.stringify({owner: '新闻项目', feeds: [
    {name: '官方更新', url: 'https://example.com/releases.xml', category: 'tech'},
    {name: '商业新闻', url: 'https://example.org/rss', category: 'business'},
  ]}, null, 2),
  advanced: JSON.stringify({start: '2026-11-05', end: '2026-11-02'}, null, 2),
};
export default function ValibotExample({level}: Props) {
  const [payload, setPayload] = useState(samples[level]);
  const [result, setResult] = useState('点击验证以执行真实 Valibot safeParse');
  const schema = level === 'basic' ? FeedSchema : level === 'business' ? BatchSchema : WindowSchema;
  useEffect(() => {
    setPayload(samples[level]);
    setResult('场景已切换，需要重新验证');
  }, [level]);
  const validate = () => {
    try {
      const parsed: unknown = JSON.parse(payload);
      const outcome = v.safeParse(schema, parsed, {abortEarly: false});
      setResult(outcome.success
        ? 'PASS: ' + JSON.stringify(outcome.output, null, 2)
        : 'FAIL: ' + outcome.issues.map(issue => {
          const field = (issue.path ?? []).map(part => String(part.key)).join('.');
          return (field || '(根对象)') + '：' + issue.message;
        }).join('\n'));
    } catch (error) {
      setResult('FAIL: 输入不是有效 JSON：' + String(error));
    }
  };
  return <section aria-label="Valibot真实SDK实验">
    <h2>{level === 'basic' ? 'Schema校验与未知输入' : level === 'business' ? 'RSS批量导入合同' : '跨字段日期约束与错误位置'}</h2>
    <p>{level === 'advanced' ? '默认样例故意使结束早于开始。日期格式和前后顺序是两项不同约束。' : '所有输入先作为unknown解析；不会用TypeScript类型断言代替运行时校验。'}</p>
    <label htmlFor="c03-json">输入 JSON</label>
    <textarea id="c03-json" style={{display:'block',width:'100%',minHeight:185,fontFamily:'monospace'}} value={payload} onChange={e => {
      setPayload(e.target.value); setResult('输入已改变，需要重新验证');
    }} />
    <div className="demo-controls">
      <button type="button" onClick={validate}>运行 safeParse</button>
      <button type="button" onClick={() => {setPayload(samples[level]);setResult('已恢复原始样例');}}>恢复示例</button>
    </div>
    <output className="demo-output" data-testid="valibot-output" aria-live="polite">{result}</output>
  </section>;
}
