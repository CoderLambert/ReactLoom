import { createLoader, createSerializer, parseAsInteger, parseAsString } from 'nuqs/server'

export const URL_KEYS = Object.freeze({
  query: 'll_c19_q',
  page: 'll_c19_page',
  group: 'll_c19_group',
})
export const queryParsers = {
  query: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  group: parseAsString.withDefault('all'),
}
export const loadQuery = createLoader(queryParsers, { urlKeys: URL_KEYS })
export const serializeQuery = createSerializer(queryParsers, { urlKeys: URL_KEYS })
export const feeds = [
  { id: 'rss-001', name: 'React 官方博客', group: 'tech' },
  { id: 'rss-002', name: '前端部署实践', group: 'tech' },
  { id: 'rss-003', name: '产品发布日志', group: 'business' },
  { id: 'rss-004', name: '技术架构周刊', group: 'tech' },
  { id: 'rss-005', name: '商业市场观察', group: 'business' },
]
export function pageLink(pathname, search, hash, value) {
  const params = new URLSearchParams(search)
  params.set(URL_KEYS.page, value)
  return `${pathname}?${params}${hash ? `#${hash}` : ''}`
}
