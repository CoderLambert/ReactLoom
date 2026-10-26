import {useRef, useState} from 'react';
import {AnimatePresence, MotionConfig, motion, useReducedMotion} from 'motion/react';

type Level = 'basic' | 'business' | 'advanced';
type Card = {id: number; title: string; description: string};
const startingCards: Card[] = [
  {id: 1, title: 'RSS 频道整理', description: '分类和去重后展示订阅内容'},
  {id: 2, title: '业务场景测试', description: '通过可重复的场景验证交互'},
  {id: 3, title: '前端性能复盘', description: '用真实测量替代主观优化'},
];

export default function MotionExample({level}: {level: Level}) {
  const reduced = Boolean(useReducedMotion());
  const [visible, setVisible] = useState(true);
  const [cards, setCards] = useState<Card[]>(startingCards);
  const nextId = useRef(4);
  const addButton = useRef<HTMLButtonElement>(null);

  function addCard() {
    setCards(current => [...current, {id: nextId.current++,
      title: '新建阅读任务', description: '新的列表项通过 AnimatePresence 进入'}]);
  }
  function removeCard(id: number) {
    setCards(current => current.filter(card => card.id !== id));
    // Moving focus away from the removed button prevents a lost keyboard position.
    queueMicrotask(() => addButton.current?.focus());
  }
  const enter = reduced ? false : {opacity: 0, y: 14};
  const leave = reduced ? {opacity: 0} : {opacity: 0, y: -10};
  const transition = {duration: reduced ? 0 : 0.24};

  return <MotionConfig reducedMotion="user">
    <section aria-label="Motion for React 实际动画演示">
      <h2>{level === 'basic' ? '进入和离开动画' :
        level === 'business' ? '可维护的任务列表过渡' : '重排与减少动画偏好'}</h2>
      <p>真正的 motion/react 与 AnimatePresence；交互只操作本地 fixture，不发出请求。</p>
      {level === 'advanced' && <p role="status">系统减少动画偏好：{reduced ? '已开启；移除位移并缩短时长' : '未开启'}</p>}
      {level === 'basic' ? <>
        <button type="button" aria-pressed={visible} onClick={() => setVisible(on => !on)}>
          {visible ? '隐藏提示卡片' : '显示提示卡片'}
        </button>
        <div style={{minHeight: 145, marginTop: 15}}>
          <AnimatePresence initial={false}>
            {visible && <motion.article key="notice" initial={enter}
              animate={{opacity: 1, y: 0}} exit={leave} transition={transition}
              style={{padding: 19, background: '#e4f0e5', borderRadius: 10}}>
              <strong>状态变化时平滑过渡</strong>
              <p>退出阶段由 AnimatePresence 保持元素，待 exit 完成后移除。</p>
            </motion.article>}
          </AnimatePresence>
        </div>
      </> : <>
        <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
          <button type="button" ref={addButton} onClick={addCard}>添加任务</button>
          {level === 'advanced' && <>
            <button type="button" disabled={cards.length < 2}
              onClick={() => setCards(current => current.length < 2 ? current : [...current.slice(1), current[0]])}>
              把第一项移到最后
            </button>
            <button type="button" onClick={() => setCards(startingCards)}>恢复初始列表</button>
          </>}
        </div>
        <p role="status" aria-live="polite" style={{marginTop: 12}}>当前任务：{cards.length} 项</p>
        <motion.ul layout={!reduced} style={{listStyle: 'none', padding: 0, display: 'grid', gap: 8}}>
          <AnimatePresence initial={false}>
            {cards.map(card => <motion.li key={card.id}
              layout={!reduced} initial={enter} animate={{opacity: 1, y: 0}}
              exit={leave} transition={transition}
              style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                gap: 15, background: '#edf5eb', borderRadius: 10, padding: 16}}>
              <div><strong>{card.title}</strong><p style={{fontSize: 13, margin: '5px 0 0'}}>{card.description}</p></div>
              <button type="button" aria-label={'归档 ' + card.title} onClick={() => removeCard(card.id)}>归档</button>
            </motion.li>)}
          </AnimatePresence>
        </motion.ul>
      </>}
      <p style={{fontSize: 12, color: '#5f7163', marginTop: 14}}>
        不把动画当作业务状态源。减少动画偏好时禁用布局位移；归档后焦点返回“添加任务”。
      </p>
    </section>
  </MotionConfig>;
}
