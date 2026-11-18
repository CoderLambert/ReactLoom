import {
  CaptureUpdateAction,
  convertToExcalidrawElements,
  Excalidraw,
  exportToBlob,
  loadFromBlob,
} from '@excalidraw/excalidraw'
import {
  type ChangeEvent,
  type ComponentProps,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import '@excalidraw/excalidraw/index.css'
import './styles.css'
import { isSafeSceneLink, sceneImportError } from './scene-policy'

type Level = 'basic' | 'business' | 'advanced'
type EditorApi = Parameters<NonNullable<ComponentProps<typeof Excalidraw>['excalidrawAPI']>>[0]
type SceneElement = ReturnType<EditorApi['getSceneElements']>[number]
type SceneSummary = { id: string; type: string; x: number; y: number; text?: string }[]
function summarize(elements: readonly SceneElement[]): SceneSummary {
  return elements
    .filter((element) => !element.isDeleted)
    .map((element) => ({
      id: element.id,
      type: element.type,
      x: element.x,
      y: element.y,
      ...('text' in element ? { text: element.text } : {}),
    }))
}
function initialWorkflow() {
  return convertToExcalidrawElements([
    {
      type: 'rectangle',
      x: 40,
      y: 65,
      width: 165,
      height: 100,
      backgroundColor: '#e7f5ef',
      label: { text: 'RSS 获取' },
    },
    {
      type: 'rectangle',
      x: 270,
      y: 65,
      width: 165,
      height: 100,
      backgroundColor: '#fff2ce',
      label: { text: '清洗 / 分类' },
    },
    {
      type: 'rectangle',
      x: 500,
      y: 65,
      width: 165,
      height: 100,
      backgroundColor: '#e8edff',
      label: { text: '人工审核' },
    },
    { type: 'arrow', x: 210, y: 110, width: 52, height: 0, endArrowhead: 'triangle' },
    { type: 'arrow', x: 440, y: 110, width: 52, height: 0, endArrowhead: 'triangle' },
  ])
}

function saveBlob(blob: Blob, name: string, urls: Set<string>, timers: Set<number>) {
  const url = URL.createObjectURL(blob)
  urls.add(url)
  const link = document.createElement('a')
  link.download = name
  link.href = url
  document.body.append(link)
  link.click()
  link.remove()
  // A delay allows the download to start; remaining URLs are revoked on unmount.
  const timer = window.setTimeout(() => {
    URL.revokeObjectURL(url)
    urls.delete(url)
    timers.delete(timer)
  }, 2000)
  timers.add(timer)
}

export default function ExcalidrawWorkshop({ level }: { level: Level }) {
  const apiRef = useRef<EditorApi | null>(null)
  // The SDK delivers API from its constructor. Keep a candidate for StrictMode's effect replay;
  // only apiRef is callable, and it is cleared while our lifecycle is inactive.
  const candidateApi = useRef<EditorApi | null>(null)
  const urlsRef = useRef(new Set<string>())
  const downloadTimers = useRef(new Set<number>())
  const reportTimer = useRef<number | undefined>(undefined)
  const operationId = useRef(0)
  const mounted = useRef(false)
  const readOnlyRef = useRef(false)
  const [count, setCount] = useState(0)
  const [scene, setScene] = useState<SceneSummary>([])
  const [readOnly, setReadOnly] = useState(false)
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState('所有画板数据仅在本页面内存中，未同步到服务器。')
  const seed = useMemo(
    () =>
      level === 'basic'
        ? undefined
        : { elements: initialWorkflow(), appState: { viewBackgroundColor: '#fffdf7' } },
    [level],
  )

  useEffect(() => {
    mounted.current = true
    apiRef.current = candidateApi.current
    const current = apiRef.current?.getSceneElements() ?? []
    setCount(current.length)
    setScene(summarize(current))
    return () => {
      mounted.current = false
      ++operationId.current // invalidate in-flight loadFromBlob/exportToBlob
      apiRef.current = null
      if (reportTimer.current !== undefined) window.clearTimeout(reportTimer.current)
      reportTimer.current = undefined
      for (const timer of downloadTimers.current) window.clearTimeout(timer)
      downloadTimers.current.clear()
      for (const url of urlsRef.current) URL.revokeObjectURL(url)
      urlsRef.current.clear()
    }
  }, [])

  const onChange = useCallback((elements: readonly SceneElement[]) => {
    if (!mounted.current) return
    if (reportTimer.current !== undefined) window.clearTimeout(reportTimer.current)
    const current = elements.filter((item) => !item.isDeleted)
    reportTimer.current = window.setTimeout(() => {
      if (!mounted.current) return
      setCount(current.length)
      setScene(summarize(current))
    }, 160)
  }, [])

  function clearCurrentScene() {
    if (readOnlyRef.current || !apiRef.current) return
    ++operationId.current
    setWorking(false)
    apiRef.current?.resetScene()
    setMessage('仅重置当前画布。不会清除浏览器、其他库或用户数据。')
  }

  async function exportPng() {
    const api = apiRef.current
    if (!api) return
    const elements = api.getSceneElements()
    if (!elements.length) {
      setMessage('画布为空，请先绘制至少一个元素。')
      return
    }
    const token = ++operationId.current
    setWorking(true)
    try {
      const blob = await exportToBlob({
        elements,
        appState: { ...api.getAppState(), exportBackground: true, exportWithDarkMode: false },
        files: api.getFiles(),
        mimeType: 'image/png',
        maxWidthOrHeight: 2048,
      })
      if (token !== operationId.current || !mounted.current || apiRef.current !== api) return
      if (!blob) throw new Error('未生成 PNG')
      saveBlob(blob, 'reactloom-workflow.png', urlsRef.current, downloadTimers.current)
      setMessage(`已生成本地 PNG (${blob.size} 字节)，未上传任何服务器。`)
    } catch (error) {
      if (token === operationId.current && mounted.current)
        setMessage(`PNG 导出失败：${String(error)}`)
    } finally {
      if (token === operationId.current && mounted.current) setWorking(false)
    }
  }

  async function importScene(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    if (readOnlyRef.current) return
    const api = apiRef.current
    if (!api) {
      setMessage('编辑器未就绪')
      return
    }
    const fileError = sceneImportError({ name: file.name, bytes: file.size })
    if (fileError) {
      setMessage(fileError)
      return
    }
    const token = ++operationId.current
    setWorking(true)
    try {
      const restored = await loadFromBlob(file, null, null)
      const elements = restored.elements ?? []
      const sceneError = sceneImportError({
        name: file.name,
        bytes: file.size,
        elementCount: elements.length,
        links: elements.map((element) => element.link),
        attachedFiles: Object.keys(restored.files ?? {}).length,
        elementTypes: elements.map((element) => element.type),
      })
      if (sceneError) throw new Error(sceneError)
      // Loading is asynchronous: a reset, scene replacement, or unmount invalidates this result.
      if (
        token !== operationId.current ||
        !mounted.current ||
        apiRef.current !== api ||
        readOnlyRef.current
      )
        return
      api.updateScene({
        elements,
        appState: { viewBackgroundColor: '#fffdf7' },
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      })
      setMessage(`已通过 Excalidraw SDK 导入 ${elements.length} 个元素；仅影响当前页面。`)
    } catch (error) {
      if (token === operationId.current && mounted.current)
        setMessage(`导入已拒绝：${String(error)}`)
    } finally {
      if (token === operationId.current && mounted.current) setWorking(false)
    }
  }

  return (
    <section
      aria-label="Excalidraw 手绘白板实验"
      className="ab-excalidraw"
      data-testid="a09-workshop"
      data-level={level}
      data-readonly={readOnly}
      data-working={working}
    >
      <h2>
        {level === 'basic'
          ? '入门：真实 Excalidraw 画布'
          : level === 'business'
            ? '业务：RSS 内容流草图'
            : '进阶：导出、受限导入、只读模式'}
      </h2>
      <p>选择矩形、箭头或文字并直接编辑画布。原生编辑工具由 Excalidraw 提供，不是模拟的 SVG。</p>
      <fieldset className="ab-actions">
        <legend>白板操作</legend>
        <button type="button" disabled={readOnly} onClick={clearCurrentScene}>
          重置当前画布
        </button>
        {level !== 'basic' && (
          <button
            type="button"
            disabled={readOnly}
            onClick={() => {
              if (readOnlyRef.current || !apiRef.current) return
              ++operationId.current
              setWorking(false)
              apiRef.current.updateScene({
                elements: initialWorkflow(),
                captureUpdate: CaptureUpdateAction.IMMEDIATELY,
              })
              setMessage('已重新加载本地 RSS 工作流骨架。')
            }}
          >
            恢复流程草图
          </button>
        )}
        {level === 'advanced' && (
          <>
            <label>
              <input
                type="checkbox"
                checked={readOnly}
                onChange={(event) => {
                  const next = event.target.checked
                  readOnlyRef.current = next
                  ++operationId.current
                  setWorking(false)
                  setReadOnly(next)
                  setMessage(
                    next
                      ? '已切为只读；在途操作结果已作废，导入、重置和恢复不可写入。PNG读取仍可用。'
                      : '已恢复编辑；之前作废的操作不会重新生效。',
                  )
                }}
              />
              只读演示
            </label>
            <button type="button" disabled={working} onClick={() => void exportPng()}>
              下载 PNG
            </button>
            {working && (
              <button
                type="button"
                onClick={() => {
                  ++operationId.current
                  setWorking(false)
                  setMessage(
                    '已取消使用当前操作结果。SDK底层解析/导出可能仍在进行，但不得回写画板或触发下载。',
                  )
                }}
              >
                忽略当前导入或导出
              </button>
            )}
            <label>
              导入 .excalidraw 文件
              <input
                type="file"
                accept=".excalidraw,.json,application/json"
                disabled={working || readOnly}
                onChange={(event) => void importScene(event)}
              />
            </label>
          </>
        )}
      </fieldset>
      <p>
        非删除元素数：<output data-testid="a09-count">{count}</output>
      </p>
      <p role="status" aria-live="polite" data-testid="a09-status">
        {message}
      </p>
      <details className="ab-scene-observation">
        <summary>查看当前元素身份、位置与文字</summary>
        <pre>
          <output data-testid="a09-scene">{JSON.stringify(scene, null, 2)}</output>
        </pre>
      </details>
      <div className="ab-excalidraw-canvas" data-testid="a09-canvas">
        <Excalidraw
          langCode="zh-CN"
          autoFocus={false}
          handleKeyboardGlobally={false}
          viewModeEnabled={readOnly}
          validateEmbeddable={false}
          initialData={seed}
          excalidrawAPI={(api) => {
            candidateApi.current = api
            if (mounted.current) apiRef.current = api
          }}
          onChange={onChange}
          onLinkOpen={(element, event) => {
            if (!isSafeSceneLink(element.link)) {
              event.preventDefault()
              setMessage('阻止了非 HTTPS 或带凭据的链接。')
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
  )
}
