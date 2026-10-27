import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ComponentProps } from 'react';
import {
  Excalidraw,
  convertToExcalidrawElements,
  exportToBlob,
  loadFromBlob,
} from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import './styles.css';

type Level = 'basic' | 'business' | 'advanced';
type EditorApi = Parameters<NonNullable<ComponentProps<typeof Excalidraw>['excalidrawAPI']>>[0];
const MAX_IMPORT_BYTES = 1_500_000;
const MAX_ELEMENTS = 200;

function isAllowedLink(url: string | null | undefined) {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function initialWorkflow() {
  return convertToExcalidrawElements([
    { type: 'rectangle', x: 40, y: 65, width: 165, height: 100, backgroundColor: '#e7f5ef', label: { text: 'RSS 获取' } },
    { type: 'rectangle', x: 270, y: 65, width: 165, height: 100, backgroundColor: '#fff2ce', label: { text: '清洗 / 分类' } },
    { type: 'rectangle', x: 500, y: 65, width: 165, height: 100, backgroundColor: '#e8edff', label: { text: '人工审核' } },
    { type: 'arrow', x: 210, y: 110, width: 52, height: 0, endArrowhead: 'triangle' },
    { type: 'arrow', x: 440, y: 110, width: 52, height: 0, endArrowhead: 'triangle' },
  ]);
}

function saveBlob(blob: Blob, name: string, urls: Set<string>) {
  const url = URL.createObjectURL(blob);
  urls.add(url);
  const link = document.createElement('a');
  link.download = name;
  link.href = url;
  document.body.append(link);
  link.click();
  link.remove();
  // A delay allows the download to start; remaining URLs are revoked on unmount.
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    urls.delete(url);
  }, 2000);
}

export default function ExcalidrawWorkshop({ level }: { level: Level }) {
  const apiRef = useRef<EditorApi | null>(null);
  const urlsRef = useRef(new Set<string>());
  const reportTimer = useRef<number | undefined>(undefined);
  const [count, setCount] = useState(0);
  const [readOnly, setReadOnly] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('所有画板数据仅在本页面内存中，未同步到服务器。');
  const seed = useMemo(() => level === 'basic' ? undefined : ({ elements: initialWorkflow(), appState: { viewBackgroundColor: '#fffdf7' } }), [level]);

  useEffect(() => () => {
    apiRef.current = null;
    if (reportTimer.current !== undefined) window.clearTimeout(reportTimer.current);
    for (const url of urlsRef.current) URL.revokeObjectURL(url);
    urlsRef.current.clear();
  }, []);

  const onChange = useCallback((elements: readonly { isDeleted?: boolean }[]) => {
    if (reportTimer.current !== undefined) window.clearTimeout(reportTimer.current);
    const current = elements.filter(item => !item.isDeleted).length;
    reportTimer.current = window.setTimeout(() => setCount(current), 160);
  }, []);

  function clearCurrentScene() {
    apiRef.current?.resetScene();
    setMessage('仅重置当前画布。不会清除浏览器、其他库或用户数据。');
  }

  async function exportPng() {
    const api = apiRef.current;
    if (!api) return;
    const elements = api.getSceneElements();
    if (!elements.length) { setMessage('画布为空，请先绘制至少一个元素。'); return; }
    setWorking(true);
    try {
      const blob = await exportToBlob({
        elements,
        appState: { ...api.getAppState(), exportBackground: true, exportWithDarkMode: false },
        files: api.getFiles(),
        mimeType: 'image/png',
        maxWidthOrHeight: 2048,
      });
      if (!blob) throw new Error('未生成 PNG');
      saveBlob(blob, 'reactloom-workflow.png', urlsRef.current);
      setMessage('已生成本地 PNG (' + blob.size + ' 字节)，未上传任何服务器。');
    } catch (error) { setMessage('PNG 导出失败：' + String(error)); }
    finally { setWorking(false); }
  }

  async function importScene(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    if (!apiRef.current) { setMessage('编辑器未就绪'); return; }
    if (file.size > MAX_IMPORT_BYTES) { setMessage('导入文件最大允许 1.5 MB'); return; }
    setWorking(true);
    try {
      const restored = await loadFromBlob(file, null, null);
      const elements = restored.elements ?? [];
      if (elements.length > MAX_ELEMENTS) throw new Error('元素超过 200 个，本实验不允许大批量导入');
      if (elements.some(element => !isAllowedLink(element.link))) throw new Error('存在不安全的元素链接');
      if (restored.files && Object.keys(restored.files).length) throw new Error('当前教学导入不接受含二进制附件的画板');
      apiRef.current.updateScene({ elements, appState: { viewBackgroundColor: '#fffdf7' } });
      setMessage('已通过 Excalidraw SDK 导入 ' + elements.length + ' 个元素；仅影响当前页面。');
    } catch (error) { setMessage('导入已拒绝：' + String(error)); }
    finally { setWorking(false); }
  }

  return (
    <section aria-label="Excalidraw 手绘白板实验" className="ab-excalidraw">
      <h2>{level === 'basic' ? '入门：真实 Excalidraw 画布' : level === 'business' ? '业务：RSS 内容流草图' : '进阶：导出、受限导入、只读模式'}</h2>
      <p>选择矩形、箭头或文字并直接编辑画布。原生编辑工具由 Excalidraw 提供，不是模拟的 SVG。</p>
      <div className="ab-actions" role="group" aria-label="白板操作">
        <button type="button" onClick={clearCurrentScene}>重置当前画布</button>
        {level !== 'basic' && <button type="button" onClick={() => {
          apiRef.current?.updateScene({ elements: initialWorkflow() });
          setMessage('已重新加载本地 RSS 工作流骨架。');
        }}>恢复流程草图</button>}
        {level === 'advanced' && <>
          <label><input type="checkbox" checked={readOnly} onChange={event => setReadOnly(event.target.checked)} />只读演示</label>
          <button type="button" disabled={working} onClick={() => void exportPng()}>下载 PNG</button>
          <label>导入 .excalidraw 文件
            <input type="file" accept=".excalidraw,.json,application/json" disabled={working} onChange={event => void importScene(event)} />
          </label>
        </>}
      </div>
      <p role="status" aria-live="polite">非删除元素数：{count} · {message}</p>
      <div className="ab-excalidraw-canvas">
        <Excalidraw
          langCode="zh-CN"
          autoFocus={false}
          handleKeyboardGlobally={false}
          viewModeEnabled={readOnly}
          initialData={seed}
          excalidrawAPI={api => { apiRef.current = api; }}
          onChange={onChange}
          onLinkOpen={(element, event) => {
            if (!isAllowedLink(element.link)) {
              event.preventDefault();
              setMessage('阻止了非 HTTP(S) 链接。');
            }
          }}
        />
      </div>
      <ol className="ab-instructions">
        <li>数据没有持久化：切换场景或离开 Tab 后释放画布状态。</li>
        <li>原版默认尝试从 CDN 加载字体；生产应按官方文档自托管合法字体资源。</li>
        <li>画布无法替代可访问的结构化步骤说明：RSS 获取 → 清洗分类 → 审核。</li>
      </ol>
    </section>
  );
}
