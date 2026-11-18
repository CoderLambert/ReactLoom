import { Video, VideoPlayer, VideoSkin } from '@videojs/react/video'
import '@videojs/react/video/skin.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createLocalClip } from './clip'
import { releaseNativeMedia } from './media-cleanup.mjs'
import { validateVideoHeader, validateVideoMetadata } from './video-file-policy.mjs'

type Level = 'basic' | 'business' | 'advanced'
function LocalPlayer({
  url,
  onReady,
  onFailure,
}: {
  url: string
  onReady: (media: HTMLVideoElement) => void
  onFailure: (media: HTMLVideoElement) => void
}) {
  const current = useRef<HTMLVideoElement | null>(null)
  const attach = useCallback((media: HTMLVideoElement | null) => {
    if (current.current && current.current !== media) releaseNativeMedia(current.current)
    current.current = media
  }, [])
  return (
    <VideoPlayer>
      <VideoSkin style={{ width: '100%', maxWidth: 600, aspectRatio: '16 / 9' }}>
        <Video
          ref={attach}
          src={url}
          playsInline
          preload="metadata"
          onLoadedMetadata={(event) => onReady(event.currentTarget)}
          onError={(event) => onFailure(event.currentTarget)}
        />
      </VideoSkin>
    </VideoPlayer>
  )
}
export default function VideoJsExample({ level }: { level: Level }) {
  return <VideoJsSession key={level} level={level} />
}
function VideoJsSession({ level }: { level: Level }) {
  const [url, setUrl] = useState(''),
    [status, setStatus] = useState('未创建视频；不会自动访问外部资源'),
    [busy, setBusy] = useState(false)
  const generation = useRef(0),
    current = useRef<string | null>(null),
    recording = useRef<AbortController | null>(null),
    retiredUrls = useRef<string[]>([])
  const update = (blob: Blob, id: number) => {
    if (id !== generation.current) return
    const next = URL.createObjectURL(blob)
    if (current.current) retiredUrls.current.push(current.current)
    current.current = next
    setUrl(next)
    setStatus(`已创建本地URL：${(blob.size / 1024).toFixed(1)} KiB，等待真实媒体解码`)
  }
  useEffect(() => {
    for (const old of retiredUrls.current.splice(0)) {
      if (old !== url) URL.revokeObjectURL(old)
    }
  }, [url])
  useEffect(
    () => () => {
      generation.current++
      recording.current?.abort()
      if (current.current) URL.revokeObjectURL(current.current)
      current.current = null
      recording.current = null
      for (const old of retiredUrls.current) URL.revokeObjectURL(old)
      retiredUrls.current = []
    },
    [],
  )
  async function build(variant: 'light' | 'dark') {
    recording.current?.abort()
    const controller = new AbortController()
    recording.current = controller
    const id = ++generation.current
    setBusy(true)
    setStatus('正在录制原创Canvas片段…')
    try {
      update(await createLocalClip(variant, controller.signal), id)
    } catch (error) {
      if (id === generation.current) setStatus(`录制失败：${String(error)}`)
    } finally {
      if (recording.current === controller) recording.current = null
      if (id === generation.current) setBusy(false)
    }
  }
  async function open(file: File | null) {
    if (!file) return
    recording.current?.abort()
    const id = ++generation.current
    setBusy(true)
    try {
      validateVideoMetadata(file)
      const header = new Uint8Array(await file.slice(0, 32).arrayBuffer())
      if (id !== generation.current) return
      validateVideoHeader(file.type, header)
      update(file, id)
    } catch (error) {
      if (id === generation.current) setStatus(`文件校验失败：${String(error)}`)
    } finally {
      if (id === generation.current) setBusy(false)
    }
  }
  function remove() {
    generation.current++
    recording.current?.abort()
    recording.current = null
    if (current.current) {
      retiredUrls.current.push(current.current)
      current.current = null
    }
    setUrl('')
    setBusy(false)
    setStatus('素材已移除')
  }
  return (
    <section aria-label="Video.js v10真实播放器">
      <h2>
        {level === 'basic'
          ? '原创WebM与真实播放'
          : level === 'business'
            ? '替换片头与旧源退役'
            : '本地视频与资源清理'}
      </h2>
      <p>
        真实@videojs/react10.2.0
        VideoPlayer/VideoSkin/Video。Canvas/MediaRecorder仅生成原创fixture，不请求摄像头、麦克风或远程媒体。
      </p>
      <div className="demo-controls">
        <button type="button" disabled={busy} onClick={() => void build('light')}>
          制作本地片头
        </button>
        {level !== 'basic' && (
          <button type="button" disabled={busy} onClick={() => void build('dark')}>
            切换深色片头
          </button>
        )}
        {level === 'advanced' && (
          <label>
            导入本地视频
            <input
              type="file"
              accept="video/mp4,video/webm"
              onChange={(event) => {
                void open(event.target.files?.[0] ?? null)
                event.currentTarget.value = ''
              }}
            />
          </label>
        )}
        <button type="button" onClick={remove}>
          移除与释放
        </button>
      </div>
      <p role="status" aria-label="Video.js操作结果">
        {status}
      </p>
      {url ? (
        <LocalPlayer
          key={url}
          url={url}
          onReady={(media) => {
            if (current.current === url)
              setStatus(
                `已加载本地素材：${media.videoWidth}×${media.videoHeight}，readyState ${media.readyState}`,
              )
          }}
          onFailure={(media) => {
            if (current.current === url)
              setStatus(
                `媒体解码失败：code ${media.error?.code ?? 'unknown'}；容器头通过不等于编码可播放`,
              )
          }}
        />
      ) : (
        <p className="notice">尚未加载媒体；点击制作或在进阶层手动选择。</p>
      )}
      <p>
        换源/移除先让旧Video
        ref清理pause/src/load，再于React提交后revoke旧URL；录制取消/完成均stop轨道。实际播放与释放仍需浏览器验证。
      </p>
    </section>
  )
}
