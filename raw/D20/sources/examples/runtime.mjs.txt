import MiniSearch from 'minisearch'
export const initialDocs = [
  { id: '1', title: 'React Suspense patterns', summary: '异步 UI 与错误边界', group: '技术' },
  { id: '2', title: 'TypeScript 业务类型', summary: '运行时验证与领域模型', group: '技术' },
  { id: '3', title: 'React Query 缓存', summary: '竞态取消与分页实践', group: '技术' },
  { id: '4', title: '创业产品增长', summary: '定价实验与用户研究', group: '产品' },
  { id: '5', title: '开源 Node 工具', summary: 'CLI 性能与构建速度', group: '开源' },
  { id: '6', title: 'React Loom 实验室', summary: '工程库文档和 Agent 笔记', group: '开源' },
]

export function buildMiniIndex(documents) {
  const index = new MiniSearch({
    fields: ['title', 'summary'],
    storeFields: ['title', 'group'],
    searchOptions: { boost: { title: 3 }, prefix: true, fuzzy: 0.2 },
  })
  index.addAll(documents)
  return index
}
export function updateFirstDocument(documents) {
  return documents.map((doc) =>
    doc.id === '1'
      ? { ...doc, title: 'React Streaming patterns', summary: 'Streaming data loading 已更新正文' }
      : doc,
  )
}
