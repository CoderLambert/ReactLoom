import assert from 'node:assert/strict'
import test from 'node:test'
import * as v from 'valibot'
import { canonicalHttpsFeedUrl, isRealCivilDate } from '../examples/boundary-policy.mjs'

test('real Valibot validates and strips extra keys', () => {
  const schema = v.object({ name: v.pipe(v.string(), v.trim(), v.minLength(2)) })
  const result = v.safeParse(schema, { name: '  RSS  ', secret: 'must not escape' })
  assert.equal(result.success, true)
  if (result.success) assert.deepEqual(result.output, { name: 'RSS' })
})
test('real Valibot emits validation issues', () => {
  const schema = v.pipe(v.string(), v.url())
  const result = v.safeParse(schema, 'not a url')
  assert.equal(result.success, false)
  if (!result.success) assert.ok(result.issues.length)
})
test('real Valibot partialCheck forwards cross-field issue', () => {
  const schema = v.pipe(
    v.object({ start: v.string(), end: v.string() }),
    v.forward(
      v.partialCheck([['start'], ['end']], (value) => value.start <= value.end, 'end<start'),
      ['end'],
    ),
  )
  const result = v.safeParse(schema, { start: '2026-11-04', end: '2026-11-01' })
  assert.equal(result.success, false)
  if (!result.success) assert.match(result.issues[0].message, /end<start/)
})

test('real Valibot checks HTTPS credentials and strict civil dates', () => {
  const url = v.pipe(
    v.string(),
    v.url(),
    v.check((x) => canonicalHttpsFeedUrl(x) !== null),
  )
  assert.equal(v.safeParse(url, 'https://user:pass@example.com/rss').success, false)
  assert.equal(v.safeParse(url, 'https://example.com/Feed?q=A').success, true)
  const schema = v.object({ date: v.pipe(v.string(), v.isoDate(), v.check(isRealCivilDate)) })
  const invalid = v.safeParse(schema, { date: '2026-02-29' })
  assert.equal(invalid.success, false)
  if (!invalid.success) assert.equal(invalid.issues[0].path?.[0]?.key, 'date')
  assert.equal(v.safeParse(schema, { date: '2000-02-29' }).success, true)
})

test('actual shared Feed and Batch schemas narrow output and report collection paths and limits', async () => {
  const { FeedSchema, BatchSchema } = await import('../examples/schemas.ts')
  const validFeed = {
    name: '  RSS来源  ',
    url: 'https://example.com/Feed#section',
    category: 'tech',
    extra: 'removed',
  }
  const one = v.safeParse(FeedSchema, validFeed)
  assert.equal(one.success, true)
  assert.deepEqual(one.output, {
    name: 'RSS来源',
    url: 'https://example.com/Feed#section',
    category: 'tech',
  })
  const nested = v.safeParse(
    BatchSchema,
    { owner: ' ', feeds: [validFeed, { ...validFeed, url: 'http://example.org/rss' }] },
    { abortEarly: false },
  )
  assert.equal(nested.success, false)
  assert.deepEqual(new Set(nested.issues.map(v.getDotPath)), new Set(['owner', 'feeds.1.url']))
  assert.equal(v.safeParse(BatchSchema, { owner: '新闻项目', feeds: [] }).success, false)
  assert.equal(
    v.safeParse(BatchSchema, { owner: '新闻项目', feeds: Array(4).fill(validFeed) }).success,
    false,
  )
})
test('actual shared Window validates both civil dates and forwards order despite an unrelated type error', async () => {
  const { WindowSchema } = await import('../examples/schemas.ts')
  const invalidEnd = v.safeParse(WindowSchema, { start: '2026-02-28', end: '2026-02-30' })
  assert.equal(invalidEnd.success, false)
  assert.ok(
    invalidEnd.issues.some(
      (issue) => v.getDotPath(issue) === 'end' && issue.message === '不存在的公历日期',
    ),
  )
  const combined = v.safeParse(
    WindowSchema,
    { start: '2026-11-05', end: '2026-11-02', note: 42 },
    { abortEarly: false },
  )
  assert.equal(combined.success, false)
  assert.deepEqual(new Set(combined.issues.map(v.getDotPath)), new Set(['note', 'end']))
  assert.equal(v.safeParse(WindowSchema, { start: '2024-02-29', end: '2024-03-01' }).success, true)
})
