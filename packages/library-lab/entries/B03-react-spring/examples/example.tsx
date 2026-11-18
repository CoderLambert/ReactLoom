import { animated, useSpring, useTransition } from '@react-spring/web'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  appendUniqueArticle,
  focusDestinationAfterRemoval,
  MAX_SPRING_ARTICLES,
} from './article-policy'
import './styles.css'

type Level = 'basic' | 'business' | 'advanced'
type Article = { id: string; title: string }
const seed: Article[] = [
  { id: 'rss-1', title: 'React 性能优化实践' },
  { id: 'rss-2', title: 'TypeScript 状态建模' },
]

function useLocalReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export default function SpringExample({ level }: { level: Level }) {
  const systemReduced = useLocalReducedMotion()
  const [localReduced, setLocalReduced] = useState(false)
  // A local opt-in can reduce movement; it never overrides an enabled system preference.
  const reduced = systemReduced || localReduced
  const [expanded, setExpanded] = useState(true)
  const [articles, setArticles] = useState<Article[]>(seed)
  const nextId = useRef(3)
  const addRef = useRef<HTMLButtonElement | null>(null)
  const resetRef = useRef<HTMLButtonElement | null>(null)
  const focusAfterRemoval = useRef<'none' | 'add' | 'reset'>('none')
  const activeIds = new Set(articles.map((article) => article.id))

  // Wait for the commit that removes the focused action and re-enables Add at capacity.
  useLayoutEffect(() => {
    const destination = focusAfterRemoval.current
    if (destination === 'none') return
    focusAfterRemoval.current = 'none'
    const requested = destination === 'add' ? addRef.current : resetRef.current
    const target = requested && !requested.disabled ? requested : resetRef.current
    if (target?.isConnected && !target.disabled) target.focus()
  })

  const style = useSpring({
    opacity: expanded ? 1 : 0.45,
    transform: expanded ? 'translateY(0px)' : 'translateY(18px)',
    immediate: reduced,
    config: { tension: 240, friction: 28 },
  })
  const transitions = useTransition(articles, {
    keys: (item) => item.id,
    from: { opacity: 0, transform: 'translateX(22px)' },
    enter: { opacity: 1, transform: 'translateX(0px)' },
    leave: { opacity: 0, transform: 'translateX(-22px)' },
    immediate: reduced,
    config: { tension: 240, friction: 28 },
  })

  function addArticle() {
    if (articles.length >= MAX_SPRING_ARTICLES) return
    const id = nextId.current++
    setArticles((old) =>
      appendUniqueArticle(old, { id: `rss-${id}`, title: `新增订阅内容 #${id}` }),
    )
  }
  function removeArticle(id: string, button: HTMLButtonElement) {
    if (!activeIds.has(id)) return
    focusAfterRemoval.current = focusDestinationAfterRemoval(
      document.activeElement === button,
      articles.length - 1,
    )
    setArticles((old) => old.filter((item) => item.id !== id))
  }

  return (
    <section
      className="b03-workshop"
      aria-label="React Spring 实际动画实验"
      data-testid="b03-workshop"
      data-reduced={reduced}
      data-system-reduced={systemReduced}
      data-count={articles.length}
    >
      <h2>
        {level === 'basic'
          ? '状态目标与弹簧卡片'
          : level === 'business'
            ? '逻辑删除与安全离场'
            : '局部偏好与容量边界焦点'}
      </h2>
      <p>
        真实 @react-spring/web，本地新闻 fixture。系统减少动画：
        <strong>{systemReduced ? '开启' : '关闭'}</strong>；本例有效策略：
        <output data-testid="b03-motion">{reduced ? '立即到终态' : '弹簧过渡'}</output>。
      </p>
      {level === 'advanced' && (
        <label>
          <input
            type="checkbox"
            checked={localReduced}
            onChange={(event) => setLocalReduced(event.target.checked)}
          />
          仅本例减少动画
        </label>
      )}
      <div className="b03-controls">
        <button
          type="button"
          onClick={() => setExpanded((old) => !old)}
          aria-pressed={expanded}
          data-testid="b03-toggle"
        >
          {expanded ? '收起视觉强调' : '展开视觉强调'}
        </button>
        <output>目标：{expanded ? '强调' : '淡化'}</output>
      </div>
      <animated.div className="b03-card" style={style} data-testid="b03-card">
        <strong>今日开发精选</strong>
        <p>布尔状态给出目标，SpringValue 把当前值写到 DOM。收起只淡化和位移，不隐藏内容。</p>
      </animated.div>
      {level !== 'basic' && (
        <>
          <h3>同源数组与带稳定身份的进出场</h3>
          <div className="b03-controls">
            <button
              ref={addRef}
              type="button"
              disabled={articles.length >= MAX_SPRING_ARTICLES}
              onClick={addArticle}
            >
              添加一条新闻（上限 {MAX_SPRING_ARTICLES}）
            </button>
            <button
              ref={resetRef}
              type="button"
              onClick={() => {
                focusAfterRemoval.current = 'none'
                setArticles(seed)
              }}
            >
              恢复默认数据
            </button>
          </div>
          <p role="status" data-testid="b03-list-status">
            逻辑上存在 {articles.length} 条；离场视觉节点由 SDK 在动画结束后卸载。
          </p>
          <p>
            当前业务 ID：
            <output data-testid="b03-authority">
              {articles.map((item) => item.id).join(', ')}
            </output>
          </p>
          <div className="b03-list" data-testid="b03-list">
            {transitions((animatedStyle, item, transition) => {
              // Membership comes from the authoritative array, not delayed animation callbacks.
              const active = activeIds.has(item.id)
              return (
                <animated.article
                  className="b03-article"
                  style={animatedStyle}
                  data-article-id={item.id}
                  data-active={active}
                  data-phase={transition.phase}
                  aria-hidden={active ? undefined : true}
                  inert={!active}
                >
                  <span>{item.title}</span>
                  {active && (
                    <button
                      type="button"
                      onClick={(event) => removeArticle(item.id, event.currentTarget)}
                      aria-label={`移除 ${item.title}`}
                    >
                      移除
                    </button>
                  )}
                </animated.article>
              )
            })}
          </div>
        </>
      )}
      {level === 'advanced' && (
        <p>
          本地开关不修改系统偏好或全局
          Globals。用键盘删除持焦新闻按钮，提交后焦点移至已可用的“添加”；
          未持焦删除不抢焦点。填满12条再删除也适用，恢复默认不会回退新增ID计数器。
        </p>
      )}
    </section>
  )
}
