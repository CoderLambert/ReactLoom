import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { useEffect, useRef, useState } from 'react'
import { createWorkshopPdf } from './fixture'
import { boundedCanvasSize } from './render-budget.mjs'
import { createRenderGate } from './render-gate.mjs'

type Level = 'basic' | 'business' | 'advanced'
type Props = { level: Level }
type PDFDoc = Awaited<ReturnType<typeof getDocument>['promise']>
const MAX_PDF_BYTES = 3 * 1024 * 1024

// Vite resolves a version-matched local worker asset; never use an unpinned CDN worker.
GlobalWorkerOptions.workerSrc = workerSrc

export default function PdfViewerExample({ level }: Props) {
  return <PdfSession key={level} level={level} />
}

function PdfSession({ level }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileGeneration = useRef(0)
  const probeTask = useRef<ReturnType<typeof getDocument> | null>(null)
  // The same HTMLCanvasElement may not be used by concurrent PDF.js RenderTasks.
  // A cancelled task must settle before the next one begins drawing.
  const withCanvas = useRef(createRenderGate())
  const acceptedTask = useRef<ReturnType<typeof getDocument> | null>(null)
  const pendingTask = useRef<ReturnType<typeof getDocument> | null>(null)
  const cancelRender = useRef(() => {})
  const [pdf, setPdf] = useState<PDFDoc | null>(null)
  const [pageNum, setPageNum] = useState(1)
  const [scale, setScale] = useState(1)
  const [extracted, setExtracted] = useState('')
  const [notice, setNotice] = useState('准备解析本地原创 PDF 示例')

  const disposed = useRef(new WeakMap<ReturnType<typeof getDocument>, Promise<void>>())
  function dispose(task: ReturnType<typeof getDocument> | null) {
    if (!task) return Promise.resolve()
    let done = disposed.current.get(task)
    if (!done) {
      done = task.destroy().catch(() => {})
      disposed.current.set(task, done)
    }
    return done
  }

  function beginInput() {
    const token = ++fileGeneration.current
    const pending = pendingTask.current
    const probe = probeTask.current
    pendingTask.current = null
    probeTask.current = null
    void dispose(pending)
    void dispose(probe)
    return token
  }

  async function acceptBytes(source: Uint8Array, token: number) {
    const task = getDocument({ data: source.slice() })
    pendingTask.current = task
    try {
      const document = await task.promise
      if (token !== fileGeneration.current) return
      cancelRender.current()
      const previous = acceptedTask.current
      acceptedTask.current = task
      pendingTask.current = null
      setPageNum(1)
      setPdf(document)
      setNotice(`已加载 ${document.numPages} 页；没有访问远程 URL`)
      void dispose(previous)
    } catch (error) {
      if (token === fileGeneration.current)
        setNotice(`PDF 文档解析失败，保留当前文档：${String(error)}`)
    } finally {
      if (pendingTask.current === task) pendingTask.current = null
      if (acceptedTask.current !== task) await dispose(task)
    }
  }

  // One keyed session owns its accepted document, candidate and independent probe.
  // Callback functions use refs; this effect deliberately only runs per mount.
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed session owns initialization and cleanup
  useEffect(() => {
    const token = ++fileGeneration.current
    void acceptBytes(createWorkshopPdf(), token)
    return () => {
      fileGeneration.current++
      cancelRender.current()
      for (const task of [acceptedTask.current, pendingTask.current, probeTask.current])
        void dispose(task)
      acceptedTask.current = pendingTask.current = probeTask.current = null
    }
  }, [])

  useEffect(() => {
    if (!pdf) return
    let active = true
    let task: ReturnType<Awaited<ReturnType<PDFDoc['getPage']>>['render']> | undefined
    const stop = () => {
      active = false
      task?.cancel()
    }
    cancelRender.current = stop
    setExtracted('')
    const render = async () => {
      const page = await pdf.getPage(pageNum)
      if (!active) return
      // Serialize the actual canvas painting, not document loading or text extraction.
      // renderTask.cancel() rejects its promise asynchronously; starting a new
      // render immediately can throw "Cannot use the same canvas".
      const renderedSize = await withCanvas.current(async () => {
        if (!active) return
        const canvas = canvasRef.current
        const context = canvas?.getContext('2d')
        if (!canvas || !context) throw new Error('当前浏览器不支持 Canvas 2D')
        // Clear only after the preceding RenderTask settles, including budget failures.
        canvas.width = 0
        canvas.height = 0
        const viewport = page.getViewport({ scale: 1.15 * scale })
        // A 3MiB PDF can claim a huge page. Check before allocating canvas pixels.
        const geometry = boundedCanvasSize(viewport, window.devicePixelRatio || 1)
        canvas.width = geometry.pixelWidth
        canvas.height = geometry.pixelHeight
        canvas.style.width = `${geometry.cssWidth}px`
        canvas.style.height = `${geometry.cssHeight}px`
        task = page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform:
            geometry.ratio !== 1 ? [geometry.ratio, 0, 0, geometry.ratio, 0, 0] : undefined,
        })
        await task.promise
        return { width: canvas.width, height: canvas.height }
      })
      if (!active || !renderedSize) return
      const text = level === 'basic' ? null : await page.getTextContent()
      if (!active) return
      setExtracted(text?.items.map((item) => ('str' in item ? item.str : '')).join(' ') ?? '')
      setNotice(
        `第 ${pageNum} / ${pdf.numPages} 页渲染成功，Canvas尺寸 ${renderedSize.width}×${renderedSize.height}`,
      )
    }
    void render().catch((error) => {
      if (active && !(error instanceof Error && error.name === 'RenderingCancelledException')) {
        void withCanvas.current(() => {
          if (active && canvasRef.current) {
            canvasRef.current.width = 0
            canvasRef.current.height = 0
          }
        })
        setNotice(`PDF 渲染失败：${String(error)}`)
      }
    })
    return () => {
      stop()
      if (cancelRender.current === stop) cancelRender.current = () => {}
    }
  }, [pdf, pageNum, scale, level])

  async function loadLocalFile(file: File | undefined) {
    if (!file) return
    const token = beginInput()
    if (file.size === 0 || file.size > MAX_PDF_BYTES) {
      setNotice('文件为空或超过 3 MiB，未读取；保留当前文档')
      return
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setNotice('本示例只接受 PDF 文件名；仍需实际解析校验')
      return
    }
    setNotice('正在读取本地文件，不进行上传')
    try {
      const source = new Uint8Array(await file.arrayBuffer())
      if (token !== fileGeneration.current) return
      await acceptBytes(source, token)
    } catch (error) {
      if (token === fileGeneration.current) setNotice(`本地读取失败：${String(error)}`)
    }
  }

  async function probeCorrupt() {
    const token = beginInput()
    const task = getDocument({ data: new Uint8Array([1, 2, 3, 4, 5]) })
    probeTask.current = task
    try {
      await task.promise
      if (token === fileGeneration.current) setNotice('意外：损坏 PDF 被接受，请检查解析器版本')
    } catch {
      if (token === fileGeneration.current) setNotice('已正确捕获损坏 PDF，不覆盖当前已加载文档')
    } finally {
      if (probeTask.current === task) {
        probeTask.current = null
        await dispose(task)
      }
    }
  }

  return (
    <section aria-label="PDF.js 真实页面渲染">
      <h2>
        {level === 'basic'
          ? 'PDF.js 原生页面'
          : level === 'business'
            ? '分页和内容提取'
            : 'Worker、HiDPI 与损坏文件回退'}
      </h2>
      <p>
        真实 pdfjs-dist 使用本地生成的两页有效 PDF；Worker 与
        SDK版本一致，切换和卸载时取消渲染与销毁加载任务。
      </p>
      <div className="demo-controls">
        {level !== 'basic' && (
          <>
            <button
              type="button"
              disabled={!pdf || pageNum <= 1}
              onClick={() => setPageNum((n) => Math.max(1, n - 1))}
            >
              上一页
            </button>
            <span>
              第 {pageNum} / {pdf?.numPages ?? '…'} 页
            </span>
            <button
              type="button"
              disabled={!pdf || pageNum >= pdf.numPages}
              onClick={() => setPageNum((n) => Math.min(pdf?.numPages ?? 1, n + 1))}
            >
              下一页
            </button>
          </>
        )}
        {level === 'advanced' && (
          <>
            <label>
              缩放
              <select value={scale} onChange={(event) => setScale(Number(event.target.value))}>
                {[0.8, 1, 1.5, 2].map((n) => (
                  <option key={n} value={n}>
                    {n * 100}%
                  </option>
                ))}
              </select>
            </label>
            <label>
              选择本地PDF（≤3 MiB）
              <input
                type="file"
                disabled={!pdf}
                accept=".pdf,application/pdf"
                onChange={(event) => {
                  const input = event.currentTarget
                  void loadLocalFile(input.files?.[0])
                  input.value = ''
                }}
              />
            </label>
            <button type="button" disabled={!pdf} onClick={() => void probeCorrupt()}>
              验证损坏文档不覆盖当前页
            </button>
          </>
        )}
      </div>
      <p role="status">{notice}</p>
      <div
        style={{
          maxWidth: '100%',
          overflow: 'auto',
          border: '1px solid #d2dfd3',
          borderRadius: 8,
          padding: 8,
        }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`PDF 第 ${pageNum} 页画面`}
          style={{ display: 'block', maxWidth: 'none' }}
        />
      </div>
      {level !== 'basic' && (
        <>
          <h3>同页文本提取</h3>
          <output data-testid="pdf-text">{extracted || '正在抽取…'}</output>
        </>
      )}
      {level === 'advanced' && (
        <p>
          此处不是 PDF 编辑/合并器。真实用户文件仍需服务端安全验证；大型 PDF、字体/CMAP
          和复杂表单应使用受控资源、性能预算与跨浏览器验收。
        </p>
      )}
    </section>
  )
}
