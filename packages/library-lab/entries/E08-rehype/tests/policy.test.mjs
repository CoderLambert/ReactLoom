import assert from 'node:assert/strict'
import test from 'node:test'
import { assertHTMLBudget, MAX_HTML_BYTES } from '../examples/input-policy.mjs'

test('HTML budget is exactly 25000 UTF8 bytes, not 25KiB or UTF16 units', () => {
  assert.equal(assertHTMLBudget('x'.repeat(MAX_HTML_BYTES)).length, 25000)
  assert.throws(() => assertHTMLBudget('x'.repeat(MAX_HTML_BYTES + 1)), /字节/)
  assert.equal(assertHTMLBudget(`${'中'.repeat(8333)}x`).length, 8334)
  assert.throws(() => assertHTMLBudget('中'.repeat(8334)), /25002/)
})
test('empty input is valid and nonstrings are rejected', () => {
  assert.equal(assertHTMLBudget(''), '')
  assert.throws(() => assertHTMLBudget(null), /字符串/)
})
