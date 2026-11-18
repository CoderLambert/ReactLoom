import { chunk, groupBy, orderBy, uniqBy } from 'es-toolkit/array'

export const seed = [
  {
    url: 'https://example.org/rss?utm_source=homepage&id=42',
    title: 'Frontend Insights',
    source: 'official',
    publishedAt: '2026-10-26T06:00:00Z',
  },
  {
    url: 'https://example.org/rss?id=42&utm_campaign=email',
    title: 'Same article older',
    source: 'official',
    publishedAt: '2026-10-25T06:00:00Z',
  },
  {
    url: 'https://community.example.org/post/7',
    title: 'Engineering case study',
    source: 'community',
    publishedAt: '2026-10-24T06:00:00Z',
  },
  {
    url: 'https://example.org/rss?id=43',
    title: 'Release notes',
    source: 'official',
    publishedAt: '2026-10-27T06:00:00Z',
  },
  {
    url: 'https://dev.example.org/post/5',
    title: 'Performance deep dive',
    source: 'community',
    publishedAt: '2026-10-23T06:00:00Z',
  },
]

export function canonicalUrl(raw) {
  const url = new URL(raw)
  if (url.protocol !== 'https:' && url.protocol !== 'http:')
    throw new Error('只接受 HTTP/HTTPS URL')
  url.hash = ''
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith('utm_') || ['fbclid', 'gclid'].includes(key.toLowerCase())) {
      url.searchParams.delete(key)
    }
  }
  url.searchParams.sort()
  return url.toString()
}

export function normalizeArticle(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('文章必须是对象')
  const item = raw
  if (typeof item.title !== 'string' || !item.title.trim()) throw new Error('文章标题缺失')
  if (typeof item.url !== 'string') throw new Error('文章来源 URL 缺失')
  if (typeof item.publishedAt !== 'string' || !Number.isFinite(Date.parse(item.publishedAt))) {
    throw new Error('发布日期无效')
  }
  const source = item.source === 'official' || item.source === 'community' ? item.source : 'other'
  return {
    title: item.title.trim(),
    url: canonicalUrl(item.url),
    source,
    publishedAt: new Date(item.publishedAt).toISOString(),
  }
}

export function makeDigest(raw, pageSize) {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100)
    throw new RangeError('pageSize 必须为1–100')
  const accepted = []
  const rejected = []
  raw.forEach((value, index) => {
    try {
      accepted.push(normalizeArticle(value))
    } catch (error) {
      rejected.push({ index, reason: error instanceof Error ? error.message : String(error) })
    }
  })
  // orderBy + uniqBy: same canonical URL retains newest article, not first arbitrary arrival.
  const newestFirst = orderBy(
    accepted,
    [(item) => Date.parse(item.publishedAt), (item) => item.url],
    ['desc', 'asc'],
  )
  const articles = uniqBy(newestFirst, (item) => item.url)
  const grouped = groupBy(articles, (item) => item.source)
  const bySource = {
    official: grouped.official ?? [],
    community: grouped.community ?? [],
    other: grouped.other ?? [],
  }
  return { accepted, newestFirst, articles, bySource, pages: chunk(articles, pageSize), rejected }
}
