import { stableRowId } from './filter-policy.mjs'

export type Article = { id: string; category: string; title: string; summary: string }
export const ESTIMATED_ROW_SIZE = 94
export const OVERSCAN = 5
export function makeArticles(count: number): Article[] {
  const categories = ['工程实践', '组件方案', '前端性能', '浏览器平台']
  return Array.from({ length: count }, (_, index) => ({
    id: `rss-${index + 1}`,
    category: categories[index % 4],
    title: `${categories[index % 4]} / 文章 ${index + 1}`,
    summary: '本地虚构新闻摘要。'.repeat((index % 11) + 1),
  }))
}
export function filterArticles(items: Article[], category: string, query: string) {
  return items.filter(
    (item) =>
      (category === 'all' || item.category === category) &&
      (item.title + item.summary).toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  )
}
export function createVirtualOptions(items: Article[]) {
  return {
    count: items.length,
    getItemKey: (index: number) => stableRowId(items, index),
    estimateSize: () => ESTIMATED_ROW_SIZE,
    overscan: OVERSCAN,
  }
}
