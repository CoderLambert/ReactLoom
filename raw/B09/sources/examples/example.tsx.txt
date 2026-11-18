import { useEffect, useRef, useState } from 'react'
import { archiveByIds, isCurrentArchiveRun, pendingArchiveIds } from './archive-policy'
import { Button, buttonVariants, cn } from './ui/button'
import './workshop.css'

type Level = 'basic' | 'business' | 'advanced'
type Variant = 'default' | 'secondary' | 'outline' | 'destructive'
type Size = 'default' | 'sm' | 'lg'
type Article = { id: string; title: string; archived: boolean }
type ArchiveState = 'idle' | 'pending' | 'error' | 'success' | 'cancelled'

const initialArticles: Article[] = [
  { id: 'a1', title: 'React 工程工具精选', archived: false },
  { id: 'a2', title: '开源项目趋势', archived: true },
  { id: 'a3', title: '架构复盘周报', archived: false },
]

function VariantWorkshop() {
  const [variant, setVariant] = useState<Variant>('default')
  const [size, setSize] = useState<Size>('default')
  const [wide, setWide] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [count, setCount] = useState(0)
  const override = wide ? 'px-8' : undefined
  const className = cn(buttonVariants({ variant, size }), override)
  return (
    <>
      <h2>本地 Button：从变体到实际 className</h2>
      <p>选择变体和尺寸，再让调用方用 px-8 覆盖水平间距。下方显示的是实际生成结果。</p>
      <div className="b09-controls">
        <label>
          变体{' '}
          <select value={variant} onChange={(event) => setVariant(event.target.value as Variant)}>
            <option value="default">默认</option>
            <option value="secondary">次级</option>
            <option value="outline">描边</option>
            <option value="destructive">危险操作</option>
          </select>
        </label>
        <label>
          尺寸{' '}
          <select value={size} onChange={(event) => setSize(event.target.value as Size)}>
            <option value="default">默认</option>
            <option value="sm">小</option>
            <option value="lg">大</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={wide}
            onChange={(event) => setWide(event.target.checked)}
          />
          用 px-8 覆盖间距
        </label>
        <label>
          <input
            type="checkbox"
            checked={disabled}
            onChange={(event) => setDisabled(event.target.checked)}
          />
          禁用预览按钮
        </label>
      </div>
      <Button
        data-testid="b09-button-preview"
        variant={variant}
        size={size}
        className={override}
        disabled={disabled}
        onClick={() => setCount((value) => value + 1)}
      >
        预览按钮
      </Button>
      <p role="status" data-testid="b09-activation-count">
        已触发 {count} 次
      </p>
      <h3>实际 className</h3>
      <pre data-testid="b09-class-output">{className}</pre>
      <p>
        cva 选择样式组合，clsx 合并条件片段，tailwind-merge 去掉冲突工具类；disabled 的行为来自原生
        button。
      </p>
    </>
  )
}

function ArchiveWorkshop() {
  const [articles, setArticles] = useState<Article[]>(initialArticles)
  const [selected, setSelected] = useState<string[]>([])
  const [simulateFailure, setSimulateFailure] = useState(false)
  const [state, setState] = useState<ArchiveState>('idle')
  const [message, setMessage] = useState('选择待阅读文章，再执行本地归档。')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const operationEpoch = useRef(0)
  const busy = state === 'pending'
  const pending = pendingArchiveIds(articles, selected)

  function invalidateRun() {
    operationEpoch.current++
    if (timer.current !== null) clearTimeout(timer.current)
    timer.current = null
  }

  useEffect(
    () => () => {
      operationEpoch.current++
      if (timer.current !== null) clearTimeout(timer.current)
      timer.current = null
    },
    [],
  )

  function archive() {
    if (busy || !pending.length) return
    const snapshot = [...pending]
    const shouldFail = simulateFailure
    invalidateRun()
    const epoch = operationEpoch.current
    setState('pending')
    setMessage(`正在处理 ${snapshot.length} 篇文章…`)
    timer.current = setTimeout(() => {
      if (!isCurrentArchiveRun(epoch, operationEpoch.current)) return
      timer.current = null
      if (shouldFail) {
        setState('error')
        setMessage('本地模拟失败：文章和选择均已保留。关闭失败开关后可重试。')
        return
      }
      setArticles((rows) => archiveByIds(rows, snapshot))
      setSelected([])
      setState('success')
      setMessage(`已归档 ${snapshot.length} 篇文章，仅更新本例内存。`)
    }, 250)
  }

  return (
    <>
      <h2>RSS 批量归档：失败后保留选择</h2>
      <p>250ms 定时器模拟业务结果，没有 HTTP 请求。真实执行的是本地 Button 与归档状态逻辑。</p>
      <label className="b09-toggle">
        <input
          type="checkbox"
          checked={simulateFailure}
          disabled={busy}
          onChange={(event) => setSimulateFailure(event.target.checked)}
        />
        模拟归档失败
      </label>
      <ul className="b09-articles">
        {articles.map((article) => (
          <li
            key={article.id}
            data-testid={`b09-article-${article.id}`}
            data-archived={article.archived}
          >
            <label>
              <input
                type="checkbox"
                disabled={busy || article.archived}
                checked={selected.includes(article.id)}
                onChange={() =>
                  setSelected((ids) =>
                    ids.includes(article.id)
                      ? ids.filter((id) => id !== article.id)
                      : [...ids, article.id],
                  )
                }
              />
              {article.title}
            </label>
            <span>{article.archived ? '已归档' : '待阅读'}</span>
          </li>
        ))}
      </ul>
      <div className="b09-controls">
        <Button disabled={!pending.length || busy} onClick={archive}>
          {busy ? '归档中…' : `归档已选 ${pending.length} 项`}
        </Button>
        <Button
          variant="outline"
          disabled={!busy}
          onClick={() => {
            invalidateRun()
            setState('cancelled')
            setMessage('本轮已取消，文章和选择均保留。')
          }}
        >
          取消本次归档
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            invalidateRun()
            setState('idle')
            setArticles(initialArticles)
            setSelected([])
            setSimulateFailure(false)
            setMessage('已恢复示例文章，待处理的旧回调已失效。')
          }}
        >
          恢复示例文章
        </Button>
      </div>
      <p
        role={state === 'error' ? 'alert' : 'status'}
        data-testid="b09-archive-status"
        data-state={state}
      >
        {message}
      </p>
      <p data-testid="b09-archive-count">
        已归档 {articles.filter((article) => article.archived).length} / {articles.length} 篇
      </p>
    </>
  )
}

function SlotWorkshop() {
  const [allowed, setAllowed] = useState(true)
  const [count, setCount] = useState(0)
  return (
    <>
      <h2>asChild：样式是按钮，根节点仍是链接</h2>
      <p>Slot 把属性合并到唯一子元素，不再包一层 button。Tab 聚焦链接，Enter 使用原生锚点导航。</p>
      <label className="b09-toggle">
        <input
          type="checkbox"
          checked={allowed}
          onChange={(event) => setAllowed(event.target.checked)}
        />
        允许打开示例详情
      </label>
      <div className="b09-controls">
        {allowed ? (
          <Button asChild variant="outline">
            <a data-testid="b09-slot-link" href="#b09-slot-target">
              打开示例详情
            </a>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <span data-testid="b09-slot-link" className="b09-unavailable" aria-disabled="true">
              示例详情不可用
            </span>
          </Button>
        )}
        <Button
          data-testid="b09-native-disabled"
          disabled
          onClick={() => setCount((value) => value + 1)}
        >
          原生禁用按钮
        </Button>
        <Button asChild variant="secondary">
          <a
            href="https://ui.shadcn.com/docs/components/radix/button"
            target="_blank"
            rel="noopener noreferrer"
          >
            官方 Radix Button 文档 ↗
          </a>
        </Button>
      </div>
      <p role="status" data-testid="b09-link-status">
        原生禁用按钮已触发 {count} 次（导航结果观察 URL 锚点）
      </p>
      <div id="b09-slot-target" className="b09-link-target">
        <h3>本地示例详情</h3>
        <p>
          锚点导航仍由浏览器负责。无权限时改为无 href 的说明节点；aria-disabled
          本身不会取消链接导航。
        </p>
      </div>
    </>
  )
}

export default function ShadcnSourceExample({ level }: { level: Level }) {
  return (
    <section
      className="b09-workshop"
      aria-label="shadcn/ui 自有源码实验"
      data-testid="b09-workshop"
      data-level={level}
    >
      <p>这是原创教学 Button，真实使用 CVA / Radix Slot；不是 CLI 下载的上游原件。</p>
      {level === 'basic' ? (
        <VariantWorkshop />
      ) : level === 'business' ? (
        <ArchiveWorkshop />
      ) : (
        <SlotWorkshop />
      )}
    </section>
  )
}
