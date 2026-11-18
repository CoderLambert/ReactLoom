import { useState } from 'react'
import type { Entry } from '../lib/types'

export default function OfficialHomepage({ entry }: { entry: Entry }) {
  const homepage = entry.official?.homepage
  const [requested, setRequested] = useState(homepage?.status === 'allowed')
  const [attempt, setAttempt] = useState(0)
  if (!homepage)
    return (
      <section className="empty">
        <h2>官网信息尚未整理</h2>
        <p>可以在相关资料中查找官方入口。</p>
      </section>
    )
  const label = homepage.kind === 'repository' ? '官方仓库' : '官网'
  return (
    <section className="official-homepage">
      <header className="official-source-header">
        <div>
          <h2>{label}预览</h2>
          <p>{homepage.url}</p>
        </div>
        <a href={homepage.url} target="_blank" rel="noopener noreferrer">
          打开{label} ↗
        </a>
      </header>
      {homepage.status === 'blocked' ? (
        <div className="notice" role="note">
          <h3>这个网站不允许嵌入其他页面</h3>
          <p>请使用上方按钮直接访问{label}。</p>
          <details>
            <summary>查看检查依据（{homepage.checkedAt.slice(0, 10)}）</summary>
            <p>{homepage.reason}</p>
          </details>
        </div>
      ) : (
        <>
          <p className="notice">
            这是外部网站的内容。若预览空白或无法操作，可以直接打开{label}。检查日期：
            {homepage.checkedAt.slice(0, 10)}。
          </p>
          <div className="demo-controls">
            <button
              type="button"
              onClick={() => {
                setRequested(true)
                setAttempt((n) => n + 1)
              }}
            >
              {requested ? '重新载入预览' : '加载官网预览'}
            </button>
            {requested && (
              <button type="button" onClick={() => setRequested(false)}>
                关闭预览
              </button>
            )}
          </div>
          {requested && (
            <iframe
              key={attempt}
              className="official-website-frame"
              title={`${entry.name} ${label}预览`}
              src={homepage.url}
              sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              referrerPolicy="no-referrer"
            />
          )}
        </>
      )}
    </section>
  )
}
