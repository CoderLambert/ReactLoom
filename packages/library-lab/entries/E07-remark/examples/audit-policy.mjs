// The React example and Node tests use this one pure Markdown AST audit.
const UNSAFE = /[\u0000-\u0020\u007f]/u;
export function safeReference(value) {
  if (typeof value !== 'string' || !value || value.length > 2048 || UNSAFE.test(value)) return false;
  if (value.startsWith('#')) return /^#[\p{L}\p{N}_.:-]+$/u.test(value);
  if (value.startsWith('/')) return !value.startsWith('//') && !value.includes('\\');
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}
function nodeText(root) {
  const pieces = [], stack = [root];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== 'object') continue;
    if (typeof n.value === 'string') pieces.push(n.value);
    if (Array.isArray(n.children))
      for (let i = n.children.length - 1; i >= 0; i--) stack.push(n.children[i]);
  }
  return pieces.join('');
}
export function auditMarkdownTree(root) {
  const result = {headings: [], links: [], nodes: 0};
  const stack = [root];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== 'object') continue;
    if (++result.nodes > 4096) throw new Error('Markdown AST exceeds 4096 nodes');
    if (n.type === 'heading') result.headings.push(nodeText(n));
    if ((n.type === 'link' || n.type === 'image') && typeof n.url === 'string')
      result.links.push({url: n.url, safe: safeReference(n.url)});
    if (Array.isArray(n.children))
      for (let i = n.children.length - 1; i >= 0; i--) stack.push(n.children[i]);
  }
  return result;
}
