import {useEffect, useState} from 'react';
import {canonicalHttpsFeedUrl, isSafeOpmlFilename} from './boundary-policy.mjs';
import * as z from 'zod';

type Props = {level: 'basic' | 'business' | 'advanced'};

const HttpsUrl = z.string().trim().url().refine(
  value => canonicalHttpsFeedUrl(value) !== null, '仅允许无凭据的 HTTPS 完整地址',
);
export const FeedSchema = z.strictObject({
  title: z.string().trim().min(2, '标题至少两个字符'),
  url: HttpsUrl,
});
export const ImportEventSchema = z.discriminatedUnion('kind', [
  z.strictObject({kind: z.literal('rss'), url: HttpsUrl}),
  z.strictObject({
    kind: z.literal('opml'),
    filename: z.string().trim().refine(isSafeOpmlFilename, '必须为不含目录的 .opml 文件名'),
    groups: z.array(z.string().min(1)).min(1),
  }),
]);
// 先拒绝空字符串，避免 JS Number('') = 0 被误认为合法 TTL。
const TTL = z.string().trim().min(1, '请填写 TTL').regex(/^[1-9]\d?$/u, 'TTL 必须是十进制正整数').pipe(
  z.coerce.number().int().min(1).max(60),
);
export const BatchPolicySchema = z.strictObject({
  ttlMinutes: TTL,
  sources: z.array(FeedSchema).min(1).max(5),
}).superRefine((policy, context) => {
  const seen = new Set<string>();
  policy.sources.forEach((source, index) => {
    const key = canonicalHttpsFeedUrl(source.url);
    if (key === null) return; // Let the URL field validator report malformed values.
    if (seen.has(key)) {
      context.addIssue({
        code: 'custom',
        path: ['sources', index, 'url'],
        message: '批次内不允许重复 URL',
      });
    }
    seen.add(key);
  });
});

export type Feed = z.output<typeof FeedSchema>;
export type BatchInput = z.input<typeof BatchPolicySchema>;
export type BatchOutput = z.output<typeof BatchPolicySchema>;

const validExamples = {
  basic: {title: '  前端实战  ', url: 'https://example.com/rss.xml'},
  business: {kind: 'opml', filename: 'feeds.opml', groups: ['技术', '开源']},
  advanced: {
    ttlMinutes: '15',
    sources: [{title: '开发资讯', url: 'https://example.com/feed'}],
  },
};
const invalidExamples = {
  basic: {title: 'a', url: 'javascript:alert(1)', admin: true},
  business: {kind: 'opml', filename: 'feeds.txt', groups: []},
  advanced: {
    ttlMinutes: '',
    sources: [
      {title: '同一个源', url: 'https://example.com/feed'},
      {title: '仍是此源', url: 'https://example.com/feed'},
    ],
  },
};

export default function ZodBoundaryExample({level}: Props) {
  const [raw, setRaw] = useState(() => JSON.stringify(validExamples[level], null, 2));
  const [errors, setErrors] = useState<string[]>([]);
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('等待解析输入');
  useEffect(() => {
    setRaw(JSON.stringify(validExamples[level], null, 2));
    setErrors([]);
    setOutput('');
    setStatus('已切换场景，等待验证');
  }, [level]);

  function validate() {
    let input: unknown;
    try {
      input = JSON.parse(raw) as unknown;
    } catch (error) {
      setErrors(['JSON 语法错误：' + String(error)]);
      setOutput('');
      setStatus('JSON 解析失败');
      return;
    }
    const schema = level === 'basic' ? FeedSchema
      : level === 'business' ? ImportEventSchema : BatchPolicySchema;
    const result = schema.safeParse(input);
    if (!result.success) {
      setErrors(result.error.issues.map(issue => {
        const field = issue.path.length ? issue.path.join('.') : '(根对象)';
        return field + '：' + issue.message;
      }));
      setOutput('');
      setStatus('运行时数据校验失败');
      return;
    }
    setErrors([]);
    setOutput(JSON.stringify(result.data, null, 2));
    setStatus('已验证并生成经过规范化的输出数据');
  }

  return <section aria-label="Zod 实际运行示例">
    <h2>{level === 'basic' ? 'unknown → 安全的 RSS DTO'
      : level === 'business' ? 'RSS / OPML 判别联合输入' : '跨字段规则与输入输出类型'}</h2>
    <p>仅使用真实 Zod schema.safeParse，不进行网络调用、不把 TypeScript 断言当验证。</p>
    <label htmlFor="zod-json-input">未可信 JSON 输入</label>
    <textarea id="zod-json-input" aria-label="未可信 JSON 输入"
      style={{display:'block',width:'100%',minHeight:220,fontFamily:'monospace',marginTop:8}}
      spellCheck={false} value={raw} onChange={event => {
        setRaw(event.target.value); setErrors([]); setOutput('');
        setStatus('内容已修改，需要重新校验');
      }}/>
    <div className="demo-controls">
      <button type="button" onClick={validate}>运行 safeParse</button>
      <button type="button" onClick={() => {
        setRaw(JSON.stringify(invalidExamples[level], null, 2));
        setOutput(''); setErrors([]); setStatus('已加载反例，请重新校验');
      }}>加载失败样例</button>
      <button type="button" onClick={() => {
        setRaw(JSON.stringify(validExamples[level], null, 2));
        setOutput(''); setErrors([]); setStatus('已恢复有效样例');
      }}>重置</button>
    </div>
    <p role="status">{status}</p>
    {!!errors.length && <div role="alert"><h3>结构化校验错误</h3>
      <ul>{errors.map((error, index) => <li key={index}>{error}</li>)}</ul></div>}
    {output && <><h3>真实 parsed.data（不是原始输入）</h3>
      <output className="demo-output">{output}</output></>}
    {level === 'advanced' && <p>将 TTL 改成空字符串，或把两个 URL 改成相同地址。空值不可偷偷转换成 0；重复错误须显示精确字段路径。</p>}
  </section>;
}
