import { motion, useIsPresent } from 'motion/react'
import { forwardRef, useContext } from 'react'
import { ReducedMotionContext } from './reduced-motion'
import type { Task } from './task-history'

export function DetailsCard({ id }: { id: string }) {
  const present = useIsPresent()
  const reduced = useContext(ReducedMotionContext)
  return (
    <motion.div
      id={id}
      data-testid="b21-details"
      data-present={present}
      aria-hidden={!present || undefined}
      inert={!present}
      initial={{ opacity: 0, y: reduced ? 0 : -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduced ? 0 : -12 }}
      transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 25 }}
      className="b21-details"
    >
      从旧数值插值迁移到业务状态目标动画；帧更新交给现代 Motion。
    </motion.div>
  )
}

type RowProps = {
  task: Task
  selected: boolean
  register: (id: string, node: HTMLButtonElement | null) => void
  onSelect: (id: string) => void
  onRemove: (id: string, button: HTMLButtonElement) => void
}

// popLayout measures its immediate child: pass the SDK's ref to the real li.
export const TaskRow = forwardRef<HTMLLIElement, RowProps>(function TaskRow(
  { task, selected, register, onSelect, onRemove },
  ref,
) {
  const present = useIsPresent()
  const reduced = useContext(ReducedMotionContext)
  return (
    <motion.li
      ref={ref}
      layout={!reduced}
      data-task-id={task.id}
      data-present={present}
      aria-hidden={!present || undefined}
      inert={!present}
      initial={{ opacity: 0, scale: reduced ? 1 : 0.93 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: reduced ? 1 : 0.93 }}
      transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 25 }}
      className="b21-task"
    >
      <button
        type="button"
        disabled={!present}
        aria-pressed={selected}
        ref={(node) => register(task.id, node)}
        onClick={() => {
          if (present) onSelect(task.id)
        }}
      >
        {task.text}
      </button>
      <button
        type="button"
        disabled={!present}
        aria-label={`删除 ${task.text}`}
        onClick={(event) => {
          if (present) onRemove(task.id, event.currentTarget)
        }}
      >
        删除
      </button>
    </motion.li>
  )
})
