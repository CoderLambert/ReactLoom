import { useCallback, useEffect, useRef, useState } from 'react'
import { createShapeId, type Editor, getSnapshot, loadSnapshot, Tldraw, toRichText } from 'tldraw'
import { serializeSnapshot } from './snapshot-policy'
import 'tldraw/tldraw.css'
import './styles.css'

type Level = 'basic' | 'business' | 'advanced'
const MAX_PROGRAMMATIC_SHAPES = 80
type SavedDocument = {
  document: ReturnType<typeof getSnapshot>['document']
  shapeIds: string[]
  bytes: number
}
const FLOW = [
  { label: 'RSS 获取', x: 60, color: 'blue' },
  { label: '正文清洗', x: 300, color: 'green' },
  { label: '分类摘要', x: 540, color: 'yellow' },
  { label: '人工审核', x: 780, color: 'violet' },
] as const

function downloadJson(doc: unknown, name: string, urls: Set<string>, timers: Set<number>) {
  const blob = new Blob([serializeSnapshot(doc)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  urls.add(url)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  const timer = window.setTimeout(() => {
    URL.revokeObjectURL(url)
    urls.delete(url)
    timers.delete(timer)
  }, 1500)
  timers.add(timer)
}

function createFlow(editor: Editor) {
  editor.run(() => {
    const current = editor.getCurrentPageShapes().length
    if (current + FLOW.length > MAX_PROGRAMMATIC_SHAPES) return
    const top = 50 + Math.ceil(current / 4) * 160
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
      })
    }
  })
}

export default function TldrawWorkshop({ level }: { level: Level }) {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [shapeIds, setShapeIds] = useState<string[]>([])
  const [readonly, setReadonly] = useState(false)
  const [saved, setSaved] = useState<SavedDocument | null>(null)
  const [status, setStatus] = useState('仅当前实例内存数据；不连接服务器和共享缓存。')
  const activeEditor = useRef<Editor | null>(null)
  const seededEditors = useRef(new WeakSet<Editor>())
  const downloadUrls = useRef(new Set<string>())
  const downloadTimers = useRef(new Set<number>())
  useEffect(
    () => () => {
      for (const timer of downloadTimers.current) window.clearTimeout(timer)
      downloadTimers.current.clear()
      for (const url of downloadUrls.current) URL.revokeObjectURL(url)
      downloadUrls.current.clear()
    },
    [],
  )
  const licenseKey = import.meta.env.VITE_TLDRAW_LICENSE_KEY as string | undefined
  const isLocalHost =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1', '[::1]', '::1'].includes(window.location.hostname)
  const canMount = Boolean(licenseKey) || isLocalHost

  const onMount = useCallback(
    (instance: Editor) => {
      activeEditor.current = instance
      setEditor(instance)
      instance.updateInstanceState({ isReadonly: false })
      setReadonly(false)
      setSaved(null)
      if (level !== 'basic' && !seededEditors.current.has(instance)) {
        createFlow(instance)
        seededEditors.current.add(instance)
        instance.zoomToFit()
      }
      // Include session changes so switching pages also updates the observation.
      // Compare only stable shape IDs; moves/text/camera do not rerender the host.
      const readIds = () => [...instance.getCurrentPageShapeIds()].sort()
      let previousIds = readIds().join('\n')
      setShapeIds(readIds())
      const unsubscribe = instance.store.listen(
        () => {
          if (activeEditor.current !== instance) return
          const nextIds = readIds()
          const signature = nextIds.join('\n')
          if (signature !== previousIds) {
            previousIds = signature
            setShapeIds(nextIds)
          }
        },
        { scope: 'all' },
      )
      // Tldraw owns Editor disposal; this callback owns only our listener/reference.
      return () => {
        unsubscribe()
        if (activeEditor.current === instance) {
          activeEditor.current = null
          setEditor(null)
        }
      }
    },
    [level],
  )

  function toggleReadonly() {
    if (!editor || activeEditor.current !== editor) return
    const next = !editor.getIsReadonly()
    editor.updateInstanceState({ isReadonly: next })
    setReadonly(next)
    setStatus(
      next ? '当前实例只读：形状编辑被 SDK 拦截；生产 API 仍须自行鉴权。' : '恢复当前实例编辑。',
    )
  }

  function addProcess() {
    if (!editor || activeEditor.current !== editor || editor.getIsReadonly()) return
    if (editor.getCurrentPageShapes().length + FLOW.length > MAX_PROGRAMMATIC_SHAPES) {
      setStatus('本示例的自动新增上限为当前页80个形状；原生绘图工具不受此按钮限制。')
      return
    }
    createFlow(editor)
    editor.zoomToFit()
    setStatus('通过真实 Editor.createShape 创建4个可拖动的业务节点。')
  }

  function addBoundedBatch() {
    if (!editor || activeEditor.current !== editor || editor.getIsReadonly()) return
    const current = editor.getCurrentPageShapes().length
    const capacity = Math.max(0, MAX_PROGRAMMATIC_SHAPES - current)
    const amount = Math.min(36, capacity)
    editor.run(() => {
      for (let n = 0; n < amount; n++) {
        editor.createShape({
          id: createShapeId(),
          type: 'geo',
          x: (n % 9) * 120,
          y: 420 + Math.floor(n / 9) * 85,
          props: {
            geo: 'rectangle',
            w: 105,
            h: 65,
            color: 'light-blue',
            richText: toRichText(`任务 ${n + 1}`),
          },
        })
      }
    })
    editor.zoomToFit()
    setStatus(`批量新增 ${amount} 个形状（程序化按钮受当前页80总量限制）；未做性能基准测试。`)
  }

  function clearLocal() {
    if (!editor || activeEditor.current !== editor || editor.getIsReadonly()) return
    editor.deleteShapes(editor.getCurrentPageShapes().map((shape) => shape.id))
    setStatus('仅删除当前页面的形状，不清空浏览器或其他 Lab 条目缓存。')
  }

  function saveDocument() {
    if (!editor || activeEditor.current !== editor) return
    try {
      const document = getSnapshot(editor.store).document
      const json = serializeSnapshot(document)
      setSaved({
        document: structuredClone(document),
        shapeIds: editor
          .getCurrentPageShapes()
          .map((shape) => shape.id)
          .sort(),
        bytes: new TextEncoder().encode(json).byteLength,
      })
      setStatus('文档已保存到本组件内存；继续编辑不会改写这份快照。')
    } catch (error) {
      setStatus(`保存失败，保留上次快照：${String(error)}`)
    }
  }

  function restoreDocument() {
    if (!editor || activeEditor.current !== editor || editor.getIsReadonly() || !saved) return
    try {
      loadSnapshot(editor.store, { document: structuredClone(saved.document) })
      // The saved page is restored, but the SDK reconciles session state separately.
      setShapeIds([...editor.getCurrentPageShapeIds()].sort())
      setStatus('已恢复保存时的文档；没有加载保存时的相机或选择。')
    } catch (error) {
      setStatus(`恢复失败，内存快照仍保留：${String(error)}`)
    }
  }

  function exportDocument() {
    if (!editor || activeEditor.current !== editor) return
    try {
      const snapshot = getSnapshot(editor.store)
      downloadJson(
        {
          kind: 'tldraw-demo-document',
          version: 1,
          source: 'ReactLoom Library Lab A10',
          document: snapshot.document,
        },
        'rss-board.tldraw.json',
        downloadUrls.current,
        downloadTimers.current,
      )
      setStatus('已下载真实 tldraw store 文档快照；不包括相机/选择等会话状态。')
    } catch (error) {
      setStatus(`下载失败：${String(error)}`)
    }
  }

  if (!canMount) {
    return (
      <section className="ab-tldraw-locked" role="note" data-testid="a10-license-gate">
        <h2>tldraw 生产授权未配置</h2>
        <p>
          tldraw 5.5.2 要求符合其许可证的有效生产 key。本实验没有伪造
          key、绕过水印或代替你购买授权。
        </p>
        <p>
          请在本机 localhost 使用开发预览，或在正式部署前合法配置
          VITE_TLDRAW_LICENSE_KEY。文档与真实源码仍可阅读。
        </p>
      </section>
    )
  }

  return (
    <section
      className="ab-tldraw"
      data-testid="a10-workshop"
      data-level={level}
      data-ready={Boolean(editor)}
      data-readonly={readonly}
    >
      <h2>
        {level === 'basic'
          ? '入门：可编辑无限画布'
          : level === 'business'
            ? '业务：RSS 处理节点白板'
            : '进阶：只读、有限批量与实例清理'}
      </h2>
      <p>
        选择画布工具绘图，或点击按钮使用 SDK 的 Editor API。演示不启用
        persistenceKey，避免跨条目或跨标签页遗留 IndexedDB。
      </p>
      <fieldset className="ab-tldraw-controls">
        <legend>画板操作</legend>
        {level !== 'basic' && (
          <button type="button" disabled={!editor || readonly} onClick={addProcess}>
            追加4个流程节点
          </button>
        )}
        {level === 'advanced' && (
          <>
            <button type="button" disabled={!editor || readonly} onClick={addBoundedBatch}>
              有界批量创建形状
            </button>
            <button
              type="button"
              disabled={!editor}
              aria-pressed={readonly}
              onClick={toggleReadonly}
            >
              {readonly ? '退出只读' : '切换只读'}
            </button>
          </>
        )}
        <button type="button" disabled={!editor || readonly} onClick={clearLocal}>
          清空当前形状
        </button>
        {level !== 'basic' && (
          <>
            <button type="button" disabled={!editor} onClick={saveDocument}>
              保存文档到内存
            </button>
            <button
              type="button"
              disabled={!editor || readonly || !saved}
              onClick={restoreDocument}
            >
              恢复已保存文档
            </button>
          </>
        )}
        <button type="button" disabled={!editor} onClick={exportDocument}>
          下载文档 JSON
        </button>
        <button
          type="button"
          disabled={!editor}
          onClick={() => {
            if (editor && activeEditor.current === editor) editor.zoomToFit()
          }}
        >
          缩放适合画布
        </button>
      </fieldset>
      <p>
        当前页形状 <output data-testid="a10-shape-count">{shapeIds.length}</output> ·{' '}
        {readonly ? '只读' : '可编辑'} · 程序化按钮总量上限 {MAX_PROGRAMMATIC_SHAPES}
        （原生绘制不限）
      </p>
      <p role="status" aria-live="polite" data-testid="a10-status">
        {status}
      </p>
      {level !== 'basic' && (
        <p data-testid="a10-saved-document">
          {saved
            ? `已保存：当前页 ${saved.shapeIds.length} 个形状，文档 ${saved.bytes} UTF-8 字节`
            : '尚未保存文档'}
        </p>
      )}
      <details className="ab-tldraw-observation">
        <summary>查看当前页与保存时的形状身份</summary>
        <p>当前页 ID（按字符串排序，和视觉堆叠顺序无关）</p>
        <output data-testid="a10-shape-ids">{shapeIds.join('\n')}</output>
        <p>保存时当前页 ID</p>
        <output data-testid="a10-saved-shape-ids">{saved?.shapeIds.join('\n') ?? ''}</output>
      </details>
      <section
        className="ab-tldraw-canvas"
        aria-label="tldraw 真实可编辑画布"
        data-testid="a10-canvas"
      >
        <Tldraw autoFocus={false} licenseKey={licenseKey} onMount={onMount} />
      </section>
      <p className="ab-tldraw-note">
        内存快照随离开销毁；下载的是当前文档，含所有页面及资源记录，但不是离线媒体包。文档恢复不等于撤销，也不连接模型或协作服务。
      </p>
      <p className="ab-tldraw-note">
        画布仅供视觉操作；HTML 说明提供等价步骤：RSS 获取 → 正文清洗 → 分类摘要 →
        人工审核。只读是前端实例态，服务端仍必须核验权限。
      </p>
    </section>
  )
}
