import { AnimatePresence, MotionConfig } from 'motion/react'
import { useCallback, useId, useLayoutEffect, useReducer, useRef, useState } from 'react'
import { DetailsCard, TaskRow } from './presence-items'
import { ReducedMotionContext, useLiveReducedMotion } from './reduced-motion'
import { initialTaskState, MAX_TASKS, reduceTasks } from './task-history'
import './migration.css'

type Level = 'basic' | 'business' | 'advanced'

export default function MotionMigrationExample({ level }: { level: Level }) {
  const reduced = useLiveReducedMotion()
  const [open, setOpen] = useState(true)
  const [state, dispatch] = useReducer(reduceTasks, undefined, initialTaskState)
  const [exits, setExits] = useState(0)
  const detailsId = useId()
  const addButton = useRef<HTMLButtonElement>(null)
  const taskButtons = useRef(new Map<string, HTMLButtonElement>())
  const committedItems = useRef(state.items)
  const pendingFocus = useRef<string | null>(null)

  useLayoutEffect(() => {
    committedItems.current = state.items
    const target = pendingFocus.current
    if (!target) return
    pendingFocus.current = null
    const liveTarget = state.items.some((item) => item.id === target)
      ? taskButtons.current.get(target)
      : undefined
    ;(liveTarget ?? addButton.current)?.focus()
  }, [state.items])

  const register = useCallback((id: string, node: HTMLButtonElement | null) => {
    if (node) taskButtons.current.set(id, node)
    else taskButtons.current.delete(id)
  }, [])

  function remove(id: string, button: HTMLButtonElement) {
    // Exiting children can retain old props; committed membership owns the action.
    const current = committedItems.current
    const index = current.findIndex((item) => item.id === id)
    if (index < 0) return
    if (document.activeElement === button) {
      pendingFocus.current = current[index + 1]?.id ?? current[index - 1]?.id ?? 'add'
    }
    dispatch({ type: 'remove', id })
  }

  function select(id: string) {
    if (committedItems.current.some((item) => item.id === id)) dispatch({ type: 'select', id })
  }

  return (
    <ReducedMotionContext.Provider value={reduced}>
      {/* SDK14.6 snapshots its own media policy; all visual decisions here explicitly follow our live OS policy. */}
      <MotionConfig reducedMotion="never">
        <section
          aria-label="react-motion 现代迁移示例"
          className="b21-workshop"
          data-testid="b21-workshop"
          data-level={level}
          data-reduced={reduced}
          data-order={state.items.map((item) => item.id).join(',')}
        >
          <h2>
            {level === 'basic'
              ? 'Motion + spring 到状态目标'
              : level === 'business'
                ? 'TransitionMotion 到稳定身份列表'
                : '原子撤销、焦点与实时减动'}
          </h2>
          <p>
            实际运行 motion/react 14.6.0。旧 react-motion
            仅是固定官方资料中的迁移背景，没有安装或运行旧 SDK。
          </p>
          <p role="status" data-testid="b21-reduced">
            系统减少动画：{reduced ? '已启用；位移/缩放/布局动画关闭，时长0' : '未启用'}
          </p>
          {level === 'basic' ? (
            <>
              <button
                type="button"
                aria-controls={detailsId}
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
              >
                {open ? '折叠卡片' : '展开卡片'}
              </button>
              <p data-testid="b21-open">业务 open：{String(open)}</p>
              <AnimatePresence
                initial={false}
                onExitComplete={() => setExits((value) => value + 1)}
              >
                {open && <DetailsCard id={detailsId} key="details" />}
              </AnimatePresence>
            </>
          ) : (
            <>
              <div className="b21-controls">
                <button
                  ref={addButton}
                  type="button"
                  disabled={state.items.length >= MAX_TASKS}
                  onClick={() => dispatch({ type: 'add' })}
                >
                  添加任务（最多{MAX_TASKS}）
                </button>
                {level === 'advanced' && (
                  <button
                    type="button"
                    disabled={!state.undo}
                    onClick={() => dispatch({ type: 'undo' })}
                  >
                    撤销上一步
                  </button>
                )}
              </div>
              <ul className="b21-tasks" aria-label="迁移后的任务列表">
                <AnimatePresence
                  mode="popLayout"
                  initial={false}
                  onExitComplete={() => setExits((value) => value + 1)}
                >
                  {state.items.map((item) => (
                    <TaskRow
                      key={item.id}
                      task={item}
                      selected={state.selected === item.id}
                      register={register}
                      onSelect={select}
                      onRemove={remove}
                    />
                  ))}
                </AnimatePresence>
              </ul>
              {state.items.length === 0 && (
                <p data-testid="b21-empty">任务已全部删除，可继续添加。</p>
              )}
              <p role="status" data-testid="b21-tasks-status">
                选中：{state.items.find((item) => item.id === state.selected)?.text ?? '无'}；项目：
                {state.items.length}。
              </p>
              <details>
                <summary>查看业务事务快照</summary>
                <pre data-testid="b21-state">{JSON.stringify(state, null, 2)}</pre>
              </details>
            </>
          )}
          <p data-testid="b21-exits">
            现代 SDK onExitComplete：{exits} 次；这是视觉完成计数，不是业务提交次数。
          </p>
          <p>
            业务先提交，SDK退出期DOM可以暂留；useIsPresent=false时它已inert/aria-hidden且按钮禁用。只有被删按钮原本持焦时，在提交后回到存活邻居或添加按钮。停止/离开卸载整棵子树，不等待退场动画。
          </p>
        </section>
      </MotionConfig>
    </ReducedMotionContext.Provider>
  )
}
