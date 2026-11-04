import {useCallback, useEffect, useRef, useState} from 'react'
import {useDropzone, type FileRejection} from 'react-dropzone'
import {readLocalTextPreview} from './preview.mjs'

type Level = 'basic' | 'business' | 'advanced'
type Props = {level: Level}
type Selected = {name: string; size: number; type: string}

export default function FileInputExample({level}: Props) {
  const [items, setItems] = useState<Selected[]>([])
  const [preview, setPreview] = useState('')
  const [message, setMessage] = useState('尚未选择文件')
  const generation = useRef(0)
  useEffect(() => () => {generation.current++}, [])
  useEffect(() => {
    // Invalidate the previous scenario's pending Blob.text() on level navigation.
    generation.current++
    setItems([])
    setPreview('')
    setMessage('场景已重置；请选择本地文件')
  }, [level])

  const onDrop = useCallback(
    (files: File[], rejections: FileRejection[]) => {
      const turn = ++generation.current
      setItems(files.map(file => ({name: file.name, size: file.size, type: file.type || 'unknown'})))
      setPreview('')
      if (rejections.length) {
        setMessage(rejections.map(r => `${r.file.name}: ${r.errors.map(e => e.code).join(', ')}`).join('; '))
        if (!files.length) return
      } else {
        setMessage(`已接受 ${files.length} 个文件；本示例不进行网络上传`)
      }
      if (level !== 'basic' && files[0]) {
        void readLocalTextPreview(files[0]).then(content => {
          if (turn === generation.current) setPreview(content)
        }).catch(error => {
          if (turn === generation.current) setMessage(`文件读取失败：${String(error)}`)
        })
      }
    },
    [level],
  )

  const {getRootProps, getInputProps, isDragActive, open, isDragReject} = useDropzone({
    onDrop,
    noClick: true,
    accept: {'text/plain': ['.txt'], 'text/csv': ['.csv']},
    maxSize: level === 'advanced' ? 1024 : 256 * 1024,
    maxFiles: level === 'advanced' ? 2 : 1,
    multiple: level === 'advanced',
    useFsAccessApi: false,
  })

  return <section aria-label="react-dropzone 文件选择实验">
    <h2>{level === 'basic' ? '选择文件并验证格式' : level === 'business' ? '本地内容预览' : '拒绝大文件与并发读取竞态'}</h2>
    <div {...getRootProps({role: 'group', 'aria-label': '文件拖放区域'})} style={{
      border: `2px dashed ${isDragReject ? '#a33' : isDragActive ? '#368663' : '#9caba0'}`,
      padding: 22, borderRadius: 8, marginBottom: 12,
    }}>
      <input {...getInputProps()} />
      <p>{isDragReject ? '文件不符合格式或大小要求' : isDragActive ? '释放鼠标选择文件' : '可拖入 .txt 或 .csv；也可使用下面的按钮选择'}</p>
    </div>
    <button type="button" onClick={open}>选择本地文件</button>
    <button type="button" onClick={() => {
      generation.current++
      setItems([])
      setPreview('')
      setMessage('已清空当前示例')
    }} style={{marginLeft: 10}}>清空</button>
    <p role="status" data-testid="dropzone-status">{message}</p>
    <p>限制：{level === 'advanced' ? '最多 2 个文件、每个 1 KiB' : '最多 1 个文件、每个 256 KiB'}。</p>
    <ul>{items.map(file => <li key={file.name + ':' + file.size}>{file.name} · {file.size} bytes · {file.type}</li>)}</ul>
    {level !== 'basic' && <><h3>安全截断的本地文本预览</h3>
      <pre data-testid="dropzone-preview" style={{whiteSpace:'pre-wrap', overflowWrap:'anywhere'}}>{preview || '暂无预览'}</pre>
    </>}
    <small>浏览器选择只提供 File 对象；格式/文件大小检查只是用户体验，服务端必须自行验证上传内容。</small>
  </section>
}
