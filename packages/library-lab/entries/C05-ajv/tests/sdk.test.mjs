import assert from 'node:assert/strict'
import test from 'node:test'
import { validateFeedBoundaries } from '../examples/rss-policy.mjs'
import { createValidators } from '../examples/schemas.ts'

const validators = createValidators()
test('actual shared Feed contract keeps HTTPS shape distinct from the domain credential policy', () => {
  const valid = { id: 'frontend', title: '前端工程', url: 'https://example.org/rss' }
  assert.equal(validators.basic(valid), true)
  assert.deepEqual(validateFeedBoundaries('basic', valid), [])
  assert.equal(validators.basic({ ...valid, url: 'http://example.org/rss' }), false)
  const credential = { ...valid, url: 'https://user:pass@example.org/rss' }
  assert.equal(validators.basic(credential), true)
  assert.deepEqual(
    validateFeedBoundaries('basic', credential).map((x) => x.path),
    ['/url'],
  )
  assert.equal(validators.basic({ ...valid, extra: true }), false)
  assert.ok(validators.basic.errors.some((x) => x.keyword === 'additionalProperties'))
})
test('actual shared batch compares full objects in uniqueItems and canonical URLs in domain policy', () => {
  const first = { id: 'one', title: '一号订阅', url: 'https://EXAMPLE.COM:443/Feed?q=A' }
  const second = { id: 'two', title: '二号订阅', url: 'https://example.com/Feed?q=A#section' }
  const payload = { team: 'news', feeds: [first, second] }
  assert.equal(validators.business(payload), true)
  assert.deepEqual(
    validateFeedBoundaries('business', payload).map((x) => x.path),
    ['/feeds/1/url'],
  )
  assert.equal(validators.business({ team: 'news', feeds: [first, { ...first }] }), false)
  assert.ok(validators.business.errors.some((x) => x.keyword === 'uniqueItems'))
  assert.equal(validators.business({ team: 'news', feeds: [] }), false)
  assert.equal(
    validators.business({
      team: 'news',
      feeds: Array.from({ length: 6 }, (_, i) => ({ ...first, id: `item-${i}` })),
    }),
    false,
  )
})
test('actual shared conditional contract inherits object type in strict mode and does not coerce, insert or remove data', () => {
  assert.equal(validators.advanced({ enabled: false }), true)
  assert.equal(validators.advanced({ enabled: true }), false)
  assert.ok(validators.advanced.errors.some((x) => x.keyword === 'required'))
  assert.equal(validators.advanced({ enabled: true, maxConcurrent: 3 }), true)
  const raw = { enabled: true, maxConcurrent: '3', unreviewed: true }
  const original = structuredClone(raw)
  assert.equal(validators.advanced(raw), false)
  const copied = validators.advanced.errors.map((x) => ({
    path: x.instancePath,
    keyword: x.keyword,
    message: x.message,
  }))
  assert.ok(copied.some((x) => x.keyword === 'type'))
  assert.ok(copied.some((x) => x.keyword === 'additionalProperties'))
  assert.deepEqual(raw, original)
  assert.equal(validators.advanced({ enabled: false, maxConcurrent: 0 }), false)
  assert.equal(validators.advanced({ enabled: true, maxConcurrent: 9 }), false)
  assert.equal(validators.advanced({ enabled: false }), true)
  assert.ok(copied.some((x) => x.keyword === 'type')) // Stored errors survive later validator.errors replacement.
})
