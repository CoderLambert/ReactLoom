import {useId, useLayoutEffect, useReducer, useRef, useState} from 'react';
import {AnimatePresence, motion, useReducedMotion} from 'motion/react';
import {initialTaskState, MAX_TASKS, reduceTasks} from './task-history';

type Level = 'basic' | 'business' | 'advanced';

export default function MotionMigrationExample({level}: {level: Level}) {
  const reduced = Boolean(useReducedMotion());
  const [open, setOpen] = useState(true);
  const [state, dispatch] = useReducer(reduceTasks, initialTaskState());
  const detailsId = useId();
  const addButton = useRef<HTMLButtonElement>(null);
  const taskButtons = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef<string | null>(null);
  useLayoutEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    (taskButtons.current.get(target) ?? addButton.current)?.focus();
  }, [state.items]);

  function remove(id: string, button: HTMLButtonElement) {
    if (document.activeElement === button) {
      const index = state.items.findIndex(item => item.id === id);
      pendingFocus.current = state.items[index + 1]?.id ?? state.items[index - 1]?.id ?? 'add';
    }
    dispatch({type: 'remove', id});
  }

  const transition = reduced ? {duration: 0} : {type: 'spring' as const, stiffness: 260, damping: 25};
  return <section aria-label="react-motion现代迁移示例">
    <h2>{level === 'basic' ? '旧Motion.spring迁移' : level === 'business' ? 'TransitionMotion列表迁移' : '动画退出、系统偏好和撤销'}</h2>
    <p>运行维护中的 <code>motion/react</code>。旧react-motion只作为迁移背景，不安装旧Runtime。</p>
    <button type="button" aria-controls={detailsId} aria-expanded={open} onClick={() => setOpen(value => !value)}>
      {open ? '折叠卡片' : '展开卡片'}
    </button>
    <AnimatePresence initial={false}>
      {open && <motion.div id={detailsId} key="details" initial={{opacity: 0, y: reduced ? 0 : -12}}
        animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: reduced ? 0 : -12}} transition={transition}
        style={{border: '1px solid #bfd0c1', padding: 16, borderRadius: 8, margin: '12px 0'}}>
        从旧数值插值迁移到业务状态目标动画；帧更新交给Motion。
      </motion.div>}
    </AnimatePresence>
    {level !== 'basic' && <>
      <div className="demo-controls">
        <button ref={addButton} type="button" disabled={state.items.length >= MAX_TASKS}
          onClick={() => dispatch({type: 'add'})}>添加任务（最多{MAX_TASKS}）</button>
        {level === 'advanced' && <button type="button" disabled={!state.undo}
          onClick={() => dispatch({type: 'undo'})}>撤销上一步</button>}
      </div>
      <ul style={{listStyle: 'none', padding: 0}}>
        <AnimatePresence mode="popLayout" initial={false}>
          {state.items.map(item => <motion.li layout={!reduced} key={item.id}
            initial={{opacity: 0, scale: reduced ? 1 : 0.93}} animate={{opacity: 1, scale: 1}}
            exit={{opacity: 0, scale: reduced ? 1 : 0.93}} transition={transition}
            style={{display: 'flex', gap: 12, alignItems: 'center', padding: 10, marginBottom: 8,
              border: '1px solid #d6ddd5', borderRadius: 8}}>
            <button type="button" aria-pressed={state.selected === item.id}
              ref={node => {if (node) taskButtons.current.set(item.id, node); else taskButtons.current.delete(item.id);}}
              onClick={() => dispatch({type: 'select', id: item.id})}>{item.text}</button>
            <button type="button" aria-label={'删除 ' + item.text}
              onClick={event => remove(item.id, event.currentTarget)}>删除</button>
          </motion.li>)}
        </AnimatePresence>
      </ul>
    </>}
    <p role="status">选中：{state.items.find(item => item.id === state.selected)?.text ?? '无'}；
      项目：{state.items.length}；减少动画：{reduced ? '已启用' : '未启用'}。</p>
    <p>添加/删除/撤销是同一个Reducer事务，ID单调增长；删除已聚焦按钮后恢复邻近任务或添加按钮焦点。</p>
  </section>;
}
