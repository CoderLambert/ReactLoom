import {
  autoUpdate,
  FloatingFocusManager,
  FloatingPortal,
  type Placement,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  ARTICLE_TITLES,
  type ArticleActionState,
  filterArticleTitles,
  toggleArticleAction,
} from './business-policy'
import { createImeGuard } from './ime-guard'
import { createPositionMiddleware } from './positioning'
import './workshop.css'

type Level = 'basic' | 'business' | 'advanced'
type Anchor = 'top-left' | 'bottom-right'

export default function FloatingExample({ level }: { level: Level }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState('未选择')
  const [query, setQuery] = useState('')
  const [clipboardError, setClipboardError] = useState('')
  const [article, setArticle] = useState<ArticleActionState>({ saved: false, read: false })
  const [appliedQuery, setAppliedQuery] = useState('')
  const [preferred, setPreferred] = useState<Placement>('bottom-start')
  const [anchor, setAnchor] = useState<Anchor>('top-left')
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null)
  const [outsideActions, setOutsideActions] = useState(0)
  const subscriptions = useRef({ active: 0, started: 0, cleaned: 0 })
  const [lifecycle, setLifecycle] = useState(subscriptions.current)
  const clipboardRequest = useRef(0)
  const imeGuard = useRef(createImeGuard())
  const previousLevel = useRef(level)
  const id = useId()
  const filteredArticles = filterArticleTitles(ARTICLE_TITLES, appliedQuery)

  // Revoke clipboard ownership synchronously, before dismissal effects can run.
  const setPopoverOpen = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      ++clipboardRequest.current
      setClipboardError('')
      imeGuard.current.reset()
    }
    setOpen(nextOpen)
  }, [])
  useEffect(
    () => () => {
      ++clipboardRequest.current
    },
    [],
  )
  useEffect(() => {
    if (previousLevel.current === level) return
    previousLevel.current = level
    setPopoverOpen(false)
  }, [level, setPopoverOpen])

  // These counts observe actual SDK subscriptions and their real cleanup, not open state.
  const trackAutoUpdate = useCallback<typeof autoUpdate>((reference, floating, update) => {
    const cleanup = autoUpdate(reference, floating, update)
    subscriptions.current = {
      ...subscriptions.current,
      active: subscriptions.current.active + 1,
      started: subscriptions.current.started + 1,
    }
    setLifecycle(subscriptions.current)
    let cleaned = false
    return () => {
      if (cleaned) return
      cleaned = true
      cleanup()
      subscriptions.current = {
        ...subscriptions.current,
        active: subscriptions.current.active - 1,
        cleaned: subscriptions.current.cleaned + 1,
      }
      setLifecycle(subscriptions.current)
    }
  }, [])
  const requestedPlacement =
    level === 'basic' ? preferred : level === 'advanced' ? 'top-start' : 'bottom-start'
  const middleware = useMemo(
    () => createPositionMiddleware(level === 'basic' ? (boundary ?? undefined) : undefined),
    [level, boundary],
  )
  const {
    refs,
    floatingStyles,
    context,
    placement,
    x,
    y,
    strategy,
    isPositioned,
    middlewareData,
    update,
  } = useFloating({
    open,
    onOpenChange: setPopoverOpen,
    placement: requestedPlacement,
    middleware,
    // The reference stays mounted; only the open floating element is conditionally rendered.
    whileElementsMounted: trackAutoUpdate,
  })
  // A deliberate application layout change is also an explicit positioning input.
  // biome-ignore lint/correctness/useExhaustiveDependencies: anchor moves the reference DOM after render, requiring a fresh calculation.
  useEffect(() => {
    if (open) update()
  }, [open, anchor, update])
  const click = useClick(context)
  const dismiss = useDismiss(context, { escapeKey: true, outsidePress: true })
  const role = useRole(context, { role: 'dialog' })
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role])
  const choose = (value: string) => {
    setSelected(value)
    setPopoverOpen(false)
  }
  const actOnArticle = (kind: 'saved' | 'read') => {
    setArticle((previous) => toggleArticleAction(previous, kind))
    choose(kind === 'saved' ? '稍后阅读状态已变更' : '已读状态已变更')
  }
  const applyFilter = () => {
    const nextQuery = query.trim()
    setAppliedQuery(nextQuery)
    choose(nextQuery ? `已应用过滤：${nextQuery}` : '已清空过滤')
  }
  async function copyCitation() {
    const request = ++clipboardRequest.current
    setClipboardError('')
    try {
      if (!navigator.clipboard?.writeText) throw new Error('当前环境不提供剪贴板写入能力')
      await navigator.clipboard.writeText(
        'ReactLoom Library Lab / Floating UI 示例新闻引用（本地教学数据）',
      )
      if (request === clipboardRequest.current) choose('已复制示例引用')
    } catch {
      if (request === clipboardRequest.current)
        setClipboardError('复制未成功：请检查 HTTPS 安全上下文和剪贴板权限。')
    }
  }
  const positionSnapshot = {
    requestedPlacement,
    resolvedPlacement: placement,
    x,
    y,
    strategy,
    isPositioned,
    shift: middlewareData.shift ?? null,
    boundary: level === 'basic' ? 'local element + viewport' : 'viewport/clipping ancestors',
  }

  return (
    <section
      className="b17-workshop"
      aria-label="Floating UI 真实交互示例"
      data-testid="b17-workshop"
    >
      <h2>
        {level === 'basic'
          ? '位置输入、翻转与平移'
          : level === 'business'
            ? '新闻操作 Popover'
            : '滚动定位、键盘和输入法'}
      </h2>
      <p>
        真实Floating
        UI组合定位与交互。Escape或内部确认关闭后交还触发器焦点；非模态Tab离开或点到外部控件时，尊重新的焦点目标。
      </p>
      {level === 'basic' && (
        <p>
          虚线框是本实验明确设置的碰撞边界，外层视口仍参与裁剪。打开后把锚点移到右下，比较首选方向与SDK实际结果。
        </p>
      )}
      <div ref={setBoundary} className={`b17-stage b17-stage-${level}`} data-testid="b17-boundary">
        {level === 'advanced' && (
          <p>此容器独立滚动。浮层在Portal中，滚动锚点时由autoUpdate重新计算。</p>
        )}
        <div
          className={
            level === 'basic'
              ? `b17-anchor b17-anchor-${anchor}`
              : level === 'advanced'
                ? 'b17-scroll-anchor'
                : undefined
          }
        >
          <button
            ref={refs.setReference}
            type="button"
            {...getReferenceProps()}
            aria-haspopup="dialog"
            aria-controls={open ? id : undefined}
            aria-expanded={open}
            data-testid="b17-trigger"
          >
            {level === 'basic'
              ? '打开详情'
              : level === 'business'
                ? '新闻操作 ▾'
                : '编辑过滤条件 ▾'}
          </button>
        </div>
        {level === 'advanced' && <div className="b17-scroll-space" aria-hidden="true" />}
      </div>
      <p role="status">
        当前选择：{selected}；定位策略：{placement}
      </p>
      <p
        data-testid="b17-lifecycle"
        data-active={lifecycle.active}
        data-started={lifecycle.started}
        data-cleaned={lifecycle.cleaned}
      >
        autoUpdate实际订阅：{lifecycle.active}；建立 {lifecycle.started} 次，清理{' '}
        {lifecycle.cleaned} 次
      </p>
      {level === 'business' && (
        <p aria-live="polite">
          本地文章状态：{article.saved ? '已稍后阅读' : '未收藏'} · {article.read ? '已读' : '未读'}
        </p>
      )}
      {level === 'advanced' && (
        <div aria-live="polite">
          <p>本地筛选结果（{filteredArticles.length} 项）</p>
          <ul>
            {filteredArticles.map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>
        </div>
      )}
      <details>
        <summary>查看真实定位结果</summary>
        <pre data-testid="b17-position">{JSON.stringify(positionSnapshot, null, 2)}</pre>
      </details>
      {open && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false} returnFocus>
            <div
              id={id}
              ref={refs.setFloating}
              className={`b17-dialog b17-dialog-${level}`}
              style={floatingStyles}
              {...getFloatingProps()}
              role="dialog"
              aria-label={level === 'advanced' ? '过滤条件' : '文章浮层'}
              data-testid="b17-dialog"
              data-placement={placement}
              data-positioned={isPositioned}
            >
              {level === 'basic' ? (
                <>
                  <strong>按锚点定位的真实 Popover</strong>
                  <p>offset 10px；flip换边；shift平移。结果来自SDK。</p>
                  <label>
                    首选方向
                    <select
                      aria-label="首选方向"
                      value={preferred}
                      onChange={(event) =>
                        setPreferred(
                          event.target.value === 'top-start' ? 'top-start' : 'bottom-start',
                        )
                      }
                    >
                      <option value="bottom-start">bottom-start</option>
                      <option value="top-start">top-start</option>
                    </select>
                  </label>
                  <label>
                    锚点位置
                    <select
                      aria-label="锚点位置"
                      value={anchor}
                      onChange={(event) =>
                        setAnchor(
                          event.target.value === 'bottom-right' ? 'bottom-right' : 'top-left',
                        )
                      }
                    >
                      <option value="top-left">左上</option>
                      <option value="bottom-right">右下</option>
                    </select>
                  </label>
                  <button type="button" onClick={() => choose('已查看')}>
                    确认并关闭
                  </button>
                </>
              ) : level === 'business' ? (
                <>
                  <strong>文章操作</strong>
                  <div className="b17-actions">
                    <button type="button" onClick={() => actOnArticle('saved')}>
                      {article.saved ? '移出稍后阅读' : '加入稍后阅读'}
                    </button>
                    <button type="button" onClick={() => actOnArticle('read')}>
                      {article.read ? '标记未读' : '标记已读'}
                    </button>
                    <button type="button" onClick={() => void copyCitation()}>
                      复制示例引用到剪贴板
                    </button>
                    {clipboardError && <p role="alert">{clipboardError}</p>}
                    <button type="button" onClick={() => setPopoverOpen(false)}>
                      关闭文章浮层
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <strong>搜索范围</strong>
                  <label htmlFor={`${id}-query`}>筛选关键词</label>
                  <input
                    id={`${id}-query`}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onCompositionStart={() => imeGuard.current.compositionStart()}
                    onCompositionEnd={() => imeGuard.current.compositionEnd()}
                    onKeyDown={(event) => {
                      if (
                        imeGuard.current.shouldApply({
                          key: event.key,
                          nativeComposing: event.nativeEvent.isComposing,
                          legacyKeyCode: event.nativeEvent.keyCode,
                        })
                      ) {
                        event.preventDefault()
                        applyFilter()
                      }
                    }}
                    onKeyUp={(event) =>
                      imeGuard.current.keyUp({
                        key: event.key,
                        nativeComposing: event.nativeEvent.isComposing,
                      })
                    }
                    onBlur={() => imeGuard.current.blur()}
                    placeholder="支持中文输入法"
                  />
                  <p>
                    合成中、229及结束后80ms保护窗不提交；Space抬键或后续普通字符清除保护，之后可Enter或点击确认。
                  </p>
                  <button type="button" onClick={applyFilter}>
                    应用过滤
                  </button>
                </>
              )}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
      <button
        type="button"
        data-testid="b17-outside"
        onClick={() => setOutsideActions((value) => value + 1)}
      >
        浮层外的下一步
      </button>
      <p>本地外部操作：{outsideActions} 次。Tab可离开非模态浮层，焦点不会被强行拉回。</p>
    </section>
  )
}
