import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Cropper from 'react-easy-crop';
import { checkImageFile, checkImageDimensions, checkCropArea } from './crop-policy.mjs';

type Props = { level: 'basic' | 'business' | 'advanced' };
type Area = { x: number; y: number; width: number; height: number };
function sampleImage(): string {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">' +
    '<rect width="1200" height="800" fill="#e7f0df"/>' +
    '<circle cx="620" cy="370" r="270" fill="#7cab97"/>' +
    '<path d="M0 580 Q380 260 640 570 T1200 530 V800 H0Z" fill="#356b64"/>' +
    '<text x="65" y="130" font-size="48" fill="#264f48" font-family="sans-serif">ReactLoom Cover</text></svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
const sample = sampleImage();

async function cropToPng(source: string, area: Area): Promise<Blob> {
  const image = new Image();
  image.src = source;
  await image.decode();
  checkImageDimensions(image.naturalWidth, image.naturalHeight);
  // croppedAreaPixels is rounded by react-easy-crop; validate before allocating a Canvas.
  const { x, y, width, height } = checkCropArea(area, image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('无法创建Canvas上下文');
  context.drawImage(image, x, y, width, height, 0, 0, canvas.width, canvas.height);
  return new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob && blob.size > 0 ? resolve(blob) : reject(new Error('无法编码PNG')), 'image/png'));
}

export default function EasyCropExample({ level }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [localUrl, setLocalUrl] = useState('');
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkingFile, setCheckingFile] = useState(false);
  const generation = useRef(0);
  const activeExport = useRef(0);
  const source = localUrl || sample;
  const aspect = level === 'basic' ? 1 : level === 'business' ? 16 / 9 : 4 / 3;

  useEffect(() => {
    if (!localFile) { setLocalUrl(''); return; }
    const url = URL.createObjectURL(localFile);
    setLocalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [localFile]);

  useEffect(() => {
    if (!resultBlob) { setResultUrl(''); return; }
    const url = URL.createObjectURL(resultBlob);
    setResultUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [resultBlob]);

  useEffect(() => {
    generation.current += 1;
    activeExport.current = 0;
    setArea(null);
    setResultBlob(null);
    setBusy(false);
    setError('');
  }, [source, aspect, zoom]);

  useEffect(() => () => { generation.current += 1; activeExport.current = 0; }, []);

  function invalidateOutput() {
    generation.current += 1;
    activeExport.current = 0;
    setArea(null);
    setResultBlob(null);
    setBusy(false);
  }

  function changeCrop(next: { x: number; y: number }) {
    invalidateOutput();
    setCrop(next);
  }

  function changeZoom(next: number) {
    if (next === zoom) return;
    invalidateOutput();
    setZoom(next);
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    invalidateOutput();
    const requestId = generation.current;
    setCheckingFile(true);
    try {
      checkImageFile(file);
      // File size alone cannot bound the number of decoded pixels.
      const bitmap = await createImageBitmap(file);
      try {
        checkImageDimensions(bitmap.width, bitmap.height);
      } finally {
        bitmap.close();
      }
      if (requestId !== generation.current) return;
      setError('');
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setLocalFile(file);
    } catch (cause) {
      if (requestId === generation.current) setError('图片检查失败：' + String(cause));
    } finally {
      if (requestId === generation.current) setCheckingFile(false);
    }
  }

  async function exportCrop() {
    if (activeExport.current || checkingFile) return; // synchronous gate for double-clicks
    if (!area) { setError('请等待媒体加载和裁剪区域计算完成'); return; }
    const id = ++generation.current;
    activeExport.current = id;
    setError('');
    setBusy(true);
    try {
      const blob = await cropToPng(source, area);
      if (id === generation.current && activeExport.current === id) setResultBlob(blob);
    } catch (cause) {
      if (id === generation.current && activeExport.current === id) setError(String(cause));
    } finally {
      // A cancelled older export must never release a newer export's gate.
      if (activeExport.current === id) {
        activeExport.current = 0;
        setBusy(false);
      }
    }
  }

  return (
    <section aria-label="react-easy-crop 真实裁剪示例">
      <h2>{level === 'basic' ? '方形裁剪框' : level === 'business' ? '新闻封面 16:9' : '本地文件与像素边界'}</h2>
      <p>拖动图像调整位置，使用缩放滑块；高级模式可选本机照片。所有文件均留在浏览器。</p>
      {level === 'advanced' && <label>选择本地图片 <input aria-label="选择本地图片" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { void chooseFile(event); }} /></label>}
      <div style={{ position: 'relative', height: 330, marginTop: 16, background: '#192e2b', overflow: 'hidden', borderRadius: 10 }}>
        <Cropper image={source} crop={crop} zoom={zoom} minZoom={1} maxZoom={3}
          aspect={aspect} onCropChange={changeCrop} onZoomChange={changeZoom}
          onCropComplete={(_, pixels) => { if (!checkingFile) setArea(pixels); }} />
      </div>
      <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
        <label htmlFor="crop-zoom">缩放 {zoom.toFixed(1)}</label>
        <input id="crop-zoom" type="range" min="1" max="3" step=".1" value={zoom}
          onChange={event => changeZoom(Number(event.target.value))} />
        <button type="button" disabled={busy || checkingFile || !area} onClick={() => void exportCrop()}>
          {busy ? '处理中…' : checkingFile ? '检查图片…' : '裁剪并导出PNG'}
        </button>
      </div>
      {area && <p>真实裁剪像素：{JSON.stringify(area)}</p>}
      {error && <p role="alert">{error}</p>}
      {resultUrl && <figure><img src={resultUrl} alt="由Canvas生成的裁剪图" style={{ maxWidth: '100%', maxHeight: 250 }} /><figcaption>PNG输出：{resultBlob?.size ?? 0}字节，可另存，不上传</figcaption></figure>}
      <p>本例不处理旋转；如加入 rotation，必须同步更改导出几何算法。当前结果不是服务器裁剪，也不会保留原图EXIF。</p>
    </section>
  );
}
