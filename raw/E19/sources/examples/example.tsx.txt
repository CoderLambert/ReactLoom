import { FFmpeg } from '@ffmpeg/ffmpeg'
import { useEffect, useRef, useState } from 'react'
import { isAllowedMediaFile, MAX_OUTPUT_BYTES, validateInputMedia } from './input-policy.mjs'
import { makeToneWav } from './wav'
import { inspectPcmWav } from './wav-output-policy.mjs'
import './workshop.css'

type Level = 'basic' | 'business' | 'advanced'
type Phase =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'reading'
  | 'writing'
  | 'converting'
  | 'output'
  | 'done'
  | 'cancelled'
  | 'error'
const PHASE_LABELS: Record<Phase, string> = {
  idle: '尚未加载',
  loading: '加载核心',
  ready: '引擎就绪',
  reading: '读取输入',
  writing: '写入虚拟文件',
  converting: '执行转换',
  output: '读取输出',
  done: '输出已校验',
  cancelled: 'Worker已终止',
  error: '操作失败',
}

function wavArguments(source: string, maxSeconds: number) {
  return [
    '-hide_banner',
    '-y',
    '-i',
    source,
    '-vn',
    '-ac',
    '1',
    '-ar',
    '16000',
    '-c:a',
    'pcm_s16le',
    '-t',
    String(maxSeconds),
    '-f',
    'wav',
    'output.wav',
  ]
}

export default function FFmpegExample({ level }: { level: Level }) {
  const engine = useRef<FFmpeg | null>(null)
  const session = useRef(0)
  // Synchronous ownership prevents two rapid clicks from sharing virtual FS paths.
  const operation = useRef<number | null>(null)
  const out = useRef<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('引擎尚未加载；不会自动下载WASM或访问远端媒体')
  const [input, setInput] = useState<File | null>(null)
  const [result, setResult] = useState('')
  const [log, setLog] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [sourceSnapshot, setSourceSnapshot] = useState('尚未读取输入')
  const [command, setCommand] = useState<string[] | null>(null)
  const [exitCode, setExitCode] = useState<number | null>(null)
  const [details, setDetails] = useState<ReturnType<typeof inspectPcmWav> | null>(null)
  const [cleanup, setCleanup] = useState('尚未执行文件操作')
  const maxSeconds = level === 'advanced' ? 0.5 : 2

  function clearOutput() {
    if (out.current) {
      URL.revokeObjectURL(out.current)
      out.current = null
    }
    setResult('')
    setDetails(null)
  }
  useEffect(() => {
    // A consuming app can change level without unmounting this heavy worker.
    setLoaded(false)
    setBusy(false)
    setInput(null)
    setResult('')
    setLog('')
    setPhase('idle')
    setSourceSnapshot('尚未读取输入')
    setCommand(null)
    setExitCode(null)
    setDetails(null)
    setCleanup('尚未执行文件操作')
    setStatus(
      level === 'basic'
        ? '原创PCM场景：仅在显式点击后加载本站FFmpeg核心'
        : '本地文件场景：仅在显式点击后加载本站FFmpeg核心',
    )
    return () => {
      session.current++
      operation.current = null
      try {
        engine.current?.terminate()
      } catch {
        /* teardown is best-effort */
      }
      engine.current = null
      if (out.current) {
        URL.revokeObjectURL(out.current)
        out.current = null
      }
    }
  }, [level])

  async function load() {
    if (operation.current !== null || engine.current || loaded) return
    const id = ++session.current
    operation.current = id
    setBusy(true)
    setPhase('loading')
    setLog('')
    clearOutput()
    setExitCode(null)
    setCommand(null)
    setSourceSnapshot('尚未读取输入')
    setCleanup('尚未执行文件操作')
    setStatus('正在从本站加载隔离的FFmpeg核心资源…')
    let candidate: FFmpeg | null = null
    try {
      // A constructor error must also unlock operation.current in finally.
      const ffmpeg = new FFmpeg()
      candidate = ffmpeg
      engine.current = ffmpeg
      ffmpeg.on('log', ({ message }) => {
        if (engine.current === ffmpeg) setLog(message.slice(0, 500))
      })
      const base = new URL(`${import.meta.env.BASE_URL}ffmpeg-core/`, window.location.origin)
      await ffmpeg.load({
        coreURL: new URL('ffmpeg-core.js', base).href,
        wasmURL: new URL('ffmpeg-core.wasm', base).href,
      })
      if (id !== session.current || engine.current !== ffmpeg) {
        ffmpeg.terminate()
        return
      }
      setLoaded(true)
      setPhase('ready')
      setStatus('FFmpeg引擎加载完成，点击执行本地转换')
    } catch (error) {
      try {
        candidate?.terminate()
      } catch {
        /* preserve initial failure */
      }
      if (engine.current === candidate) engine.current = null
      if (id === session.current) {
        setLoaded(false)
        setPhase('error')
        setStatus(`核心初始化或加载失败：${String(error)}。请维护者核对许可复核、同源资源和CSP`)
      }
    } finally {
      if (operation.current === id) {
        operation.current = null
        setBusy(false)
      }
    }
  }

  function cancel() {
    session.current++
    operation.current = null
    engine.current?.terminate()
    engine.current = null
    setLoaded(false)
    setBusy(false)
    clearOutput()
    setPhase('cancelled')
    setCleanup('Worker已销毁，旧虚拟文件系统随实例释放')
    setStatus('已终止Worker；继续转换前须重新加载引擎')
  }

  async function convert() {
    const ffmpeg = engine.current
    if (!ffmpeg || !loaded || operation.current !== null) return
    const id = ++session.current
    operation.current = id
    setBusy(true)
    clearOutput()
    setPhase('reading')
    setExitCode(null)
    setCommand(null)
    setSourceSnapshot('尚未读取输入')
    setCleanup('待本次文件操作结束后清理')
    setLog('')
    setStatus('开始真正FFmpeg转换…')
    let sourceName: string | null = null
    try {
      const selected = level !== 'basic' ? input : null
      // Check File metadata BEFORE arrayBuffer() to avoid allocating huge input.
      if (selected && !isAllowedMediaFile(selected)) {
        throw new Error('仅接受4MiB以内的已知MIME音视频文件')
      }
      const bytes = selected ? new Uint8Array(await selected.arrayBuffer()) : makeToneWav()
      if (id !== session.current || engine.current !== ffmpeg) return
      const ext = selected ? validateInputMedia(selected, bytes) : 'wav'
      sourceName = `input.${ext}`
      setSourceSnapshot(
        `${selected?.name ?? '原创440Hz纯音.wav'} · ${selected?.type ?? 'audio/wav'} · ${bytes.byteLength} bytes`,
      )
      setPhase('writing')
      await ffmpeg.writeFile(sourceName, bytes)
      if (id !== session.current || engine.current !== ffmpeg) return
      const args = wavArguments(sourceName, maxSeconds)
      setCommand(args)
      setPhase('converting')
      const exit = await ffmpeg.exec(args, 12000)
      if (id !== session.current || engine.current !== ffmpeg) return
      setExitCode(exit)
      if (exit !== 0) throw new Error(`FFmpeg exec退出码 ${exit}`)
      setPhase('output')
      const output = await ffmpeg.readFile('output.wav')
      if (typeof output === 'string') throw new Error('FFmpeg返回非二进制结果')
      if (id !== session.current || engine.current !== ffmpeg) return
      const data = new Uint8Array(output)
      const inspected = inspectPcmWav(data, MAX_OUTPUT_BYTES, maxSeconds)
      const blob = new Blob([data], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)
      out.current = url
      setResult(url)
      setDetails(inspected)
      setPhase('done')
      setStatus(`真实FFmpeg转换得到WAV文件：${blob.size} bytes`)
    } catch (error) {
      if (id === session.current) {
        setPhase('error')
        setStatus(`转换失败：${String(error)}`)
      }
    } finally {
      let removed = 0
      const paths = sourceName ? [sourceName, 'output.wav'] : ['output.wav']
      for (const path of paths) {
        try {
          await ffmpeg.deleteFile(path)
          removed++
        } catch {}
      }
      // Old work may settle after cancel and a new FFmpeg instance was created.
      if (operation.current === id) {
        operation.current = null
        setBusy(false)
        setCleanup(`${removed}/${paths.length} 个虚拟文件删除成功；未创建或已终止的文件可不存在`)
      }
    }
  }

  return (
    <section
      className="e19-workshop"
      aria-label="FFmpeg wasm隔离转换实验"
      data-testid="e19-workshop"
      data-phase={phase}
    >
      <h2>
        {level === 'basic'
          ? '原创PCM转换'
          : level === 'business'
            ? '本地小文件音频标准化'
            : '超时、取消和Worker终止'}
      </h2>
      <p>
        把原创纯音或本地小文件转成16kHz单声道PCM16 WAV；输入、虚拟文件和结果都留在本页，没有上传。
      </p>
      <p>
        前提：维护者完成核心再分发许可复核并部署本站ffmpeg-core资源；未满足时加载失败，不会改用CDN。
      </p>
      <div className="demo-controls">
        <button type="button" disabled={busy || loaded} onClick={() => void load()}>
          显式加载WASM引擎
        </button>
        {level !== 'basic' && (
          <label>
            本机音视频（最多4MiB）
            <input
              type="file"
              disabled={busy}
              accept="audio/wav,audio/mpeg,audio/webm,video/mp4,video/webm"
              onChange={(event) => {
                setInput(event.target.files?.[0] ?? null)
                event.currentTarget.value = ''
              }}
            />
          </label>
        )}
        <button type="button" disabled={!loaded || busy} onClick={() => void convert()}>
          执行转换
        </button>
        {level === 'advanced' && (
          <button type="button" disabled={!busy && !loaded} onClick={cancel}>
            立即取消并终止Worker
          </button>
        )}
      </div>
      <p role="status" data-testid="e19-status">
        {status}
      </p>
      <dl className="e19-details">
        <div>
          <dt>当前阶段</dt>
          <dd data-testid="e19-phase">{PHASE_LABELS[phase]}</dd>
        </div>
        <div>
          <dt>输入选择</dt>
          <dd>
            {input
              ? `${input.name} · ${input.type || '未知MIME'} · ${input.size} bytes`
              : '原创1秒、16kHz、440Hz纯音'}
          </dd>
        </div>
        <div>
          <dt>本次读取快照</dt>
          <dd data-testid="e19-input-snapshot">{sourceSnapshot}</dd>
        </div>
        <div>
          <dt>目标</dt>
          <dd>PCM16 / 16000Hz / 1声道 / 最长{maxSeconds}秒</dd>
        </div>
        <div>
          <dt>exec退出码</dt>
          <dd data-testid="e19-exit-code">{exitCode ?? '尚未返回'}</dd>
        </div>
      </dl>
      <p>{command ? '实际传给exec的参数：' : '转换参数预览（尚未执行）：'}</p>
      <pre data-testid="e19-command">
        {(command ?? wavArguments(input ? 'input.<校验后扩展名>' : 'input.wav', maxSeconds)).join(
          ' ',
        )}
      </pre>
      {details && <output data-testid="e19-output-info">{JSON.stringify(details, null, 2)}</output>}
      <p data-testid="e19-cleanup">{cleanup}</p>
      {result && (
        <>
          {/* biome-ignore lint/a11y/useMediaCaption: 本地任意音频没有可核实的自动转写，不以空字幕轨伪装已提供字幕。 */}
          <audio src={result} controls aria-label="真实转换产生的WAV" data-testid="e19-audio" />
          <a href={result} download="output.wav">
            下载本次WAV
          </a>
        </>
      )}
      {level === 'advanced' && (
        <>
          <p>高级输出限制0.5秒。超时不等于完整安全隔离；取消终止当前Worker。</p>
          <pre data-testid="e19-log">{log || '尚无FFmpeg日志'}</pre>
        </>
      )}
    </section>
  )
}
