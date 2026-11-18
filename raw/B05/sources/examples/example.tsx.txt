import { Fit } from '@rive-app/react-webgl2'
import { useCallback, useEffect, useRef, useState } from 'react'
import { type PlayerProbe, type PlayerSnapshot, RivePlayer } from './player'
import './styles.css'
import { riveRuntimePolicy } from './runtime-policy'

type Level = 'basic' | 'business' | 'advanced'
type Review = 'idle' | 'pending' | 'success' | 'error'

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(query.matches)
    onChange()
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function usePageVisible() {
  const [visible, setVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState === 'visible',
  )
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible')
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  return visible
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('已取消', 'AbortError'))
      return
    }
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, ms)
    function abort() {
      window.clearTimeout(timer)
      signal.removeEventListener('abort', abort)
      reject(new DOMException('已取消', 'AbortError'))
    }
    signal.addEventListener('abort', abort, { once: true })
  })
}

export default function RiveWorkshop({ level }: { level: Level }) {
  const reduced = useReducedMotion()
  const pageVisible = usePageVisible()
  const [inView, setInView] = useState(level !== 'advanced')
  const [manuallyPaused, setManuallyPaused] = useState(false)
  const [phase, setPhase] = useState<Review>('idle')
  const [message, setMessage] = useState('动画资源采用官方公开文档的 CDN 地址，当前运行需要网络。')
  const [runtimeError, setRuntimeError] = useState('')
  const [snapshot, setSnapshot] = useState<PlayerSnapshot | null>(null)
  const [fit, setFit] = useState(Fit.Contain)
  const probeRef = useRef<PlayerProbe | null>(null)
  const handlePlayerError = useCallback((detail: string) => setRuntimeError(detail), [])
  const handleSnapshot = useCallback((next: PlayerSnapshot) => {
    if (probeRef.current?.instance === next.instance) setSnapshot(next)
  }, [])
  const handleDetached = useCallback((instance: string) => {
    setSnapshot((previous) => (previous?.instance === instance ? null : previous))
  }, [])
  function inspect() {
    try {
      setSnapshot(probeRef.current?.read() ?? null)
    } catch (error) {
      setRuntimeError(`Rive实际对象读取失败：${String(error)}`)
    }
  }
  const [simulateError, setSimulateError] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const pendingRef = useRef<AbortController | null>(null)
  const generation = useRef(0)

  useEffect(() => {
    if (level !== 'advanced') return
    const wrapper = wrapperRef.current
    if (!wrapper) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        setInView(Boolean(entries[0]?.isIntersecting))
      },
      { threshold: 0.05 },
    )
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [level])

  // Closing one scenario cancels its outstanding local review before another can display it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: level deliberately invalidates pending work when the scenario changes.
  useEffect(() => {
    setPhase('idle')
    return () => {
      ++generation.current
      pendingRef.current?.abort()
      pendingRef.current = null
    }
  }, [level])

  const cancelReview = useCallback(() => {
    ++generation.current
    pendingRef.current?.abort()
    pendingRef.current = null
    setPhase('idle')
    setMessage('取消审核，先前任务不得回写当前页面。')
  }, [])

  const runReview = useCallback(async () => {
    pendingRef.current?.abort()
    const controller = new AbortController()
    pendingRef.current = controller
    const id = ++generation.current
    setPhase('pending')
    setMessage('正在执行本地可取消的审核模拟，不会访问真实接口。')
    try {
      await wait(450, controller.signal)
      if (generation.current !== id || controller.signal.aborted) return
      if (simulateError) throw new Error('模拟 HTTP 503 服务暂不可用')
      setPhase('success')
      setMessage('审核成功：真实业务状态以 HTML 呈现，Rive 不决定任务是否成功。')
    } catch (error) {
      if (generation.current !== id || controller.signal.aborted) return
      setPhase('error')
      setMessage(`审核失败：${String(error)}`)
    } finally {
      if (generation.current === id) pendingRef.current = null
    }
  }, [simulateError])

  const runtime = riveRuntimePolicy({
    level,
    pageVisible,
    inView,
    reducedMotion: reduced,
    manuallyPaused,
    phase,
  })
  const playing = runtime.play
  const shouldMount = runtime.mount

  return (
    <section
      className="ab-rive"
      aria-label="Rive 动画与状态机制实验"
      data-testid="b05-workshop"
      data-phase={phase}
      data-runtime-mount={shouldMount}
      data-requested-play={playing}
      data-reduced={reduced}
      data-in-view={inView}
    >
      <h2>
        {level === 'basic'
          ? '入门：Rive 播放器'
          : level === 'business'
            ? '业务：审核状态驱动动画'
            : '进阶：视口与资源生命周期'}
      </h2>
      <p>
        真正调用 Rive React WebGL2 运行时，而不是 CSS/SVG 动画。原始 .riv 动画为 Rive
        官方文档引用的远程样本，资源本身不包含在此仓库。
      </p>
      <fieldset className="ab-rive-actions">
        <legend>动画操作</legend>
        {level === 'business' && (
          <>
            <button type="button" onClick={() => void runReview()}>
              启动 / 重试审核
            </button>
            <button type="button" disabled={phase !== 'pending'} onClick={cancelReview}>
              取消任务
            </button>
            <label>
              <input
                type="checkbox"
                checked={simulateError}
                onChange={(event) => setSimulateError(event.target.checked)}
              />
              下次模拟 503
            </label>
          </>
        )}
        <label>
          画面适配
          <select
            aria-label="画面适配"
            value={fit}
            onChange={(event) => setFit(event.target.value === Fit.Cover ? Fit.Cover : Fit.Contain)}
          >
            <option value={Fit.Contain}>完整显示 Contain</option>
            <option value={Fit.Cover}>铺满裁切 Cover</option>
          </select>
        </label>
        <button
          type="button"
          aria-pressed={manuallyPaused}
          onClick={() => setManuallyPaused((value) => !value)}
        >
          {manuallyPaused ? '恢复自动播放' : '手动暂停动画'}
        </button>
      </fieldset>
      <p role="status" aria-live="polite" data-testid="b05-status">
        {level === 'business' ? `业务状态：${phase} · ` : ''}
        {message}
      </p>
      <div ref={wrapperRef} className="ab-rive-viewport" data-testid="b05-viewport">
        {shouldMount ? (
          <RivePlayer
            playing={playing}
            fit={fit}
            probeRef={probeRef}
            onError={handlePlayerError}
            onSnapshot={handleSnapshot}
            onDetached={handleDetached}
          />
        ) : (
          <div className="ab-rive-placeholder">
            {pageVisible
              ? '动画在视口外：Rive 组件已卸载；返回视口后再加载。'
              : '页面在后台：Rive组件已卸载，由包装器清理实例；共享离屏context不保证销毁。'}
          </div>
        )}
      </div>
      {runtimeError && (
        <p role="alert" data-testid="b05-runtime-error">
          {runtimeError}
        </p>
      )}
      <details>
        <summary>查看真实Rive对象与推进事件</summary>
        <button type="button" onClick={inspect}>
          读取真实播放器
        </button>
        <p>
          isPlaying/状态机/边界/layout来自实际SDK；Advance只表示观察到推进，不证明像素已绘制，也不是GPU资源数量。null表示当前无已就绪实例；操作后可重新读取。共享离屏WebGL
          context不保证随单组件卸载消失。
        </p>
        <pre data-testid="b05-sdk-state">{JSON.stringify(snapshot, null, 2)}</pre>
      </details>
      <dl className="ab-rive-facts">
        <div>
          <dt>文档页面</dt>
          <dd>{pageVisible ? '前台' : '后台'}</dd>
        </div>
        <div>
          <dt>系统减少动态效果</dt>
          <dd>{reduced ? '开启（停播）' : '关闭'}</dd>
        </div>
        <div>
          <dt>播放器请求状态</dt>
          <dd>{!shouldMount ? '未挂载' : playing ? '请求播放（需资源成功加载）' : '请求暂停'}</dd>
        </div>
      </dl>
      <p>
        动画只是视觉装饰，审核成功/失败必须由 HTML 文本、按钮状态和真实业务契约表达。WebGL2 与 CDN
        失败时仍保留文本结果。
      </p>
    </section>
  )
}
