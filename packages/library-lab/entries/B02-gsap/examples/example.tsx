import { gsap } from 'gsap'
import { useEffect, useRef, useState } from 'react'
import { createCardSequence, createCardTween } from './motion'
import { progressPercent, shouldPlayTimeline, shouldPublishProgress } from './timeline-policy'
import './workshop.css'

type Props = { level: 'basic' | 'business' | 'advanced' }
type Owner = { animation: gsap.core.Tween | gsap.core.Timeline; instance: number }
type Snapshot = {
  instance: number
  kind: string
  progress: number
  time: number
  duration: number
  totalDuration: number
  paused: boolean
  reversed: boolean
  active: boolean
  labels: Record<string, number>
  children: { start: number; duration: number }[]
  targets: {
    name: string | undefined
    x: unknown
    y: unknown
    opacity: unknown
    transform: string
  }[]
}

export default function GsapTimelineWorkshop({ level }: Props) {
  const scope = useRef<HTMLElement>(null)
  const owner = useRef<Owner | null>(null)
  const sequence = useRef(0)
  const displayed = useRef(-1)
  const [generation, setGeneration] = useState(0)
  const [progress, setProgress] = useState(0)
  const [userPaused, setUserPaused] = useState(false)
  const [ease, setEase] = useState('power2.out')
  const [reduce, setReduce] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  const [status, setStatus] = useState('准备动画')
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const advanced = level === 'advanced'
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduce(query.matches)
    query.addEventListener('change', sync)
    sync()
    return () => query.removeEventListener('change', sync)
  }, [])
  useEffect(() => {
    const sync = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', sync)
    sync()
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])
  // biome-ignore lint/correctness/useExhaustiveDependencies: generation explicitly reverts and recreates the owned animation for replay.
  useEffect(() => {
    const host = scope.current
    if (!host) return
    const nodes = [...host.querySelectorAll<HTMLElement>('.b02-card,.b02-detail')]
    for (const node of nodes) {
      node.dataset.b02Reverted = 'false'
      delete node.dataset.b02RemainingTweens
    }
    let disposed = false
    const id = ++sequence.current
    displayed.current = reduce ? 100 : 0
    setProgress(displayed.current)
    setSnapshot(null)
    const publish = (value: number) => {
      if (disposed) return
      const next = progressPercent(value)
      if (shouldPublishProgress(displayed.current, next)) {
        displayed.current = next
        setProgress(next)
      }
    }
    const context = gsap.context(() => {
      if (reduce) {
        setStatus('减少动态：静态显示全部内容，不创建动画')
        return
      }
      const animation = advanced
        ? createCardSequence('.b02-card', '.b02-detail', publish)
        : createCardTween('.b02-card', ease, publish)
      animation.eventCallback('onComplete', () => {
        if (!disposed) setStatus('正向视觉动画完成')
      })
      animation.eventCallback('onReverseComplete', () => {
        if (!disposed) setStatus('反向视觉动画完成')
      })
      owner.current = { animation, instance: id }
      setStatus(advanced ? '已创建真实 GSAP Timeline' : '已创建真实 GSAP Tween')
    }, host)
    return () => {
      disposed = true
      if (owner.current?.instance === id) owner.current = null
      context.revert({ suppressEvents: true })
      for (const node of nodes) {
        node.dataset.b02Reverted = 'true'
        node.dataset.b02RemainingTweens = String(gsap.getTweensOf(node).length)
      }
    }
  }, [advanced, generation, ease, reduce])
  // biome-ignore lint/correctness/useExhaustiveDependencies: a recreated owner must receive current intent even when the intent itself did not change.
  useEffect(() => {
    const animation = owner.current?.animation
    if (!animation) return
    if (shouldPlayTimeline({ reducedMotion: reduce, pageVisible: visible, userPaused }))
      animation.resume()
    else animation.pause()
  }, [advanced, generation, ease, reduce, visible, userPaused])

  function read() {
    const current = owner.current
    const host = scope.current
    if (!current || !host) {
      setSnapshot(null)
      return
    }
    const animation = current.animation
    const timeline = animation instanceof gsap.core.Timeline ? animation : null
    setSnapshot({
      instance: current.instance,
      kind: timeline ? 'Timeline' : 'Tween',
      progress: animation.progress(),
      time: animation.time(),
      duration: animation.duration(),
      totalDuration: animation.totalDuration(),
      paused: animation.paused(),
      reversed: animation.reversed(),
      active: animation.isActive(),
      labels: timeline ? { ...timeline.labels } : {},
      children: timeline
        ? timeline
            .getChildren(false, true, true)
            .map((child) => ({ start: child.startTime(), duration: child.totalDuration() }))
        : [],
      targets: [...host.querySelectorAll<HTMLElement>('.b02-card,.b02-detail')].map((node) => ({
        name: node.dataset.motionName,
        x: gsap.getProperty(node, 'x'),
        y: gsap.getProperty(node, 'y'),
        opacity: gsap.getProperty(node, 'opacity'),
        transform: getComputedStyle(node).transform,
      })),
    })
  }
  function seek(percent: number) {
    const animation = owner.current?.animation
    if (!animation || reduce) return
    animation.pause().progress(percent / 100, true)
    setUserPaused(true)
    displayed.current = percent
    setProgress(percent)
    setStatus('手动定位并暂停；位置来自真实 GSAP progress')
  }
  return (
    <section
      ref={scope}
      className="b02-workshop"
      aria-label="GSAP timeline 实战"
      data-testid="b02-workshop"
    >
      <h2>{advanced ? '时间编排、方向与局部所有权' : 'Tween 的时间比例与缓动映射'}</h2>
      <p>
        本地摘要卡片只演示视觉参数；真实GSAP修改宿主内transform/opacity，没有发布接口、滚动插件或业务流程状态机。
      </p>
      <div className="demo-controls">
        {!advanced && (
          <label>
            缓动
            <select value={ease} onChange={(event) => setEase(event.target.value)}>
              <option value="none">线性 none</option>
              <option value="power2.out">power2.out</option>
            </select>
          </label>
        )}
        <button
          type="button"
          disabled={reduce}
          onClick={() => {
            setUserPaused(false)
            setGeneration((value) => value + 1)
          }}
        >
          重播动画
        </button>
        <button
          type="button"
          disabled={reduce || !visible}
          onClick={() => setUserPaused((value) => !value)}
        >
          {userPaused ? '继续' : '暂停'}
        </button>
        {advanced && (
          <>
            <button
              type="button"
              disabled={reduce || !visible || progress === 0}
              onClick={() => {
                owner.current?.animation.reverse()
                setUserPaused(false)
              }}
            >
              反向播放
            </button>
            <button
              type="button"
              disabled={reduce}
              onClick={() => {
                const animation = owner.current?.animation
                if (!(animation instanceof gsap.core.Timeline)) return
                animation.pause().seek('detail', true)
                const percent = progressPercent(animation.progress())
                displayed.current = percent
                setProgress(percent)
                setUserPaused(true)
                setStatus('已定位详情标签并暂停')
              }}
            >
              定位详情标签
            </button>
          </>
        )}
        <label>
          手动时间进度
          <input
            aria-label="手动时间进度"
            type="range"
            min="0"
            max="100"
            value={progress}
            disabled={reduce}
            onChange={(event) => seek(Number(event.target.value))}
          />
          {progress}%
        </label>
      </div>
      <p role="status" data-testid="b02-status">
        {status}
      </p>
      <p data-testid="b02-conditions">
        减少动态：{reduce ? '开启' : '关闭'}；页面：{visible ? '可见' : '后台'}；用户意图：
        {userPaused ? '暂停' : '播放'}。
      </p>
      <div className={`b02-stage ${advanced ? 'b02-grid' : ''}`} data-testid="b02-stage">
        {(advanced ? ['每日摘要', '需要关注', '收藏热点', '后续行动'] : ['阅读摘要']).map(
          (name, index) => (
            <article
              className={`b02-card ${advanced ? '' : 'b02-single'}`}
              key={name}
              data-motion-name={`card-${index}`}
              data-testid={`b02-card-${index}`}
            >
              <small>本地模块 {index + 1}</small>
              <h3>{name}</h3>
              <p>同一份内容在暂停和减少动态时仍可阅读。</p>
            </article>
          ),
        )}
        {advanced && (
          <p className="b02-detail" data-motion-name="detail" data-testid="b02-detail">
            详情在0.7秒标签开始，与前四张卡片尾段重叠。
          </p>
        )}
      </div>
      <label>
        实际时间进度
        <progress max={100} value={progress} data-testid="b02-progress" />
      </label>
      <details>
        <summary>查看真实动画与样式</summary>
        <button type="button" onClick={read}>
          读取真实动画状态
        </button>
        <pre data-testid="b02-sdk-state">{JSON.stringify(snapshot, null, 2)}</pre>
        <p>
          快照显式读取真实Tween/Timeline和getProperty/计算样式；进度条按至少5个百分点及端点发布，手动定位即时更新。视觉完成不是业务请求成功。
        </p>
      </details>
    </section>
  )
}
