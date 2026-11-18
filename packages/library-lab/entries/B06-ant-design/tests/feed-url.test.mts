import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeHttpsFeedUrl } from '../examples/feed-url.ts'

test('HTTPS identity trims, normalizes host/default port and removes fragments', () => {
  assert.equal(
    normalizeHttpsFeedUrl(' HTTPS://EXAMPLE.COM:443/feed.xml#reader '),
    'https://example.com/feed.xml',
  )
  assert.equal(
    normalizeHttpsFeedUrl('https://example.com/feed.xml?kind=tech'),
    'https://example.com/feed.xml?kind=tech',
  )
})
test('malformed URLs, other protocols and embedded credentials are rejected', () => {
  for (const value of [
    '',
    'not-a-url',
    'http://example.com/a',
    'javascript:alert(1)',
    'https://user:secret@example.com/a',
  ]) {
    assert.equal(normalizeHttpsFeedUrl(value), null)
  }
})
