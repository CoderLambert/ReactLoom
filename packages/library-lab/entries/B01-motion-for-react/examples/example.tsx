import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useLayoutEffect, useRef, useState } from 'react'
import { appendUniqueCard, archiveCard, MAX_MOTION_CARDS, moveFirstToEnd } from './card-policy'
import { type Card, Notice, PresenceRow } from './presence-items'
import { ReducedMotionContext, useLiveReducedMotion } from './reduced-motion'
import './workshop.css'

type Level = 'basic' | 'business' | 'advanced'
const startingCards: Card[] = [
  { id: 1, title: 'RSS 频道整理', description: '分类和去重后展示订阅内容' },
  { id: 2, title: '业务场景测试', description: '通过可重复的场景验证交互' },
  { id: 3, title: '前端性能复盘', description: '用真实测量替代主观优化' },
]
export default function MotionExample({ level }: { level: Level }) {
  const reduced = useLiveReducedMotion()
  const [visible, setVisible] = useState(true)
  const [cards, setCards] = useState(startingCards)
  const committedCards = useRef(cards)
  const [exits, setExits] = useState(0)
  const nextId = useRef(4)
  const addButton = useRef<HTMLButtonElement>(null)
  const focusAfterRemoval = useRef(false)
  useLayoutEffect(() => {
    committedCards.current = cards
    if (!focusAfterRemoval.current) return
    focusAfterRemoval.current = false
    addButton.current?.focus()
  }, [cards])
  function addCard() {
    if (committedCards.current.length >= MAX_MOTION_CARDS) return
    const candidate = {
      id: nextId.current++,
      title: '新建阅读任务',
      description: '新的列表项通过 AnimatePresence 进入',
    }
    setCards((current) => appendUniqueCard(current, candidate))
  }
  function removeCard(id: number, button: HTMLButtonElement) {
    if (!committedCards.current.some((card) => card.id === id)) return
    if (document.activeElement === button) focusAfterRemoval.current = true
    setCards((current) => archiveCard(current, id))
  }
  return (
    // 14.6.0's SDK preference hook snapshots at mount. This demo owns live media policy:
    // all positional targets, layout flags and durations below explicitly follow reduced.
    <ReducedMotionContext.Provider value={reduced}>
      <MotionConfig reducedMotion="never">
        <section
          className="b01-workshop"
          aria-label="Motion for React 实际动画演示"
          data-testid="b01-workshop"
          data-reduced={reduced}
          data-order={cards.map((card) => card.id).join(',')}
        >
          <h2>
            {level === 'basic'
              ? '进入和离开动画'
              : level === 'business'
                ? '可维护的任务列表过渡'
                : '重排与减少动画偏好'}
          </h2>
          <p>
            真实motion/react与AnimatePresence；任务为本地fixture。业务数组先提交，动画只管理视觉生命周期。
          </p>
          <p role="status" data-testid="b01-reduced">
            系统减少动画偏好：{reduced ? '已开启；移除位移并将时长设为0' : '未开启'}
          </p>
          {level === 'basic' ? (
            <>
              <button
                type="button"
                aria-pressed={visible}
                onClick={() => setVisible((value) => !value)}
              >
                {visible ? '隐藏提示卡片' : '显示提示卡片'}
              </button>
              <p data-testid="b01-visible">业务visible：{String(visible)}</p>
              <div className="b01-notice-slot">
                <AnimatePresence
                  initial={false}
                  custom={reduced}
                  onExitComplete={() => setExits((value) => value + 1)}
                >
                  {visible && <Notice key="notice" />}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <div className="b01-controls">
                <button
                  type="button"
                  ref={addButton}
                  onClick={addCard}
                  disabled={cards.length >= MAX_MOTION_CARDS}
                >
                  添加任务（最多{MAX_MOTION_CARDS}项）
                </button>
                {level === 'advanced' && (
                  <>
                    <button
                      type="button"
                      disabled={cards.length < 2}
                      onClick={() => setCards(moveFirstToEnd)}
                    >
                      把第一项移到最后
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        focusAfterRemoval.current = false
                        setCards(startingCards)
                      }}
                    >
                      恢复初始列表
                    </button>
                  </>
                )}
              </div>
              <p role="status" aria-live="polite" data-testid="b01-count">
                当前任务：{cards.length} 项
              </p>
              {cards.length === 0 && <p data-testid="b01-empty">任务已归档完；可继续添加。</p>}
              <motion.ul layout={!reduced} className="b01-list" data-testid="b01-list">
                <AnimatePresence
                  initial={false}
                  custom={reduced}
                  onExitComplete={() => setExits((value) => value + 1)}
                >
                  {cards.map((card) => (
                    <PresenceRow key={card.id} card={card} onRemove={removeCard} />
                  ))}
                </AnimatePresence>
              </motion.ul>
            </>
          )}
          <p data-testid="b01-exits">
            SDK onExitComplete：{exits} 次（本例回调计数，不是业务提交次数）
          </p>
          <p>
            useIsPresent=false的退出DOM会暂留，但inert/aria-hidden且归档按钮禁用。仅被删按钮原本持焦时，在React提交后回到添加任务；退出结束不决定归档事实。
          </p>
        </section>
      </MotionConfig>
    </ReducedMotionContext.Provider>
  )
}
