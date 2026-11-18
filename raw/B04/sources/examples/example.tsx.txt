import { type DotLottie, DotLottieReact } from '@lottiefiles/dotlottie-react'
import { useEffect, useRef, useState } from 'react'
import { clampFrame, mayPlay, playbackLabel } from './playback-policy'
import pulse from './pulse.json'

type Level = 'basic' | 'business' | 'advanced'
type Intent = 'paused' | 'playing' | 'stopped'
type Reading = {
  frame: number
  totalFrames: number
  duration: number
  speed: number
  playing: boolean
  paused: boolean
  stopped: boolean
  frozen: boolean
}
const SOURCE = JSON.stringify(pulse)
const INVALID_SOURCE = '{ this deliberately is not JSON }'
const MOTION_QUERY = '(prefers-reduced-motion: reduce)'

// This workshop mounts only in the browser. A server-rendered app must defer
// this whole component until mounted, rather than only adding 'use client'.
function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia(MOTION_QUERY).matches)
  useEffect(() => {
    const query = window.matchMedia(MOTION_QUERY)
    const refresh = () => setReduced(query.matches)
    refresh()
    query.addEventListener('change', refresh)
    return () => query.removeEventListener('change', refresh)
  }, [])
  return reduced
}

export default function DotLottieExample({ level }: { level: Level }) {
  const reduced = useReducedMotion()
  const [player, setPlayer] = useState<DotLottie | null>(null)
  const [intent, setIntent] = useState<Intent>('paused')
  const [override, setOverride] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [visible, setVisible] = useState(() => !document.hidden)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [invalid, setInvalid] = useState(false)
  const [frame, setFrame] = useState(0)
  const [reading, setReading] = useState<Reading | null>(null)
  const [outcome, setOutcome] = useState<'idle' | 'pending' | 'success'>('idle')
  const pending = useRef<number | null>(null)
  const figure = useRef<HTMLElement | null>(null)
  const destroyObservers = useRef(new WeakMap<DotLottie, () => void>())

  // biome-ignore lint/correctness/useExhaustiveDependencies: changing the scene cancels and resets its local work
  useEffect(() => {
    if (pending.current !== null) window.clearTimeout(pending.current)
    pending.current = null
    setIntent('paused')
    setOverride(false)
    setSpeed(1)
    setOutcome('idle')
    setInvalid(false)
    setReading(null)
    setFrame(0)
  }, [level])

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden)
    onVisibility()
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    if (!player) {
      setLoaded(false)
      return
    }
    const onLoad = () => {
      setLoaded(true)
      setError('')
    }
    const onError = () => {
      setLoaded(false)
      setIntent('paused')
      player.pause()
      setError('播放器报告资源加载或渲染失败；请恢复本地动画。业务文字仍然有效。')
    }
    setLoaded(player.isLoaded)
    player.addEventListener('load', onLoad)
    player.addEventListener('loadError', onError)
    player.addEventListener('renderError', onError)
    if (player.isLoaded) onLoad()

    // A real SDK destroy event marks the old Canvas for lifecycle inspection.
    // The wrapper owns destruction; the SDK removes its remaining listeners.
    // StrictMode may retain the same instance, so replace our previous observer.
    const oldObserver = destroyObservers.current.get(player)
    if (oldObserver) player.removeEventListener('destroy', oldObserver)
    const canvas = figure.current?.querySelector('canvas')
    const onDestroy = () => {
      if (canvas) canvas.dataset.playerDestroyed = 'true'
    }
    destroyObservers.current.set(player, onDestroy)
    player.addEventListener('destroy', onDestroy)
    return () => {
      player.removeEventListener('load', onLoad)
      player.removeEventListener('loadError', onError)
      player.removeEventListener('renderError', onError)
      player.pause()
    }
  }, [player])

  useEffect(() => {
    if (!player || !loaded) return
    player.setSpeed(speed)
    if (!mayPlay({ loaded, visible, reduced, override })) {
      player.pause()
      if (reduced && !override) player.setFrame(0)
    } else if (intent === 'playing') player.play()
    else if (intent === 'stopped') player.stop()
    else player.pause()
  }, [player, loaded, speed, intent, visible, reduced, override])

  useEffect(
    () => () => {
      if (pending.current !== null) window.clearTimeout(pending.current)
    },
    [],
  )

  function readPlayer() {
    if (!player || !loaded) return
    setReading({
      frame: player.currentFrame,
      totalFrames: player.totalFrames,
      duration: player.duration,
      speed: player.speed,
      playing: player.isPlaying,
      paused: player.isPaused,
      stopped: player.isStopped,
      frozen: player.isFrozen,
    })
  }

  function finishLocalAction() {
    if (pending.current !== null) window.clearTimeout(pending.current)
    setOutcome('pending')
    setIntent('paused')
    pending.current = window.setTimeout(() => {
      pending.current = null
      setOutcome('success')
      setIntent('playing')
    }, 650)
  }

  const policy = { loaded, visible, reduced, override }
  const canPlay = mayPlay(policy)
  const effectiveLabel =
    intent === 'stopped' && canPlay ? '已停止（首帧）' : playbackLabel(policy, intent === 'playing')
  return (
    <section aria-label="dotLottie React 播放器" data-testid="b04-workshop" data-loaded={loaded}>
      <h2>
        {level === 'basic'
          ? '本地脉冲动画'
          : level === 'business'
            ? '订阅完成后的反馈'
            : '可控动效与节能策略'}
      </h2>
      <p>
        原创 pulse.json 提供矢量动画；真实 DotLottieReact 解码和绘制。首次加载仍需从官方 CDN 获取
        0.81.0 的播放器 WASM。
      </p>
      <figure
        ref={figure}
        style={{
          display: 'grid',
          justifyItems: 'center',
          background: '#f7faf5',
          borderRadius: 12,
          padding: 15,
        }}
      >
        <DotLottieReact
          key={invalid ? 'invalid' : 'pulse'}
          data={invalid ? INVALID_SOURCE : SOURCE}
          loop
          autoplay={false}
          style={{ width: 185, height: 155, visibility: error ? 'hidden' : 'visible' }}
          aria-hidden="true"
          tabIndex={-1}
          data-player-destroyed="false"
          dotLottieRefCallback={setPlayer}
          renderConfig={{
            autoResize: true,
            devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
          }}
        />
        <figcaption>
          {loaded ? '矢量动画资源已加载' : '等待资源加载'} · 业务结果见下方文字
        </figcaption>
      </figure>
      {error && <p role="alert">{error}</p>}
      <div className="demo-controls">
        <button
          type="button"
          disabled={!loaded || (intent !== 'playing' && !canPlay)}
          onClick={() => setIntent((value) => (value === 'playing' ? 'paused' : 'playing'))}
        >
          {intent === 'playing' ? '暂停' : '播放'}
        </button>
        <button type="button" disabled={!loaded} onClick={() => setIntent('stopped')}>
          停止并回到首帧
        </button>
        {level !== 'basic' && (
          <button type="button" onClick={finishLocalAction}>
            模拟本地订阅确认
          </button>
        )}
        {level === 'advanced' && (
          <>
            <label>
              速度{' '}
              <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
                {[0.5, 1, 1.5].map((value) => (
                  <option key={value} value={value}>
                    {value}×
                  </option>
                ))}
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={override}
                onChange={(event) => setOverride(event.target.checked)}
              />{' '}
              明确允许在减少动态下播放
            </label>
            <label>
              定位帧{' '}
              <input
                type="range"
                min={0}
                max={Math.max(0, Math.ceil(player?.totalFrames ?? 0) - 1)}
                value={frame}
                disabled={!canPlay}
                onChange={(event) => {
                  const next = clampFrame(Number(event.target.value), player?.totalFrames ?? 0)
                  setIntent('paused')
                  player?.pause()
                  player?.setFrame(next)
                  setFrame(next)
                  setReading(null)
                }}
              />
            </label>
            <output>{frame}</output>
            <button
              type="button"
              onClick={() => {
                setLoaded(false)
                setError('')
                setReading(null)
                setIntent('paused')
                setInvalid((value) => !value)
              }}
            >
              {invalid ? '恢复本地动画' : '加载损坏的演示数据'}
            </button>
          </>
        )}
        <button type="button" disabled={!loaded} onClick={readPlayer}>
          读取播放器状态
        </button>
      </div>
      <p role="status">
        业务：{outcome === 'idle' ? '尚未提交' : outcome === 'pending' ? '本地处理中' : '操作成功'}
        ；播放策略：{effectiveLabel}；页面：{visible ? '可见' : '隐藏'}；减少动态：
        {reduced ? '开启' : '关闭'}。
      </p>
      {reading && <pre data-testid="b04-reading">{JSON.stringify(reading, null, 2)}</pre>}
      <p>
        「读取播放器状态」是当次 SDK getter
        快照；播放策略文字表示应用意图。切换页面、系统减少动态偏好可能暂停播放。
      </p>
      {reduced && !override && <p>按系统减少动态偏好显示静态首帧；高级层可明确允许播放。</p>}
      {level === 'advanced' && (
        <p>
          损坏数据真实触发播放器错误；恢复按钮重新挂载原始本地动画。650ms
          订阅确认是示例定时器，不会发送请求。
        </p>
      )}
    </section>
  )
}
