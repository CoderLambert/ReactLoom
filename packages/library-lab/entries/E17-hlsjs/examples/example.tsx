import Hls from 'hls.js'
import { useEffect, useRef, useState } from 'react'
import { DESTROY_EVENT, disposePlayback, TEST_HLS, validLevel } from './media-policy.mjs'

type Level = 'basic' | 'business' | 'advanced'
export default function HlsExample({ level }: { level: Level }) {
  return <HlsSession key={level} level={level} />
}
function HlsSession({ level }: { level: Level }) {
  const videoRef = useRef<HTMLVideoElement>(null),
    hlsRef = useRef<Hls | null>(null)
  const generation = useRef(0),
    instanceId = useRef(0)
  const [status, setStatus] = useState('未加载：演示不会自动联网')
  const [qualities, setQualities] = useState<{ index: number; label: string }[]>([])
  const [selected, setSelected] = useState(-1),
    [activeLevel, setActiveLevel] = useState<number | null>(null)
  function release() {
    generation.current++
    const engine = hlsRef.current
    hlsRef.current = null
    disposePlayback(engine, videoRef.current)
  }
  function stop() {
    release()
    setQualities([])
    setSelected(-1)
    setActiveLevel(null)
    setStatus('已停止并清理媒体实例')
  }
  useEffect(() => {
    const video = videoRef.current
    return () => {
      generation.current++
      const engine = hlsRef.current
      hlsRef.current = null
      disposePlayback(engine, video)
    }
  }, [])
  function load(remote = true) {
    const video = videoRef.current
    if (!video) return
    stop()
    const run = ++generation.current
    setStatus(remote ? '用户已选择外部请求，等待真实清单…' : '创建本地诊断MSE会话，不拉清单')
    video.onerror = () => {
      if (run !== generation.current) return
      const message = video.error?.message || '请检查网络、CORS与媒体编码'
      release()
      setQualities([])
      setSelected(-1)
      setActiveLevel(null)
      setStatus(`浏览器媒体错误：${message}；已清理，可手动重试`)
    }
    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false, maxBufferLength: 12 })
      hlsRef.current = hls
      const id = ++instanceId.current
      // Actual SDK lifecycle event, forwarded only to this media element for observation.
      hls.on(Hls.Events.DESTROYING, () =>
        video.dispatchEvent(new CustomEvent(DESTROY_EVENT, { detail: { id } })),
      )
      const current = () => run === generation.current && hlsRef.current === hls
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        if (!current()) return
        if (remote) hls.loadSource(TEST_HLS)
        else setStatus('本地诊断MSE已连接；没有外部清单请求')
      })
      hls.on(Hls.Events.MANIFEST_PARSED, (_, info) => {
        if (!current()) return
        setQualities(
          hls.levels.map((q, index) => ({
            index,
            label: `${q.height || '?'}p · ${Math.round(q.bitrate / 1000)} kbps`,
          })),
        )
        setStatus(`已读取真实HLS清单（${info.levels.length}层）；播放须用户操作，可能已预缓冲分片`)
      })
      hls.on(Hls.Events.LEVEL_SWITCHED, (_, info) => {
        if (current()) setActiveLevel(info.level)
      })
      hls.on(Hls.Events.ERROR, (_, error) => {
        if (!current()) return
        const message = `HLS错误：${error.type}/${error.details}${error.fatal ? ' (fatal)' : ''}${error.error ? `：${error.error.message}` : ''}`
        if (error.fatal) {
          release()
          setQualities([])
          setSelected(-1)
          setActiveLevel(null)
        }
        setStatus(message)
      })
      hls.attachMedia(video)
    } else if (remote && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = TEST_HLS
      video.load()
      setStatus('浏览器采用原生HLS；不是hls.js MSE模式，播放能力仍待实测')
    } else {
      video.onerror = null
      setStatus(
        remote
          ? '当前浏览器不支持MSE/原生HLS，未发出媒体请求'
          : '本地诊断需要MSE；当前未运行，不发清单请求',
      )
    }
  }
  function quality(index: number) {
    const hls = hlsRef.current
    if (!hls || !validLevel(index, hls.levels.length)) return
    hls.currentLevel = index
    setSelected(index)
  }
  function injectFatal() {
    const hls = hlsRef.current
    if (!hls) return
    hls.trigger(Hls.Events.ERROR, {
      type: Hls.ErrorTypes.OTHER_ERROR,
      details: Hls.ErrorDetails.INTERNAL_EXCEPTION,
      fatal: true,
      error: new Error('本地注入fatal，非外部网络故障'),
    })
  }
  return (
    <section aria-label="hls.js真实播放引擎">
      <h2>
        {level === 'basic'
          ? '用户触发的HLS清单'
          : level === 'business'
            ? '请求画质与真实层切换'
            : 'fatal重试与媒体所有权'}
      </h2>
      <p>
        点击公开流按钮后才访问Mux测试源，可能拉取清单和媒体分片；不是本地fixture或已授权生产片源，不下载保存视频。Worker明确关闭，不声称销毁过Worker。
      </p>
      <div className="demo-controls">
        <button type="button" onClick={() => load(true)}>
          加载公开HLS测试流（外部请求）
        </button>
        <button type="button" onClick={stop}>
          停止并销毁
        </button>
        {level !== 'basic' && (
          <label>
            请求画质
            <select
              aria-label="请求画质"
              disabled={!hlsRef.current || !qualities.length}
              value={selected}
              onChange={(event) => quality(Number(event.target.value))}
            >
              <option value={-1}>自动</option>
              {qualities.map((q) => (
                <option value={q.index} key={q.index}>
                  {q.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {level === 'advanced' && (
          <>
            <button type="button" onClick={() => load(false)}>
              本地诊断会话（不拉清单）
            </button>
            <button type="button" disabled={!hlsRef.current} onClick={injectFatal}>
              注入本地fatal（非网络测试）
            </button>
          </>
        )}
      </div>
      {/* biome-ignore lint/a11y/useMediaCaption: The external README test stream has no bundled transcript; caption support is explicitly outside this diagnostic fixture. */}
      <video
        data-testid="hls-media"
        aria-label="HLS媒体元素"
        controls
        playsInline
        preload="metadata"
        ref={videoRef}
        style={{ width: '100%', maxWidth: 640, background: '#192821' }}
      />
      <p role="status">{status}</p>
      {level !== 'basic' && (
        <p data-testid="hls-level">
          请求：{selected === -1 ? '自动' : selected}；SDK已切换层：{activeLevel ?? '尚无事件'}
        </p>
      )}
      {level === 'advanced' && (
        <p>
          本地fatal按钮触发真实SDK事件但不代表外部故障。fatal后销毁并清src；重试须用户新建实例，不无限恢复。原生HLS分支不提供hls.js质量或诊断能力。
        </p>
      )}
    </section>
  )
}
