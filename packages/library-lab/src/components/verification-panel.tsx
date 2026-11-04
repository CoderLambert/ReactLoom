import type { Entry, Result } from '../lib/types'

const STATUS: Record<Result, { label: string; description: string }> = {
  PASS: { label: 'PASS', description: '与当前源码一致的执行证据已记录' },
  FAIL: { label: 'FAIL', description: '执行失败，尚未解决' },
  BLOCKED: { label: 'BLOCKED', description: '环境或外部条件阻塞，未证明通过' },
  NOT_RUN: { label: 'NOT_RUN', description: '尚未执行可证明结论的检查' },
}
const KINDS: Record<string, string> = {
  sdk: '目标 SDK',
  build: '生产构建',
  browser: '浏览器',
  typecheck: '类型检查',
  lint: '代码检查',
  unit: '单元测试',
  license: '授权核验',
  accessibility: '无障碍',
}

/** A passing platform test must not conceal an unverified SDK or browser run. */
export default function VerificationPanel({ entry }: { entry: Entry }) {
  const checks = Object.entries(entry.verification)
  return (
    <section className="verification-panel" aria-label="当前条目的验证证据">
      <section className="evidence-strip" aria-label="分项验证状态">
        {checks.map(([kind, result]) => (
          <span
            key={kind}
            className="evidence-pill"
            data-status={result.status}
            title={`${KINDS[kind] ?? kind}：${STATUS[result.status]?.description ?? '状态未知'}`}
          >
            <strong>{KINDS[kind] ?? kind}</strong>
            <span>{result.status}</span>
          </span>
        ))}
      </section>
      <details className="evidence-details">
        <summary>查看实际验证命令、证据与阻塞原因</summary>
        <p>
          本页显示的是针对当前源码的验证摘要。目录收录、示例存在、Node 平台测试与真实第三方 SDK
          验证必须分开判断。
        </p>
        <dl>
          {checks.map(([kind, result]) => (
            <div key={kind} className="evidence-result">
              <dt>
                <strong>{KINDS[kind] ?? kind}</strong> —{' '}
                <span data-status={result.status}>{result.status}</span>
              </dt>
              <dd>{result.note ?? STATUS[result.status]?.description ?? '未附说明'}</dd>
              {result.command && (
                <dd>
                  执行命令：<code>{result.command}</code>
                </dd>
              )}
              {result.evidence && (
                <dd>
                  证据：<code>{result.evidence}</code>
                </dd>
              )}
            </div>
          ))}
        </dl>
        {entry.sourceFingerprint && (
          <p className="hash">
            当前源码与依赖指纹：<code>{entry.sourceFingerprint}</code>
          </p>
        )}
      </details>
    </section>
  )
}
