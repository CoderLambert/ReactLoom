import assert from 'node:assert/strict'
import test from 'node:test'
import { htmlPolicy } from './html-policy.mjs'
import { MAX_INPUT_UNITS, sanitizePreview } from './sanitize-preview.mjs'

// Injected doubles prove wrapper control flow only, NOT real DOMPurify sanitization.
test('unsupported or oversized input never invokes a sanitizer or returns dirty HTML', () => {
  let calls = 0
  const purifier = {
    isSupported: false,
    sanitize() {
      calls++
      throw new Error('should not run')
    },
  }
  assert.equal(sanitizePreview('<script>x</script>', purifier).html, '')
  assert.equal(
    sanitizePreview('x'.repeat(MAX_INPUT_UNITS + 1), { ...purifier, isSupported: true }).html,
    '',
  )
  assert.equal(calls, 0)
})
test('sanitizer error clears preview and success uses only sanitized return', () => {
  const failed = sanitizePreview('<p>dirty</p>', {
    isSupported: true,
    sanitize() {
      throw new Error('test')
    },
  })
  assert.equal(failed.html, '')
  assert.match(failed.error, /净化失败/)
  assert.equal(
    sanitizePreview('dirty', {
      isSupported: true,
      sanitize() {
        return { unexpected: true }
      },
    }).html,
    '',
  )
  const success = sanitizePreview('dirty', {
    isSupported: true,
    sanitize(source, policy) {
      assert.equal(source, 'dirty')
      assert.equal(policy, htmlPolicy)
      return '<p>clean</p>'
    },
  })
  assert.deepEqual(success, { html: '<p>clean</p>', error: '' })
})
