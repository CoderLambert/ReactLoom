import assert from 'node:assert/strict'
import test from 'node:test'
import { chunk, groupBy, orderBy, uniqBy } from 'es-toolkit/array'
import { canonicalUrl, makeDigest, seed } from '../examples/pipeline.mjs'

test('real SDK and shared UI pipeline: normalize, sort, deduplicate, group, paginate', () => {
  const result = makeDigest(seed, 2)
  assert.equal(result.accepted.length, 5)
  assert.deepEqual(
    result.articles.map((row) => row.title),
    ['Release notes', 'Frontend Insights', 'Engineering case study', 'Performance deep dive'],
  )
  assert.deepEqual(
    result.pages.map((page) => page.length),
    [2, 2],
  )
  assert.deepEqual(
    Object.fromEntries(Object.entries(result.bySource).map(([key, rows]) => [key, rows.length])),
    { official: 2, community: 2, other: 0 },
  )
  assert.equal(result.articles[1].url, 'https://example.org/rss?id=42')
  assert.equal(result.articles[0].url, 'https://example.org/rss?id=43')
  assert.equal(
    uniqBy(
      orderBy(
        [
          { id: 1, date: 1 },
          { id: 1, date: 2 },
        ],
        [(row) => row.date],
        ['desc'],
      ),
      (row) => row.id,
    )[0].date,
    2,
  )
  assert.equal(groupBy(result.articles, (row) => row.source).official.length, 2)
  assert.deepEqual(chunk([1, 2, 3], 2), [[1, 2], [3]])
})

test('custom boundary preserves business IDs, rejects bad rows and continues', () => {
  assert.equal(
    canonicalUrl('https://example.org/rss?utm_source=x&id=42&gclid=x#section'),
    'https://example.org/rss?id=42',
  )
  assert.throws(() => canonicalUrl('javascript:alert(1)'), /HTTP/)
  const result = makeDigest(
    [
      ...seed,
      { url: 'javascript:alert(1)', title: 'bad', publishedAt: '2026-10-26' },
      { foo: 1 },
      null,
      { title: 'bad date', url: 'https://example.org', publishedAt: 'invalid' },
    ],
    3,
  )
  assert.equal(result.articles.length, 4)
  assert.deepEqual(
    result.rejected.map((row) => row.index),
    [5, 6, 7, 8],
  )
  assert.deepEqual(
    result.pages.map((page) => page.length),
    [3, 1],
  )
  assert.deepEqual(makeDigest([], 2).pages, [])
  for (const size of [0, -1, 101, 1.5, NaN]) assert.throws(() => makeDigest(seed, size), RangeError)
})
