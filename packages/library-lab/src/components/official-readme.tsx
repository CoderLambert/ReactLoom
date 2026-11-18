import type { Entry } from '../lib/types'
import Document from './document'

export default function OfficialReadme({ entry }: { entry: Entry }) {
  const readme = entry.official?.readme
  if (!readme)
    return (
      <section className="empty">
        <h2>官方 README 尚未整理</h2>
        <p>可以在相关资料中打开已收录的官方链接。</p>
      </section>
    )
  return (
    <section>
      <header className="official-source-header">
        <div>
          <h2>官方 README 原文</h2>
          <p>
            {readme.repository} · {readme.version} ·{' '}
            {readme.language === 'en' ? '英文（此版本未提供官方中文 README）' : '官方中文'} · 同步于{' '}
            {readme.syncedAt.slice(0, 10)}
          </p>
        </div>
        <a href={readme.sourceUrl} target="_blank" rel="noopener noreferrer">
          打开上游原文 ↗
        </a>
      </header>
      <p className="notice">
        这里保存对应版本的官方原文。使用方法与业务案例见“详细文档”；外部图片不会自动加载，HTML不会执行；纯HTML版式会以源码文本展示。
      </p>
      <Document entryId={entry.entryId} kind="readme" available readme={readme} />
    </section>
  )
}
