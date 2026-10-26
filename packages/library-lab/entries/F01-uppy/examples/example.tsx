import {useEffect, useRef, useState} from 'react'
import Uppy from '@uppy/core'

type Level = 'basic' | 'business' | 'advanced'
type Props = {level: Level}
type LocalFile = {id: string; name: string; size: number; type: string}

export default function UppyQueueExample({level}: Props) {
  const uppyRef = useRef<Uppy | null>(null)
  const generation = useRef(0)
  const [files, setFiles] = useState<LocalFile[]>([])
  const [notice, setNotice] = useState('未选择文件；不会向网络发送任何内容')
  const [preview, setPreview] = useState('')
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const uppy = new Uppy({
      id: `reactloom-library-lab-F01-${level}`,
      autoProceed: false,
      restrictions: {maxNumberOfFiles: 3, maxFileSize: 1024 * 1024, allowedFileTypes: ['.txt', '.csv', '.md']},
    })
    uppyRef.current = uppy
    const sync = () => setFiles(uppy.getFiles().map(file => ({
      id: file.id,
      name: file.name,
      size: file.size ?? 0,
      type: file.type || 'unknown',
    })))
    const onReject = (_file: unknown, error: Error) => setNotice(`Uppy 拒绝文件：${error.message}`)
    uppy.on('file-added', sync)
    uppy.on('file-removed', sync)
    uppy.on('restriction-failed', onReject)
    return () => {
      generation.current++
      uppy.off('file-added', sync)
      uppy.off('file-removed', sync)
      uppy.off('restriction-failed', onReject)
      uppyRef.current = null
      uppy.destroy()
    }
  }, [level])

  function addFiles(inputs: File[]) {
    const uppy = uppyRef.current
    if (!uppy || !inputs.length) return
    generation.current++
    setPreview('')
    try {
      uppy.addFiles(inputs.map(file => ({
        name: file.name,
        type: file.type,
        data: file,
        source: 'library-lab-local-picker',
      })))
      setNotice('Uppy 已检查并加入本地队列，尚未安装/执行任何上传插件')
    } catch (error) {
      setNotice(`添加失败：${error instanceof Error ? error.message : String(error)}`)
    }
    setFiles(uppy.getFiles().map(file => ({
      id: file.id, name: file.name, size: file.size ?? 0, type: file.type || 'unknown',
    })))
  }

  function remove(id: string) {
    uppyRef.current?.removeFile(id)
    generation.current++
    setPreview('')
    setNotice('仅移除当前 Uppy 队列条目，没有发送删除请求')
  }

  async function inspect(id: string) {
    const file = uppyRef.current?.getFile(id)
    if (!file || !(file.data instanceof Blob)) return
    if (file.size && file.size > 12_000) {
      setNotice('文件较大，本演示只预览不超过 12KB 的文本')
      return
    }
    const token = ++generation.current
    setPreview('')
    try {
      const text = await file.data.text()
      if (token !== generation.current) return
      setPreview(text.slice(0, 4_000))
      setNotice('仅在本地读取文本，未提交远端')
    } catch {
      if (token === generation.current) setNotice('本地文件读取失败')
    }
  }

  function clearQueue() {
    generation.current++
    uppyRef.current?.clear()
    setFiles([])
    setPreview('')
    setNotice('当前 Uppy 队列已清空；其他页面存储未触碰')
  }

  return <section aria-label="Uppy 真实文件队列">
    <h2>{level === 'basic' ? '选择文件与限制' : level === 'business' ? '新闻素材本地预览与队列管理' : '错误隔离、数量上限与卸载'}</h2>
    <p>真实 @uppy/core 管理状态、限制和事件。此条目**没有添加网络 Upload 插件**，演示只选择与预览文件，永不自动上传。</p>
    <div
      role="group"
      aria-label="拖拽文件加入本地队列"
      onDragOver={event => {event.preventDefault(); setDragging(true)}}
      onDragLeave={() => setDragging(false)}
      onDrop={event => {
        event.preventDefault()
        setDragging(false)
        addFiles(Array.from(event.dataTransfer.files))
      }}
      style={{border: dragging ? '2px dashed #255b49' : '2px dashed #a1b4a7', borderRadius: 12, padding: 18, marginBlock: 16}}>
      <label>选择 .txt / .csv / .md 文件（每份≤1MB，共≤3份） 
        <input type="file" accept=".txt,.csv,.md" multiple
          onChange={event => {const input=event.currentTarget; addFiles(Array.from(input.files ?? [])); input.value=''}}/>
      </label>
      <p>也可以将本地文件拖到此区域；限制检查由 Uppy 执行，不代表服务端已校验文件类型。</p>
    </div>
    <div className="demo-controls">
      <button type="button" onClick={clearQueue}>清空当前队列</button>
      {level === 'advanced' && <button type="button" onClick={() => {
        addFiles([new File([new Uint8Array(1024 * 1024 + 1)],'too-large.txt',{type:'text/plain'})])
      }}>演示超大文件拒绝</button>}
    </div>
    <p role="status">{notice}</p>
    <ul aria-label="当前队列">
      {files.map(file => <li key={file.id}>
        <strong>{file.name}</strong>（{Math.ceil(file.size/1024)} KiB · {file.type}）
        <button type="button" onClick={() => remove(file.id)}>移除</button>
        {level !== 'basic' && <button type="button" onClick={() => void inspect(file.id)}>本地查看文本</button>}
      </li>)}
    </ul>
    {files.length === 0 && <p>队列为空。</p>}
    {level !== 'basic' && <><h3>本地内容预览（最多 4KB）</h3><pre data-testid="uppy-preview">{preview || '选择队列中的文本文件进行预览'}</pre></>}
    {level === 'advanced' && <p>上传进度、断点续传、重试和服务端持久化需要独立的真实 XHR/Tus/S3 上传服务；仅靠 Uppy Core 的限制不能保证文件安全。</p>}
  </section>
}
