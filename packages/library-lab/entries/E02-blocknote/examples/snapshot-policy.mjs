// Deliberately narrower than BlockNote's default schema; NOT an HTML sanitizer.
export const MAX_SNAPSHOT = 60_000
const TYPES = new Set([
  'paragraph',
  'heading',
  'bulletListItem',
  'numberedListItem',
  'checkListItem',
])
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
function keys(value, allowed) {
  if (!record(value) || Object.keys(value).some((key) => !allowed.includes(key))) {
    throw new Error('不支持的内容字段')
  }
}
function text(value) {
  if (typeof value !== 'string' || value.length > 20_000) throw new Error('文本字段不合法')
  return value
}
function styles(value = {}) {
  keys(value, ['bold', 'italic', 'underline', 'strike', 'code', 'textColor', 'backgroundColor'])
  for (const [key, item] of Object.entries(value)) {
    if (['textColor', 'backgroundColor'].includes(key)) {
      if (typeof item !== 'string' || item.length > 100) throw new Error('颜色字段不合法')
    } else if (typeof item !== 'boolean') throw new Error('样式字段不合法')
  }
  return { ...value }
}
function styledText(value) {
  keys(value, ['type', 'text', 'styles'])
  if (value.type !== 'text') throw new Error('只接受文本或HTTPS链接')
  return { type: 'text', text: text(value.text), styles: styles(value.styles) }
}
function inline(value) {
  if (typeof value === 'string') return text(value)
  if (!Array.isArray(value) || value.length > 500) throw new Error('内联内容非法')
  return value.map((item) => {
    if (item?.type === 'text') return styledText(item)
    keys(item, ['type', 'href', 'content'])
    if (item.type !== 'link' || typeof item.href !== 'string') throw new Error('内联类型非法')
    if (
      Array.from(item.href).some(
        (character) =>
          character.codePointAt(0) <= 32 || character === '\\' || character.codePointAt(0) === 127,
      )
    )
      throw new Error('外链字段非法')
    const url = new URL(item.href)
    if (url.protocol !== 'https:' || url.username || url.password)
      throw new Error('只接受无凭据HTTPS链接')
    if (!Array.isArray(item.content) || item.content.length > 500) throw new Error('链接文本非法')
    return { type: 'link', href: item.href, content: item.content.map(styledText) }
  })
}
function props(value, type) {
  const allowed = ['backgroundColor', 'textColor', 'textAlignment']
  if (type === 'heading') allowed.push('level', 'isToggleable')
  if (type === 'checkListItem') allowed.push('checked')
  keys(value, allowed)
  for (const [key, item] of Object.entries(value)) {
    if (key === 'textAlignment') {
      if (!['left', 'center', 'right', 'justify'].includes(item)) throw new Error('对齐值非法')
    } else if (key === 'level') {
      if (![1, 2, 3].includes(item)) throw new Error('标题级别非法')
    } else if (['checked', 'isToggleable'].includes(key)) {
      if (typeof item !== 'boolean') throw new Error('布尔属性非法')
    } else if (typeof item !== 'string' || item.length > 100) throw new Error('颜色属性非法')
  }
  return { ...value }
}
export function parseBlockSnapshot(raw) {
  if (typeof raw !== 'string' || !raw.length || raw.length > MAX_SNAPSHOT)
    throw new Error('草稿大小超限')
  const blocks = JSON.parse(raw)
  if (!Array.isArray(blocks) || !blocks.length || blocks.length > 100)
    throw new Error('块数量不合法')
  let total = 0
  function normalize(block, depth = 0) {
    keys(block, ['id', 'type', 'props', 'content', 'children'])
    if (!TYPES.has(block.type) || depth > 8 || ++total > 100)
      throw new Error('不支持的块类型或深度')
    const output = { type: block.type }
    if (block.props !== undefined) output.props = props(block.props, block.type)
    if (block.content !== undefined) output.content = inline(block.content)
    if (block.children !== undefined) {
      if (!Array.isArray(block.children)) throw new Error('子块非法')
      output.children = block.children.map((child) => normalize(child, depth + 1))
    }
    // Every accepted block loses its persisted ID; the SDK assigns fresh IDs.
    return output
  }
  return blocks.map((block) => normalize(block))
}
