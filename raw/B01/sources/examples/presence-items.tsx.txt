import { motion, useIsPresent, usePresenceData } from 'motion/react'
import { useContext } from 'react'
import { ReducedMotionContext } from './reduced-motion'

export type Card = { id: number; title: string; description: string }
function useVisualPolicy() {
  const present = useIsPresent()
  // Native React context remains reactive even for a subtree retained for exit.
  const reduced = useContext(ReducedMotionContext)
  const sdkCustom = Boolean(usePresenceData())
  return {
    present,
    reduced,
    sdkCustom,
    enter: reduced ? (false as const) : { opacity: 0, y: 14 },
    leave: reduced ? { opacity: 0, y: 0 } : { opacity: 0, y: -10 },
    transition: { duration: reduced ? 0 : 0.24 },
  }
}
export function Notice() {
  const visual = useVisualPolicy()
  return (
    <motion.article
      data-testid="b01-notice"
      data-present={visual.present}
      data-sdk-reduced={visual.sdkCustom}
      aria-hidden={!visual.present}
      inert={!visual.present}
      initial={visual.enter}
      animate={{ opacity: 1, y: 0 }}
      exit={visual.leave}
      transition={visual.transition}
      className="b01-card"
    >
      <strong>状态变化时平滑过渡</strong>
      <p>业务visible先改变；真实useIsPresent显示退出状态，AnimatePresence等待exit完成再移除DOM。</p>
      <small>真实presence：{visual.present ? 'present' : 'exiting'}</small>
    </motion.article>
  )
}
export function PresenceRow({
  card,
  onRemove,
}: {
  card: Card
  onRemove: (id: number, button: HTMLButtonElement) => void
}) {
  const visual = useVisualPolicy()
  return (
    <motion.li
      data-card-id={card.id}
      data-present={visual.present}
      data-sdk-reduced={visual.sdkCustom}
      aria-hidden={!visual.present}
      inert={!visual.present}
      layout={!visual.reduced}
      initial={visual.enter}
      animate={{ opacity: 1, y: 0 }}
      exit={visual.leave}
      transition={visual.transition}
      className="b01-card b01-row"
    >
      <div>
        <strong>{card.title}</strong>
        <p>{card.description}</p>
        <small>
          id {card.id}；真实presence：{visual.present ? 'present' : 'exiting'}
        </small>
      </div>
      <button
        type="button"
        disabled={!visual.present}
        aria-label={`归档 ${card.title}`}
        onClick={(event) => onRemove(card.id, event.currentTarget)}
      >
        归档
      </button>
    </motion.li>
  )
}
