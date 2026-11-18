// Local-only, intentionally conservative StarterKit JSON boundary. Not a sanitizer for exported HTML.
export const MAX_SNAPSHOT = 20_000
const NODES = new Set([
  'doc',
  'paragraph',
  'heading',
  'text',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'codeBlock',
  'hardBreak',
  'horizontalRule',
])
const MARKS = new Set(['bold', 'italic', 'strike', 'code', 'underline', 'link'])
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

function checkAttributes(attrs, type) {
  const allowed =
    {
      heading: ['level'],
      orderedList: ['start', 'type'],
      codeBlock: ['language'],
      link: ['href', 'target', 'rel', 'class'],
    }[type] ?? []

  if (!record(attrs) || Object.keys(attrs).length > 16) throw new Error('属性结构不合法')
  for (const [key, value] of Object.entries(attrs)) {
    if (!allowed.includes(key)) throw new Error('当前Schema不支持该属性')
    if (type === 'heading' && key === 'level' && ![2, 3].includes(value))
      throw new Error('只允许二三级标题')
    if (type === 'orderedList' && key === 'start' && (!Number.isSafeInteger(value) || value < 1))
      throw new Error('列表起点非法')
    if (['__proto__', 'constructor', 'prototype', 'src', 'style'].includes(key) || /^on/i.test(key))
      throw new Error('不支持的内容属性')
    if (key === 'href') {
      if (
        typeof value !== 'string' ||
        Array.from(value).some((char) => {
          const point = char.codePointAt(0)
          return point <= 32 || point === 127 || point === 92
        })
      )
        throw new Error('链接地址不安全')
      let url
      try {
        url = new URL(value)
      } catch {
        throw new Error('链接地址不合法')
      }
      if (url.protocol !== 'https:' || url.username || url.password)
        throw new Error('只接受无凭据 HTTPS 链接')
    } else if (
      value !== null &&
      typeof value !== 'boolean' &&
      !(typeof value === 'number' && Number.isFinite(value)) &&
      !(typeof value === 'string' && value.length <= 256)
    ) {
      throw new Error('属性值超限')
    }
  }
}

export function parseTiptapSnapshot(raw) {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > MAX_SNAPSHOT)
    throw new Error('草稿大小超限')
  const doc = JSON.parse(raw)
  if (
    !record(doc) ||
    doc.type !== 'doc' ||
    !Array.isArray(doc.content) ||
    doc.content.length === 0
  ) {
    throw new Error('文档根节点不合法')
  }
  const pending = [{ node: doc, depth: 0 }]
  let visited = 0
  while (pending.length) {
    const { node, depth } = pending.pop()
    if (!record(node) || !NODES.has(node.type) || depth > 12 || ++visited > 500)
      throw new Error('文档节点非法或过深')
    if (
      Object.keys(node).some((key) => !['type', 'content', 'text', 'marks', 'attrs'].includes(key))
    )
      throw new Error('包含未知节点字段')
    if (node.type === 'heading' && (!record(node.attrs) || ![2, 3].includes(node.attrs.level)))
      throw new Error('只允许明确指定二三级标题')
    if (node.attrs !== undefined) checkAttributes(node.attrs, node.type)
    if (node.type === 'text') {
      if (
        typeof node.text !== 'string' ||
        node.text.length > MAX_SNAPSHOT ||
        node.content !== undefined
      )
        throw new Error('文本节点异常')
    } else if (node.text !== undefined) throw new Error('非文本节点包含 text')
    if (node.marks !== undefined) {
      if (!Array.isArray(node.marks) || node.marks.length > 8) throw new Error('格式列表超限')
      for (const mark of node.marks) {
        if (
          !record(mark) ||
          !MARKS.has(mark.type) ||
          Object.keys(mark).some((k) => !['type', 'attrs'].includes(k))
        )
          throw new Error('未知格式标记')
        if (mark.attrs !== undefined) checkAttributes(mark.attrs, mark.type)
      }
    }
    if (node.content !== undefined) {
      if (!Array.isArray(node.content) || node.content.length > 500) throw new Error('子节点超限')
      for (const child of node.content) pending.push({ node: child, depth: depth + 1 })
    }
  }
  return doc
}
