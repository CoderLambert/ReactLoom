import {useMemo, useState} from 'react';
import Ajv from 'ajv';

type Level = 'basic' | 'business' | 'advanced';
type Props = {level: Level};

// Schemas are trusted application code. Never compile an arbitrary remotely supplied schema.
export const feedSchema = {
  type: 'object', additionalProperties: false, required: ['id', 'title', 'url'],
  properties: {
    id: {type: 'string', minLength: 1, maxLength: 40, pattern: '^[a-z0-9-]+$'},
    title: {type: 'string', minLength: 2, maxLength: 80},
    url: {type: 'string', minLength: 9, pattern: '^https://'},
  },
} as const;
export const batchSchema = {
  type: 'object', additionalProperties: false, required: ['team', 'feeds'],
  properties: {
    team: {type: 'string', minLength: 1},
    feeds: {type: 'array', minItems: 1, maxItems: 5, uniqueItems: true, items: feedSchema},
  },
} as const;
export const windowSchema = {
  type: 'object', additionalProperties: false, required: ['enabled'],
  properties: {enabled: {type: 'boolean'}, maxConcurrent: {type: 'integer', minimum: 1, maximum: 8}},
  if: {properties: {enabled: {const: true}}, required: ['enabled']},
  then: {required: ['maxConcurrent']},
} as const;
const schemas = {basic: feedSchema, business: batchSchema, advanced: windowSchema};
const samples = {
  basic: {id: 'frontend', title: '前端工程', url: 'https://example.org/rss'},
  business: {team: 'news', feeds: [
    {id: 'official', title: '官方动态', url: 'https://example.org/releases'},
    {id: 'dev', title: '开发实战', url: 'https://example.net/feed'},
  ]},
  advanced: {enabled: true, maxConcurrent: 0, unreviewed: true},
};
const validator = new Ajv({strict: true, allErrors: true, coerceTypes: false, useDefaults: false, removeAdditional: false});
export default function AjvExample({level}: Props) {
  const [input, setInput] = useState(() => JSON.stringify(samples[level], null, 2));
  const [output, setOutput] = useState('点击验证，执行真实 Ajv 编译后的校验器');
  const validate = useMemo(() => validator.compile(schemas[level]), [level]);
  function run() {
    let value: unknown;
    try { value = JSON.parse(input) as unknown; }
    catch (error) { setOutput('JSON 解析失败：' + String(error)); return; }
    if (validate(value)) {
      setOutput('PASS：' + JSON.stringify(value, null, 2));
      return;
    }
    setOutput('FAIL：' + (validate.errors ?? []).map(item =>
      (item.instancePath || '/') + ' · ' + item.keyword + ' · ' + (item.message || '不符合 Schema'),
    ).join('\n'));
  }
  return <section aria-label="Ajv 真实 JSON Schema 验证">
    <h2>{level === 'basic' ? '运行时 schema 验证' : level === 'business' ? '团队 RSS 批量导入' : '条件规则与多条错误'}</h2>
    <p>{level === 'advanced' ? '故意提供超出范围的并发值和未知字段，演示 allErrors 与条件校验。' : '模式是项目审查过的静态 JSON Schema；不会使用网络提供的可执行 schema。'}</p>
    <label htmlFor="c05-input">输入 JSON</label>
    <textarea id="c05-input" value={input} onChange={event => setInput(event.target.value)}
      style={{width: '100%', minHeight: 170, display: 'block', fontFamily: 'monospace'}} />
    <div className="demo-controls"><button type="button" onClick={run}>调用 Ajv.validate</button>
      <button type="button" onClick={() => {setInput(JSON.stringify(samples[level], null, 2)); setOutput('已重置');}}>恢复样例</button></div>
    <output className="demo-output" aria-live="polite" data-testid="ajv-result">{output}</output>
    <p>仅检查字符串结构、HTTPS 前缀等静态合同；真正 URL 安全、抓取权限和 SSRF 必须在服务端完成。</p>
  </section>;
}
