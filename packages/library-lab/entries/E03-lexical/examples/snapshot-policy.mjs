// Conservative snapshot boundary for this paragraph/text-only Lexical Composer.
export const MAX_SNAPSHOT = 100_000;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const CHILDREN = {root: new Set(['paragraph']), paragraph: new Set(['text','linebreak','tab'])};

export function assertLexicalSnapshot(raw) {
  if (typeof raw !== 'string' || !raw || raw.length > MAX_SNAPSHOT) throw new Error('草稿大小超限');
  const state = JSON.parse(raw);
  if (!record(state) || !record(state.root) || state.root.type !== 'root' ||
      !Array.isArray(state.root.children) || state.root.children.length === 0) {
    throw new Error('不可恢复空根节点');
  }
  const stack = [{node: state.root, depth: 0}];
  let visited = 0;
  while (stack.length) {
    const {node,depth} = stack.pop();
    if (!record(node) || !['root','paragraph','text','linebreak','tab'].includes(node.type) ||
        depth > 8 || ++visited > 400) throw new Error('节点种类/深度非法');
    if (Object.keys(node).some(key => ['__proto__','constructor','prototype','href','src','url'].includes(key) || /^on/i.test(key))) {
      throw new Error('节点属性不安全');
    }
    if (node.style !== undefined && (typeof node.style !== 'string' || node.style.length > 256 ||
        /url\s*\(|expression\s*\(/i.test(node.style))) throw new Error('文本样式不安全');
    if (node.type === 'text' && (typeof node.text !== 'string' || node.text.length > 40_000)) {
      throw new Error('文本节点不合法');
    }
    if (node.type === 'root' || node.type === 'paragraph') {
      if (!Array.isArray(node.children) || node.children.length > 400) throw new Error('子节点超限');
      for(const child of node.children) {
        if (!record(child) || !CHILDREN[node.type].has(child.type)) throw new Error('当前示例不支持该节点');
        stack.push({node: child,depth: depth + 1});
      }
    } else if (node.children !== undefined) throw new Error('叶子节点不能有 children');
  }
  return raw;
}
