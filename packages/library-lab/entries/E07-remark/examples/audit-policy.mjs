// Local syntactic audit, NOT a sanitizer or authorization policy.
const hasUnsafeCharacters = (value) =>
  Array.from(value).some((character) => {
    const point = character.codePointAt(0)
    return point <= 32 || point === 127 || character === '\\'
  })
export function safeReference(value) {
  if (typeof value !== 'string' || !value || value.length > 2048 || hasUnsafeCharacters(value))
    return false
  if (value.startsWith('#')) return /^#[\p{L}\p{N}_.:-]+$/u.test(value)
  if (value.startsWith('/')) return !value.startsWith('//')
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password
  } catch {
    return false
  }
}
function nodeText(root) {
  const pieces = [],
    stack = [root],
    seen = new WeakSet()
  let visited = 0
  while (stack.length) {
    const node = stack.pop()
    if (!node || typeof node !== 'object') continue
    if (seen.has(node) || ++visited > 4096)
      throw new Error('Markdown heading is cyclic or exceeds 4096 nodes')
    seen.add(node)
    if (['text', 'inlineCode'].includes(node.type) && typeof node.value === 'string')
      pieces.push(node.value)
    if (node.type === 'image' && typeof node.alt === 'string') pieces.push(node.alt)
    if (Array.isArray(node.children))
      for (let i = node.children.length - 1; i >= 0; i--) stack.push(node.children[i])
  }
  return pieces.join('')
}
export function auditMarkdownTree(root) {
  const result = { headings: [], links: [], nodes: 0, rawHtmlNodes: 0, nodeTypes: {} }
  const stack = [root],
    seen = new WeakSet()
  while (stack.length) {
    const node = stack.pop()
    if (!node || typeof node !== 'object') continue
    if (seen.has(node) || ++result.nodes > 4096)
      throw new Error('Markdown AST is cyclic or exceeds 4096 nodes')
    seen.add(node)
    if (typeof node.type === 'string') {
      // Object.hasOwn avoids inherited-property arithmetic for arbitrary policy inputs.
      Object.defineProperty(result.nodeTypes, node.type, {
        value: (Object.hasOwn(result.nodeTypes, node.type) ? result.nodeTypes[node.type] : 0) + 1,
        enumerable: true,
        writable: true,
        configurable: true,
      })
    }
    if (node.type === 'heading') result.headings.push(nodeText(node))
    if (node.type === 'html') result.rawHtmlNodes++
    if (['link', 'image', 'definition'].includes(node.type) && typeof node.url === 'string')
      result.links.push({ url: node.url, safe: safeReference(node.url) })
    if (Array.isArray(node.children))
      for (let i = node.children.length - 1; i >= 0; i--) stack.push(node.children[i])
  }
  return result
}
