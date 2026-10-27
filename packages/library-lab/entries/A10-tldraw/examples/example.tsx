import { useCallback, useEffect, useRef, useState } from 'react';
import { serializeSnapshot } from './snapshot-policy';
import {
  Tldraw,
  createShapeId,
  getSnapshot,
  toRichText,
  type Editor,
} from 'tldraw';
import 'tldraw/tldraw.css';
import './styles.css';

type Level = 'basic' | 'business' | 'advanced';
const MAX_PROGRAMMATIC_SHAPES = 80;
const FLOW = [
  { label: 'RSS 获取', x: 60, color: 'blue' },
  { label: '正文清洗', x: 300, color: 'green' },
  { label: '分类摘要', x: 540, color: 'yellow' },
  { label: '人工审核', x: 780, color: 'violet' },
] as const;

function downloadJson(doc: unknown, name: string, urls: Set<string>, timers: Set<number>) {
  const blob = new Blob([serializeSnapshot(doc)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  urls.add(url);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  const timer = window.setTimeout(() => {
    URL.revokeObjectURL(url);
    urls.delete(url);
    timers.delete(timer);
  }, 1500);
  timers.add(timer);
}

function createFlow(editor: Editor) {
  editor.run(() => {
    const current = editor.getCurrentPageShapes().length;
    if (current + FLOW.length > MAX_PROGRAMMATIC_SHAPES) return;
    const top = 50 + Math.ceil(current / 4) * 160;
    for (const node of FLOW) {
      editor.createShape({
        id: createShapeId(),
        type: 'geo',
        x: node.x,
        y: top,
        props: {
          geo: 'rectangle',
          w: 195,
          h: 96,
          color: node.color,
          richText: toRichText(node.label),
        },
      });
    }
  });
}

export default function TldrawWorkshop({ level }: { level: Level }) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [count, setCount] = useState(0);
  const [readonly, setReadonly] = useState(false);
  const [status, setStatus] = useState('仅当前实例内存数据；不连接服务器和共享缓存。');
  const downloadUrls = useRef(new Set<string>());
  const downloadTimers = useRef(new Set<number>());
  useEffect(() => () => {
    for (const timer of downloadTimers.current) window.clearTimeout(timer);
    downloadTimers.current.clear();
    for (const url of downloadUrls.current) URL.revokeObjectURL(url);
    downloadUrls.current.clear();
  }, []);
  const licenseKey = import.meta.env.VITE_TLDRAW_LICENSE_KEY as string | undefined;
  const isLocalHost = typeof window !== 'undefined' && ['localhost','127.0.0.1','::1'].includes(window.location.hostname);
  const canMount = Boolean(licenseKey) || isLocalHost;

  const onMount = useCallback((instance: Editor) => {
    setEditor(instance);
    if (level !== 'basic') createFlow(instance);
    // Store changes also include shape moves: do not rerender the host on each pointer move.
    let previousCount = instance.getCurrentPageShapes().length;
    setCount(previousCount);
    const unsubscribe = instance.store.listen(() => {
      const nextCount = instance.getCurrentPageShapes().length;
      if (nextCount !== previousCount) {
        previousCount = nextCount;
        setCount(nextCount);
      }
    }, { scope: 'document' });
    // Editor handles its own document and graphics teardown.
    return () => unsubscribe();
  }, [level]);

  useEffect(() => {
    if (!editor) return;
    editor.updateInstanceState({ isReadonly: readonly });
  }, [editor, readonly]);

  function toggleReadonly() {
    if (!editor) return;
    const next = !editor.getIsReadonly();
    setReadonly(next);
    setStatus(next ? '当前实例只读：形状编辑被 SDK 拦截；生产 API 仍须自行鉴权。' : '恢复当前实例编辑。');
  }

  function addProcess() {
    if (!editor || editor.getIsReadonly()) return;
    if (editor.getCurrentPageShapes().length + FLOW.length > MAX_PROGRAMMATIC_SHAPES) {
      setStatus('本示例的自动新增上限为80个形状；原生绘图工具不受此按钮限制。');
      return;
    }
    createFlow(editor);
    editor.zoomToFit();
    setStatus('通过真实 Editor.createShape 创建4个可拖动的业务节点。');
  }

  function addBoundedBatch() {
    if (!editor || editor.getIsReadonly()) return;
    const current = editor.getCurrentPageShapes().length;
    const capacity = Math.max(0, MAX_PROGRAMMATIC_SHAPES - current);
    const amount = Math.min(36, capacity);
    editor.run(() => {
      for (let n = 0; n < amount; n++) {
        editor.createShape({
          id: createShapeId(),
          type: 'geo',
          x: (n % 9) * 120,
          y: 420 + Math.floor(n / 9) * 85,
          props: { geo: 'rectangle', w: 105, h: 65, color: 'light-blue', richText: toRichText('任务 ' + (n + 1)) },
        });
      }
    });
    editor.zoomToFit();
    setStatus('批量新增 ' + amount + ' 个形状（程序化按钮受80总量限制）；未做性能基准测试。');
  }

  function clearLocal() {
    if (!editor || editor.getIsReadonly()) return;
    editor.deleteShapes(editor.getCurrentPageShapes().map(shape => shape.id));
    setStatus('仅删除当前页面的形状，不清空浏览器或其他 Lab 条目缓存。');
  }

  function exportDocument() {
    if (!editor) return;
    try {
      const snapshot = getSnapshot(editor.store);
      downloadJson({
        kind: 'tldraw-demo-document',
        version: 1,
        source: 'ReactLoom Library Lab A10',
        document: snapshot.document,
      }, 'rss-board.tldraw.json', downloadUrls.current, downloadTimers.current);
      setStatus('已下载真实 tldraw store 文档快照；不包括相机/选择等会话状态。');
    } catch (error) {
      setStatus('下载失败：' + String(error));
    }
  }

  if (!canMount) {
    return <section className="ab-tldraw-locked" role="note">
      <h2>tldraw 生产授权未配置</h2>
      <p>tldraw 5.5.2 要求符合其许可证的有效生产 key。本实验没有伪造 key、绕过水印或代替你购买授权。</p>
      <p>请在本机 localhost 使用开发预览，或在正式部署前合法配置 VITE_TLDRAW_LICENSE_KEY。文档与真实源码仍可阅读。</p>
    </section>;
  }

  return <section className="ab-tldraw">
    <h2>{level === 'basic' ? '入门：可编辑无限画布' : level === 'business' ? '业务：RSS 处理节点白板' : '进阶：只读、安全边界与有限批量形状'}</h2>
    <p>选择画布工具绘图，或点击按钮使用 SDK 的 Editor API。演示不启用 persistenceKey，避免跨条目或跨标签页遗留 IndexedDB。</p>
    <div className="ab-tldraw-controls" role="group" aria-label="画板操作">
      {level !== 'basic' && <button type="button" disabled={!editor || readonly} onClick={addProcess}>追加4个流程节点</button>}
      {level === 'advanced' && <>
        <button type="button" disabled={!editor || readonly} onClick={addBoundedBatch}>有界批量创建形状</button>
        <button type="button" disabled={!editor} onClick={toggleReadonly}>{readonly ? '退出只读' : '切换只读'}</button>
      </>}
      <button type="button" disabled={!editor || readonly} onClick={clearLocal}>清空当前形状</button>
      <button type="button" disabled={!editor} onClick={exportDocument}>下载文档 JSON</button>
      <button type="button" disabled={!editor} onClick={() => editor?.zoomToFit()}>缩放适合画布</button>
    </div>
    <p role="status" aria-live="polite">当前形状 {count} · 示例程序化新增限制为画布总量 {MAX_PROGRAMMATIC_SHAPES}（原生绘制不限） · {status}</p>
    <div className="ab-tldraw-canvas" aria-label="tldraw 真实可编辑画布">
      <Tldraw autoFocus={false} licenseKey={licenseKey} onMount={onMount} />
    </div>
    <p className="ab-tldraw-note">画布仅供视觉操作；HTML 说明提供等价步骤：RSS 获取 → 正文清洗 → 分类摘要 → 人工审核。只读是前端实例态，服务端仍必须核验权限。</p>
  </section>;
}
