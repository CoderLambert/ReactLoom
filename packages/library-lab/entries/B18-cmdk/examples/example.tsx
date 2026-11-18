import { Command, useCommandState } from 'cmdk'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { applyDemoAction, type DemoActionId, INITIAL_ARTICLE } from './command-state'
import { createImeGuard, ownsPaletteShortcut, shouldTogglePalette } from './keyboard-policy'
import './styles.css'

type Level = 'basic' | 'business' | 'advanced'
type Action = {
  id: DemoActionId | 'delete'
  label: string
  description: string
  keywords: string[]
  group: '阅读' | '管理'
  enabled: boolean
}
const ACTIONS: Action[] = [
  {
    id: 'save',
    label: '稍后阅读',
    description: '保存当前文章到阅读队列',
    keywords: ['收藏', 'bookmark', 'reading'],
    group: '阅读',
    enabled: true,
  },
  {
    id: 'read',
    label: '标记已读',
    description: '将文章移出未读列表',
    keywords: ['完成', 'done', 'read'],
    group: '阅读',
    enabled: true,
  },
  {
    id: 'copy',
    label: '生成本地引用',
    description: '生成本地引用，不写系统剪贴板',
    keywords: ['引用', 'citation'],
    group: '阅读',
    enabled: true,
  },
  {
    id: 'refresh',
    label: '模拟刷新订阅',
    description: '只增加本地计数，不发请求',
    keywords: ['更新', 'refresh', 'rss'],
    group: '管理',
    enabled: true,
  },
  {
    id: 'delete',
    label: '删除所有订阅',
    description: '本地示例禁止危险动作',
    keywords: ['remove', '危险'],
    group: '管理',
    enabled: false,
  },
]

function CommandStateReadout() {
  // Primitive selectors keep useSyncExternalStore snapshots stable.
  const search = useCommandState((state) => state.search)
  const selectedId = useCommandState((state) => state.value)
  const resultCount = useCommandState((state) => state.filtered.count)
  return (
    <pre className="rl-cmdk-reading" data-testid="b18-sdk-state">
      {JSON.stringify({ search, selectedId: selectedId ?? '', resultCount }, null, 2)}
    </pre>
  )
}

export default function CmdkExample({ level }: { level: Level }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [lastAction, setLastAction] = useState('尚未执行命令')
  const [article, setArticle] = useState(INITIAL_ARTICLE)
  const ime = useRef(createImeGuard())
  const trigger = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const wasOpen = useRef(false)
  const advanced = level === 'advanced'
  const visibleActions = ACTIONS.filter((action) => level !== 'basic' || action.group === '阅读')

  // biome-ignore lint/correctness/useExhaustiveDependencies: switching a scene resets its article and interaction state
  useEffect(() => {
    setArticle(INITIAL_ARTICLE)
    setQuery('')
    setLastAction('尚未执行命令')
    setOpen(false)
    ime.current.clear()
    returnFocus.current = null
  }, [level])

  const openPalette = useCallback(() => {
    const active = document.activeElement
    returnFocus.current =
      active instanceof HTMLElement && active !== document.body ? active : trigger.current
    ime.current.clear()
    setOpen(true)
  }, [])

  useEffect(() => {
    if (!advanced) {
      wasOpen.current = false
      return
    }
    if (open) {
      wasOpen.current = true
      return
    }
    if (!wasOpen.current) return
    wasOpen.current = false
    // Radix FocusScope schedules close autofocus at 0ms. This parent effect runs after
    // the removed scope cleanup. Only restore an otherwise abandoned focus, never another owner.
    const timer = window.setTimeout(() => {
      const active = document.activeElement
      const target = returnFocus.current
      if ((active === document.body || !active?.isConnected) && target?.isConnected) target.focus()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [advanced, open])

  useEffect(() => {
    if (!advanced) return
    const handleKey = (event: KeyboardEvent) => {
      const element = event.target
      const editable =
        element instanceof HTMLElement &&
        (element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName))
      if (ime.current.isComposing() || !ownsPaletteShortcut(event, editable, open)) return
      const toggle = shouldTogglePalette(event, editable, open)
      event.preventDefault()
      if (!toggle) return // Consume our repeated shortcut without toggling or opening browser search.
      if (open) setOpen(false)
      else openPalette()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [advanced, open, openPalette])

  function select(action: Action) {
    const actionId = action.id
    if (ime.current.isComposing() || !action.enabled || actionId === 'delete') return
    setArticle((current) => applyDemoAction(current, actionId))
    setLastAction(`${action.label}：已更新下方本地演示数据`)
    setQuery('')
    if (advanced) setOpen(false)
  }

  const commandContent = (
    <>
      <Command.Input
        value={query}
        onValueChange={setQuery}
        onCompositionStart={() => ime.current.start()}
        onCompositionEnd={() => ime.current.end()}
        onKeyDownCapture={(event) => {
          if (ime.current.suppress(event.nativeEvent)) {
            event.preventDefault()
            event.stopPropagation()
          }
        }}
        onKeyUpCapture={(event) => ime.current.release(event.key)}
        onBlur={() => ime.current.clear()}
        placeholder="搜索命令或快捷词"
      />
      <Command.List label="命令候选">
        <Command.Empty>没有匹配命令，试试“阅读”或“刷新”。</Command.Empty>
        {(['阅读', '管理'] as const)
          .filter((group) => visibleActions.some((action) => action.group === group))
          .map((group) => (
            <Command.Group key={group} heading={group}>
              {visibleActions
                .filter((action) => action.group === group)
                .map((action) => (
                  <Command.Item
                    key={action.id}
                    value={action.id}
                    keywords={[action.label, ...action.keywords]}
                    aria-label={action.label}
                    aria-describedby={`${id}-${action.id}-description`}
                    disabled={!action.enabled}
                    onSelect={() => select(action)}
                  >
                    <span>{action.label}</span>
                    <small id={`${id}-${action.id}-description`}>{action.description}</small>
                  </Command.Item>
                ))}
            </Command.Group>
          ))}
      </Command.List>
      <p className="rl-cmdk-hint">方向键选择 · Enter 执行 · 输入法候选确认不执行命令</p>
      <CommandStateReadout />
      {advanced && (
        <button
          type="button"
          className="rl-cmdk-close"
          onKeyDown={(event) => {
            // Keep activation/navigation from reaching cmdk, while the palette
            // shortcut, Escape and Tab still reach their respective owners.
            if (['Enter', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key))
              event.stopPropagation()
          }}
          onClick={() => setOpen(false)}
        >
          关闭命令面板
        </button>
      )}
    </>
  )

  return (
    <section
      aria-label="cmdk 真实命令面板"
      className="rl-cmdk-workshop"
      data-testid="b18-workshop"
      data-level={level}
      data-open={open}
    >
      <h2>
        {level === 'basic'
          ? '可键盘选择的命令'
          : level === 'business'
            ? '新闻工作台命令'
            : '带快捷键的命令对话框'}
      </h2>
      <p>cmdk负责真实筛选、排序与高亮选择；下方是本地文章fixture，不访问用户数据或远程服务。</p>
      {advanced ? (
        <>
          <label className="rl-cmdk-outside">
            面板外编辑框
            <input aria-label="面板外编辑框" placeholder="在这里按 Ctrl/Cmd+K 应继续编辑" />
          </label>
          <button
            type="button"
            ref={trigger}
            onClick={openPalette}
            aria-haspopup="dialog"
            aria-expanded={open}
          >
            打开命令面板（Ctrl/Cmd+K）
          </button>
          <Command.Dialog
            className="rl-cmdk"
            contentClassName="rl-cmdk-dialog"
            overlayClassName="rl-cmdk-overlay"
            open={open}
            onOpenChange={setOpen}
            label="本示例的命令搜索"
            vimBindings={false}
          >
            {commandContent}
          </Command.Dialog>
        </>
      ) : (
        <Command className="rl-cmdk" label="当前示例的命令搜索">
          {commandContent}
        </Command>
      )}
      <p role="status" data-testid="b18-status">
        当前动作：{lastAction}
      </p>
      <section className="rl-cmdk-article" aria-label="本地文章操作结果" data-testid="b18-article">
        <p>新闻文章：前端工程资讯（本地fixture）</p>
        <p>
          稍后阅读：{article.saved ? '已加入' : '未加入'}；阅读状态：
          {article.read ? '已读' : '未读'}；本地刷新次数：{article.refreshCount}
        </p>
        <p>生成的引用：{article.citation ?? '尚未生成'}</p>
      </section>
      <p className="rl-cmdk-note">
        读数来自实际useCommandState；selectedId是当前高亮身份，不是最后执行结果。高级层的热键/IME/焦点归还由应用管理，离开时清理；引用与刷新不使用剪贴板或网络。
      </p>
    </section>
  )
}
