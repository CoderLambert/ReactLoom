// Intentionally limited to this editor's paragraph/text protocol, not arbitrary Lexical JSON.
export const MAX_SNAPSHOT = 100_000
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const ELEMENT = ['type', 'version', 'children', 'direction', 'format', 'indent']
const FIELDS = {
  root: ELEMENT,
  paragraph: [...ELEMENT, 'textFormat', 'textStyle'],
  text: ['type', 'version', 'text', 'detail', 'format', 'mode', 'style'],
  tab: ['type', 'version', 'text', 'detail', 'format', 'mode', 'style'],
  linebreak: ['type', 'version'],
}
function integer(value, max) {
  return Number.isInteger(value) && value >= 0 && value <= max
}
export function assertLexicalSnapshot(raw) {
  if (typeof raw !== 'string' || !raw || raw.length > MAX_SNAPSHOT) throw new Error('草稿大小超限')
  const state = JSON.parse(raw)
  if (
    !record(state) ||
    Object.keys(state).length !== 1 ||
    !record(state.root) ||
    state.root.type !== 'root' ||
    !Array.isArray(state.root.children) ||
    !state.root.children.length
  )
    throw new Error('不可恢复空根节点或未知状态字段')
  const stack = [{ node: state.root, parent: null }]
  let visited = 0
  while (stack.length) {
    const { node, parent } = stack.pop()
    if (!record(node) || !Object.hasOwn(FIELDS, node.type) || ++visited > 400)
      throw new Error('节点种类/数量非法')
    if (node.version !== 1 || Object.keys(node).some((key) => !FIELDS[node.type].includes(key)))
      throw new Error('节点协议字段非法')
    if (parent === 'root' && node.type !== 'paragraph') throw new Error('根节点只接受段落')
    if (parent === 'paragraph' && !['text', 'tab', 'linebreak'].includes(node.type))
      throw new Error('段落只接受文本叶子')
    if (node.type === 'root' || node.type === 'paragraph') {
      if (!Array.isArray(node.children) || node.children.length > 400) throw new Error('子节点超限')
      if (node.direction !== undefined && ![null, 'ltr', 'rtl'].includes(node.direction))
        throw new Error('方向字段非法')
      if (
        node.format !== undefined &&
        !['', 'left', 'center', 'right', 'justify', 'start', 'end'].includes(node.format)
      )
        throw new Error('段落对齐非法')
      if (node.indent !== undefined && !integer(node.indent, 8)) throw new Error('缩进字段非法')
      if (node.textFormat !== undefined && !integer(node.textFormat, 2047))
        throw new Error('段落文本格式非法')
      if (node.textStyle !== undefined && node.textStyle !== '')
        throw new Error('此合同不接受内联CSS')
      for (const child of node.children) stack.push({ node: child, parent: node.type })
    } else if (node.type === 'text' || node.type === 'tab') {
      if (typeof node.text !== 'string' || node.text.length > 40_000)
        throw new Error('文本字段非法')
      if (node.type === 'tab' && node.text !== '\t') throw new Error('Tab内容非法')
      if (node.detail !== undefined && !integer(node.detail, 3)) throw new Error('文本detail非法')
      if (node.format !== undefined && !integer(node.format, 2047)) throw new Error('文本格式非法')
      if (node.mode !== undefined && !['normal', 'token', 'segmented'].includes(node.mode))
        throw new Error('文本mode非法')
      if (node.style !== undefined && node.style !== '') throw new Error('此合同不接受内联CSS')
    }
  }
  return raw
}
