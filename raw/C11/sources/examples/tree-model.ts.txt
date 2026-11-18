export type Item = { id: string; name: string; children?: Item[] }
export const starter: Item[] = [
  {
    id: 'grp-tech',
    name: '技术',
    children: [
      { id: 'feed-react', name: 'React 官方博客' },
      { id: 'feed-vite', name: 'Vite 官方动态' },
    ],
  },
  { id: 'grp-business', name: '商业', children: [{ id: 'feed-product', name: '产品实践' }] },
  { id: 'grp-reading', name: '个人收藏', children: [{ id: 'feed-notes', name: '深度阅读' }] },
]
export function initialTree(advanced: boolean): Item[] {
  const nodes = structuredClone(starter)
  if (advanced)
    nodes[0].children?.push(
      ...Array.from({ length: 1800 }, (_, index) => ({
        id: `bulk-${index}`,
        name: `技术源 ${index + 1}`,
      })),
    )
  return nodes
}
export function withoutIds(nodes: Item[], ids: Set<string>): { remaining: Item[]; picked: Item[] } {
  const picked: Item[] = []
  const remaining: Item[] = []
  for (const item of nodes) {
    if (ids.has(item.id)) {
      picked.push(item)
      continue
    }
    if (item.children) {
      const nested = withoutIds(item.children, ids)
      picked.push(...nested.picked)
      remaining.push({ ...item, children: nested.remaining })
    } else remaining.push(item)
  }
  return { remaining, picked }
}
export function locate(nodes: Item[], parentId: string | null): Item[] | null {
  if (parentId === null) return nodes
  for (const item of nodes) {
    if (item.id === parentId) return item.children ?? []
    if (item.children) {
      const children = locate(item.children, parentId)
      if (children !== null) return children
    }
  }
  return null
}
export function insert(
  nodes: Item[],
  parentId: string | null,
  index: number,
  picked: Item[],
): Item[] | null {
  if (parentId === null) {
    const result = [...nodes]
    result.splice(Math.max(0, Math.min(index, result.length)), 0, ...picked)
    return result
  }
  let inserted = false
  const result = nodes.map((item) => {
    if (item.id === parentId) {
      inserted = true
      return { ...item, children: insert(item.children ?? [], null, index, picked) ?? [] }
    }
    if (!item.children) return item
    const nested = insert(item.children, parentId, index, picked)
    if (nested !== null) {
      inserted = true
      return { ...item, children: nested }
    }
    return item
  })
  return inserted ? result : null
}
export function renameTree(nodes: Item[], id: string, name: string): Item[] {
  return nodes.map((node) =>
    node.id === id
      ? { ...node, name: name.trim() || '未命名' }
      : node.children
        ? { ...node, children: renameTree(node.children, id, name) }
        : node,
  )
}
export function stripTree(nodes: Item[], ids: Set<string>): Item[] {
  return withoutIds(nodes, ids).remaining
}
export function countTree(nodes: Item[]): number {
  return nodes.reduce(
    (total, item) => total + 1 + (item.children ? countTree(item.children) : 0),
    0,
  )
}
export function findLocation(
  nodes: Item[],
  id: string,
  parentId: string | null = null,
): { parentId: string | null; index: number; count: number } | null {
  for (const [index, node] of nodes.entries()) {
    if (node.id === id) return { parentId, index, count: nodes.length }
    if (node.children) {
      const found = findLocation(node.children, id, node.id)
      if (found) return found
    }
  }
  return null
}
