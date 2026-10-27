import {useEffect, useRef, useState} from 'react';
import {FFmpeg} from '@ffmpeg/ffmpeg';
import {makeToneWav} from './wav';
import {isAllowedMediaFile, validateInputMedia, validateOutputWav} from './input-policy.mjs';

type Level = 'basic' | 'business' | 'advanced';
export default function FFmpegExample({level}: {level: Level}) {
  const engine = useRef<FFmpeg | null>(null);
  const session = useRef(0);
  // Synchronous ownership prevents two rapid clicks from sharing virtual FS paths.
  const operation = useRef<number | null>(null);
  const out = useRef<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('引擎尚未加载；不会自动下载WASM或访问远端媒体');
  const [input, setInput] = useState<File | null>(null);
  const [result, setResult] = useState('');
  const [log, setLog] = useState('');

  function clearOutput() {
    if (out.current) {
      URL.revokeObjectURL(out.current);
      out.current = null;
    }
    setResult('');
  }
  useEffect(() => () => {
    session.current++;
    operation.current = null;
    engine.current?.terminate();
    engine.current = null;
    if (out.current) URL.revokeObjectURL(out.current);
  }, []);

  async function load() {
    if (operation.current !== null || engine.current || loaded) return;
    const id = ++session.current;
    operation.current = id;
    setBusy(true);
    setStatus('正在从本站加载隔离的FFmpeg核心资源…');
    const ffmpeg = new FFmpeg();
    engine.current = ffmpeg;
    ffmpeg.on('log', ({message}) => {
      if (engine.current === ffmpeg) setLog(message.slice(0, 500));
    });
    const base = new URL(import.meta.env.BASE_URL + 'ffmpeg-core/', window.location.origin);
    try {
      await ffmpeg.load({
        coreURL: new URL('ffmpeg-core.js', base).href,
        wasmURL: new URL('ffmpeg-core.wasm', base).href,
      });
      if (id !== session.current || engine.current !== ffmpeg) {
        ffmpeg.terminate();
        return;
      }
      setLoaded(true);
      setStatus('FFmpeg引擎加载完成，点击执行本地转换');
    } catch (error) {
      ffmpeg.terminate();
      if (engine.current === ffmpeg) engine.current = null;
      if (id === session.current) {
        setLoaded(false);
        setStatus('核心加载失败：' + String(error) + '。请PLATFORM核对同源资源和CSP');
      }
    } finally {
      if (operation.current === id) {
        operation.current = null;
        setBusy(false);
      }
    }
  }

  function cancel() {
    session.current++;
    operation.current = null;
    engine.current?.terminate();
    engine.current = null;
    setLoaded(false);
    setBusy(false);
    clearOutput();
    setStatus('已终止Worker；继续转换前须重新加载引擎');
  }

  async function convert() {
    const ffmpeg = engine.current;
    if (!ffmpeg || !loaded || operation.current !== null) return;
    const id = ++session.current;
    operation.current = id;
    setBusy(true);
    clearOutput();
    setStatus('开始真正FFmpeg转换…');
    let sourceName: string | null = null;
    try {
      const selected = level !== 'basic' ? input : null;
      // Check File metadata BEFORE arrayBuffer() to avoid allocating huge input.
      if (selected && !isAllowedMediaFile(selected)) {
        throw new Error('仅接受4MiB以内的已知MIME音视频文件');
      }
      const bytes = selected
        ? new Uint8Array(await selected.arrayBuffer())
        : makeToneWav();
      if (id !== session.current || engine.current !== ffmpeg) return;
      const ext = selected ? validateInputMedia(selected, bytes) : 'wav';
      sourceName = 'input.' + ext;
      await ffmpeg.writeFile(sourceName, bytes);
      if (id !== session.current || engine.current !== ffmpeg) return;
      const exit = await ffmpeg.exec([
        '-hide_banner', '-y', '-i', sourceName, '-vn', '-ac', '1',
        '-ar', '16000', '-t', level === 'advanced' ? '0.5' : '2',
        '-f', 'wav', 'output.wav',
      ], 12000);
      if (id !== session.current || engine.current !== ffmpeg) return;
      if (exit !== 0) throw new Error('FFmpeg exec退出码 ' + exit);
      const output = await ffmpeg.readFile('output.wav');
      if (typeof output === 'string') throw new Error('FFmpeg返回非二进制结果');
      if (id !== session.current || engine.current !== ffmpeg) return;
      const data = new Uint8Array(output);
      validateOutputWav(data);
      const blob = new Blob([data], {type: 'audio/wav'});
      const url = URL.createObjectURL(blob);
      out.current = url;
      setResult(url);
      setStatus('真实FFmpeg转换得到WAV文件：' + blob.size + ' bytes');
    } catch (error) {
      if (id === session.current) setStatus('转换失败：' + String(error));
    } finally {
      if (sourceName) {
        try { await ffmpeg.deleteFile(sourceName); } catch {}
      }
      try { await ffmpeg.deleteFile('output.wav'); } catch {}
      // Old work may settle after cancel and a new FFmpeg instance was created.
      if (operation.current === id) {
        operation.current = null;
        setBusy(false);
      }
    }
  }

  return <section aria-label="FFmpeg wasm隔离转换实验">
    <h2>{level === 'basic' ? '原创PCM转换' : level === 'business'
      ? '本地小文件音频标准化' : '超时、取消和Worker终止'}</h2>
    <p>仅在点击后从本站 /ffmpeg-core/ 加载WASM。PLATFORM需同源部署核验版本的核心资产。</p>
    <div className="demo-controls">
      <button type="button" disabled={busy || loaded} onClick={() => void load()}>
        显式加载WASM引擎
      </button>
      {level !== 'basic' && <label>本机音视频（最多4MiB）
        <input type="file" accept="audio/wav,audio/mpeg,audio/webm,video/mp4,video/webm"
          onChange={event => {
            setInput(event.target.files?.[0] ?? null);
            event.currentTarget.value = '';
          }}/>
      </label>}
      <button type="button" disabled={!loaded || busy} onClick={() => void convert()}>
        执行转换
      </button>
      {level === 'advanced' && <button type="button" onClick={cancel}>
        立即取消并终止Worker
      </button>}
    </div>
    <p role="status">{status}</p>
    {result && <audio src={result} controls aria-label="真实转换产生的WAV"/>}
    {level === 'advanced' && <>
      <p>高级输出限制0.5秒。超时不等于完整安全隔离；取消终止当前Worker。</p>
      <pre style={{whiteSpace: 'pre-wrap'}}>{log}</pre>
    </>}
  </section>;
}
