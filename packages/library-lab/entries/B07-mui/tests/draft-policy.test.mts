import assert from 'node:assert/strict'
import test from 'node:test'
import { validateFeedDraft } from '../examples/draft-policy.ts'

test('local validation returns both field errors without inventing a saved subscription', () => {
  assert.deepEqual(validateFeedDraft('   ', 'invalid'), {
    valid: false,
    errors: {
      title: '名称必须为1–60个字符',
      url: '请输入完整HTTPS订阅地址',
    },
  })
})
test('trim and HTTPS canonicalization accept the 60-unit boundary, reject 61 and other protocols', () => {
  assert.deepEqual(validateFeedDraft('  工程实践  ', ' HTTPS://EXAMPLE.ORG:443/feed.xml '), {
    valid: true,
    title: '工程实践',
    endpoint: 'https://example.org/feed.xml',
  })
  assert.equal(validateFeedDraft('a'.repeat(60), 'https://example.org/feed.xml').valid, true)
  assert.equal(validateFeedDraft('a'.repeat(61), 'https://example.org/feed.xml').valid, false)
  for (const url of ['', 'http://example.org/feed.xml', 'ftp://example.org/feed.xml'])
    assert.equal(validateFeedDraft('有效名称', url).valid, false)
})
