import assert from 'node:assert/strict'
import test from 'node:test'
import {
  BatchPolicySchema as Batch,
  FeedSchema as Feed,
  ImportEventSchema,
} from '../examples/schemas.ts'

test('actual Demo Feed schema trims output, rejects credentials and unknown fields', () => {
  const input = { title: '  新闻  ', url: ' HTTPS://EXAMPLE.COM:443/Feed#fragment ' }
  const parsed = Feed.safeParse(input)
  assert.equal(parsed.success, true)
  if (parsed.success) {
    assert.equal(parsed.data.title, '新闻')
    assert.equal(parsed.data.url, 'HTTPS://EXAMPLE.COM:443/Feed#fragment') // Trim only: canonical identity is separate.
    assert.notEqual(parsed.data, input)
  }
  assert.equal(input.title, '  新闻  ')
  assert.equal(Feed.safeParse({ title: '新闻', url: 'https://u:p@example.com/rss' }).success, false)
  assert.equal(
    Feed.safeParse({ title: '新闻', url: 'https://example.com/rss', admin: true }).success,
    false,
  )
})

test('actual Demo batch transforms string TTL and reports canonical duplicate paths', () => {
  const sources = [
    { title: '甲源', url: 'https://EXAMPLE.COM:443/Feed?q=A' },
    { title: '乙源', url: 'https://example.com/Feed?q=A#fragment' },
  ]
  const duplicate = Batch.safeParse({ ttlMinutes: '15', sources })
  assert.equal(duplicate.success, false)
  if (!duplicate.success) assert.deepEqual(duplicate.error.issues[0].path, ['sources', 1, 'url'])
  const distinct = Batch.safeParse({
    ttlMinutes: '15',
    sources: [sources[0], { ...sources[1], url: 'https://example.com/feed?q=A' }],
  })
  assert.equal(distinct.success, true)
  if (distinct.success) assert.equal(distinct.data.ttlMinutes, 15)
  for (const ttl of ['', '1e1', '0', '05', '61', 15])
    assert.equal(Batch.safeParse({ ttlMinutes: ttl, sources: [sources[0]] }).success, false)
})

test('actual discriminator selects the RSS or OPML metadata contract', () => {
  assert.equal(
    ImportEventSchema.safeParse({ kind: 'rss', url: 'https://example.com/feed' }).success,
    true,
  )
  assert.equal(
    ImportEventSchema.safeParse({ kind: 'opml', filename: 'feeds.opml', groups: ['技术'] }).success,
    true,
  )
  assert.equal(
    ImportEventSchema.safeParse({ kind: 'opml', filename: '../feeds.opml', groups: ['技术'] })
      .success,
    false,
  )
  assert.equal(
    ImportEventSchema.safeParse({ kind: 'opml', filename: 'feeds.opml', groups: [] }).success,
    false,
  )
  const unknown = ImportEventSchema.safeParse({ kind: 'other' })
  assert.equal(unknown.success, false)
  if (!unknown.success) assert.deepEqual(unknown.error.issues[0].path, ['kind'])
})

test('the actual cross-field rule reports every later duplicate rather than a test-only clone', () => {
  const result = Batch.safeParse({
    ttlMinutes: '15',
    sources: [
      { title: '甲源', url: 'https://example.com/feed' },
      { title: '乙源', url: 'https://EXAMPLE.COM:443/feed#one' },
      { title: '丙源', url: 'https://example.com/feed#two' },
    ],
  })
  assert.equal(result.success, false)
  if (!result.success)
    assert.deepEqual(
      result.error.issues.map((issue) => issue.path),
      [
        ['sources', 1, 'url'],
        ['sources', 2, 'url'],
      ],
    )
})
