import type Uppy from '@uppy/core'
import { useEffect, useRef, useState } from 'react'
import {
  addLocalFiles,
  bindLocalQueue,
  createLocalQueue,
  type LocalFile,
  localFiles,
} from './local-queue.mjs'
import { readTextPreview } from './preview-policy.mjs'

type Level = 'basic' | 'business' | 'advanced'
type Props = { level: Level }

export default function UppyQueueExample({ level }: Props) {
  return <UppySession key={level} level={level} />
}
function UppySession({ level }: Props) {
  const uppyRef = useRef<Uppy | null>(null)
  const generation = useRef(0)
  const [files, setFiles] = useState<LocalFile[]>([])
  const [notice, setNotice] = useState('未选择文件；不会向网络发送任何内容')
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const uppy = createLocalQueue(`reactloom-library-lab-F01-${level}`)
    uppyRef.current = uppy
    const dispose = bindLocalQueue(uppy, setFiles, (error) =>
      setNotice(`Uppy 限制事件：${error.message}`),
    )
    return () => {
      generation.current++
      if (uppyRef.current === uppy) uppyRef.current = null
      dispose()
    }
  }, [level])

  function addFiles(inputs: File[]) {
    const uppy = uppyRef.current
    if (!uppy || !inputs.length) return
    generation.current++
    setPreview(null)
    const summary = addLocalFiles(uppy, inputs)
    setFiles(localFiles(uppy))
    setNotice(
      `本批新增${summary.added}；未新增${summary.notAdded}；限制事件${summary.errors.length}。${summary.fatal ? `应用错误：${summary.fatal}` : summary.errors.join('；')} 仅本地队列，没有上传。`,
    )
  }

  function remove(id: string) {
    uppyRef.current?.removeFile(id)
    generation.current++
    setPreview(null)
    setNotice('仅移除当前 Uppy 队列条目，没有发送删除请求')
  }

  async function inspect(id: string) {
    const file = uppyRef.current?.getFile(id)
    if (!file || !(file.data instanceof Blob)) return
    const token = ++generation.current
    setPreview(null)
    try {
      const text = await readTextPreview(file.data)
      if (token !== generation.current) return
      setPreview(text)
      setNotice(text ? '仅在本地读取文本，未提交远端' : '本地空文本已读取，预览为空')
    } catch (error) {
      if (token === generation.current)
        setNotice(`本地文件预览失败：${error instanceof Error ? error.message : String(error)}`)
    }
  }

  function clearQueue() {
    generation.current++
    uppyRef.current?.clear()
    setFiles([])
    setPreview(null)
    setNotice('当前 Uppy 队列已清空；其他页面存储未触碰')
  }

  return (
    <section aria-label="Uppy 真实文件队列">
      <h2>
        {level === 'basic'
          ? '选择文件与限制'
          : level === 'business'
            ? '新闻素材本地预览与队列管理'
            : '错误隔离、数量上限与卸载'}
      </h2>
      <p>
        真实 @uppy/core
        管理状态、限制和事件。此条目没有添加网络Uploader插件，演示只选择与预览文件，永不自动上传。
      </p>
      <fieldset
        aria-label="拖拽文件加入本地队列"
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          addFiles(Array.from(event.dataTransfer.files))
        }}
        style={{
          border: dragging ? '2px dashed #255b49' : '2px dashed #a1b4a7',
          borderRadius: 12,
          padding: 18,
          marginBlock: 16,
        }}
      >
        <label>
          选择 .txt / .csv / .md 文件（每份≤1MiB，共≤3份）
          <input
            type="file"
            accept=".txt,.csv,.md"
            multiple
            onChange={(event) => {
              const input = event.currentTarget
              addFiles(Array.from(input.files ?? []))
              input.value = ''
            }}
          />
        </label>
        <p>也可以将本地文件拖到此区域；限制检查由 Uppy 执行，不代表服务端已校验文件类型。</p>
      </fieldset>
      <div className="demo-controls">
        <button type="button" onClick={clearQueue}>
          清空当前队列
        </button>
        {level === 'advanced' && (
          <button
            type="button"
            onClick={() => {
              addFiles([
                new File([new Uint8Array(1024 * 1024 + 1)], 'too-large.txt', {
                  type: 'text/plain',
                }),
              ])
            }}
          >
            演示超大文件拒绝
          </button>
        )}
      </div>
      <p role="status">{notice}</p>
      <ul aria-label="当前队列">
        {files.map((file) => (
          <li key={file.id}>
            <strong>{file.name}</strong>（{Math.ceil(file.size / 1024)} KiB · {file.type}）
            <button type="button" onClick={() => remove(file.id)}>
              移除
            </button>
            {level !== 'basic' && (
              <button type="button" onClick={() => void inspect(file.id)}>
                本地查看文本
              </button>
            )}
          </li>
        ))}
      </ul>
      {files.length === 0 && <p>队列为空。</p>}
      {level !== 'basic' && (
        <>
          <h3>本地内容预览（读取≤12,000字节，展示≤4,000码点）</h3>
          <pre data-testid="uppy-preview">
            {preview === null ? '选择队列中的文本文件进行预览' : preview}
          </pre>
        </>
      )}
      {level === 'advanced' && (
        <p>
          上传进度、断点续传、重试和服务端持久化需要独立的真实 XHR/Tus/S3 上传服务；仅靠 Uppy Core
          的限制不能保证文件安全。
        </p>
      )}
    </section>
  )
}
