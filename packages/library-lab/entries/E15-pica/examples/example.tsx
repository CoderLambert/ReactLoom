import { useEffect, useMemo, useRef, useState } from 'react';
import pica from 'pica';
import { checkSourceFile, checkSourcePixels, targetDimensions } from './resize-policy.mjs';

type Props = { level: 'basic' | 'business' | 'advanced' };

function paint(canvas: HTMLCanvasElement) {
  canvas.width = 1280;
  canvas.height = 800;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas不可用');
  const gradient = context.createLinearGradient(0, 0, 1280, 800);
  gradient.addColorStop(0, '#183f52');
  gradient.addColorStop(1, '#9acb9c');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 100; i += 1) {
    context.fillStyle = i % 2 ? '#f8e3ad' : '#ffffff';
    context.globalAlpha = 0.15;
    context.beginPath();
    context.arc((i * 211) % 1280, (i * 131) % 800, 7 + (i % 9) * 4, 0, 2 * Math.PI);
    context.fill();
  }
  context.globalAlpha = 1;
  context.fillStyle = '#ffffff';
  context.font = 'bold 64px sans-serif';
  context.fillText('ReactLoom / pica', 100, 180);
}

async function loadIntoCanvas(file: File): Promise<HTMLCanvasElement> {
  checkSourceFile(file);
  const bitmap = await createImageBitmap(file);
  try {
    checkSourcePixels(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('缺少Canvas上下文');
    context.drawImage(bitmap, 0, 0);
    return canvas;
  } finally {
    bitmap.close();
  }
}

// Keyed session isolates all local file/result state on demo-level changes.
export default function PicaExample({ level }: Props) {
  return <PicaSession key={level} level={level} />;
}

function PicaSession({ level }: Props) {
  const resizer = useMemo(() => pica(), []);
  const sampleCanvas = useRef<HTMLCanvasElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [edge, setEdge] = useState(480);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [nativeBlob, setNativeBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState('');
  const [nativeUrl, setNativeUrl] = useState('');
  const [status, setStatus] = useState('尚未开始');
  const [running, setRunning] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);
  const generation = useRef(0);
  const operationRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => { if (sampleCanvas.current) paint(sampleCanvas.current); }, []);
  useEffect(() => {
    if (!resultBlob) { setResultUrl(''); return; }
    const url = URL.createObjectURL(resultBlob);
    setResultUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [resultBlob]);
  useEffect(() => {
    if (!nativeBlob) { setNativeUrl(''); return; }
    const url = URL.createObjectURL(nativeBlob);
    setNativeUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [nativeBlob]);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      generation.current += 1;
      cancelRef.current?.();
      cancelRef.current = null;
    };
  }, []);

  function invalidate(reason: string) {
    generation.current += 1;
    cancelRef.current?.();
    cancelRef.current = null;
    setResultBlob(null);
    setNativeBlob(null);
    // The cancelled Promise may still be decoding or encoding; do not overlap heavy work.
    setStatus(operationRef.current ? reason + '；等待旧任务结束' : reason);
    if (!operationRef.current) setRunning(false);
  }

  async function execute() {
    if (operationRef.current) return; // synchronous single-flight, not only React disabled state
    operationRef.current = true;
    const id = ++generation.current;
    setRunning(true);
    setStatus('解码或绘制中…');
    setResultBlob(null);
    setNativeBlob(null);
    try {
      let source: HTMLCanvasElement;
      if (file) source = await loadIntoCanvas(file);
      else if (sampleCanvas.current) source = sampleCanvas.current;
      else throw new Error('示例画布不存在');
      if (id !== generation.current) return;
      const { width, height } = targetDimensions(source.width, source.height, edge);
      const target = document.createElement('canvas');
      target.width = width;
      target.height = height;
      let rejectCancel: (reason: Error) => void = () => undefined;
      const cancelToken = new Promise<void>((_, reject) => { rejectCancel = reject; });
      cancelRef.current = () => rejectCancel(new Error('用户取消本次缩放'));
      setStatus('正在调用真实 pica.resize…');
      await resizer.resize(source, target, { cancelToken });
      // resize has settled; cancellation now only invalidates stale toBlob results.
      if (id === generation.current) cancelRef.current = null;
      if (id !== generation.current) return;
      const blob = await resizer.toBlob(target, 'image/png');
      if (id !== generation.current) return;
      setResultBlob(blob);
      if (level === 'advanced') {
        const native = document.createElement('canvas');
        native.width = width;
        native.height = height;
        native.getContext('2d')?.drawImage(source, 0, 0, width, height);
        const original = await new Promise<Blob>((resolve, reject) =>
          native.toBlob(value => value ? resolve(value) : reject(new Error('原生Canvas编码失败')), 'image/png'));
        if (id === generation.current) setNativeBlob(original);
      }
      if (id === generation.current) setStatus('缩放完成：' + width + ' × ' + height);
    } catch (error) {
      if (id === generation.current) setStatus('失败或取消：' + String(error));
    } finally {
      operationRef.current = false;
      if (mountedRef.current) {
        if (id === generation.current) cancelRef.current = null;
        setRunning(false);
      }
    }
  }

  function cancel() {
    invalidate('取消请求已发送，旧结果不会回写');
  }

  return (
    <section aria-label="pica 真实缩放示例">
      <h2>{level === 'basic' ? 'Canvas高质量缩放' : level === 'business' ? '本地图片预处理' : 'Pica与浏览器原生缩放'}</h2>
      <p>真实pica v10工厂实例和 resize/toBlob，首次打开Demo才加载SDK。输入不上传；不同引擎的质量不以文件字节直接评判。</p>
      <canvas ref={sampleCanvas} aria-label="原创图像源数据" style={{ maxWidth: '100%', width: 360, borderRadius: 9 }} />
      {level !== 'basic' && <label>选择本地图片 <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => {
        const selected = e.target.files?.[0];
        e.target.value = '';
        if (!selected) return;
        invalidate('已选择新来源，旧图片处理结果已失效');
        try { checkSourceFile(selected); setFile(selected); }
        catch (error) { setFile(null); setStatus('文件不符合限制：' + String(error)); }
      }} /></label>}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
        <label htmlFor="pica-edge">目标最长边</label>
        <select id="pica-edge" disabled={running} value={edge} onChange={e => { invalidate('尺寸已改变，等待重新缩放'); setEdge(Number(e.target.value)); }}>
          {[240,480,800].map(value => <option key={value} value={value}>{value}px</option>)}
        </select>
        <button type="button" disabled={running} onClick={() => void execute()}>调用pica缩放</button>
        <button type="button" disabled={!running} onClick={cancel}>取消本次处理</button>
      </div>
      <p role="status">{status}</p>
      {resultUrl && <figure><img src={resultUrl} alt="真实pica生成的缩小图像" style={{ maxWidth: '100%' }} /><figcaption>pica PNG: {resultBlob?.size ?? 0}字节</figcaption></figure>}
      {level === 'advanced' && nativeUrl && <figure><img src={nativeUrl} alt="原生Canvas缩放对照图" style={{ maxWidth: '100%' }} /><figcaption>原生Canvas PNG: {nativeBlob?.size ?? 0}字节；文件体积不是视觉质量指标</figcaption></figure>}
      <p>任务单飞：取消或换图后必须等待旧Promise结算再启动下一次；cancelToken和generation阻止旧结果回写。内部Worker按pica的idle策略释放，仍需真实浏览器/CSP验证。</p>
    </section>
  );
}
