import assert from 'node:assert/strict'
import test from 'node:test'
import { remark } from 'remark'
import { MAX_BYTES, samples, transformMarkdown } from '../examples/workshop.mjs'

test('shared real remark parses basic heading structure and normalizes Markdown', () => {
  const answer = transformMarkdown(samples.basic)
  assert.deepEqual(answer.audit.headings, ['ReactLoom Note', 'Getting started'])
  assert.equal(answer.audit.nodeTypes.list, 1)
  assert.equal(transformMarkdown(answer.normalized).normalized, answer.normalized)
})
test('shared GFM processor retains tables, task items and strikethrough', () => {
  const answer = transformMarkdown(samples.business)
  assert.equal(answer.audit.nodeTypes.table, 1)
  assert.equal(answer.audit.nodeTypes.delete, 1)
  assert.match(answer.normalized, /\[x\]/)
  assert.match(answer.normalized, /NOT_RUN/)
  assert.match(answer.normalized, /~~旧方案~~/)
})
test('same parsed AST audit retains unsafe URLs/definitions/raw HTML without sanitizing', () => {
  const answer = transformMarkdown(samples.advanced)
  assert.equal(answer.audit.rawHtmlNodes, 1)
  assert.deepEqual(
    answer.audit.links.map((link) => link.safe),
    [true, false, true, false],
  )
  assert.ok(answer.audit.links.some((link) => link.url === 'data:text/html,untrusted'))
  assert.match(answer.normalized, /<script>/)
  assert.match(answer.normalized, /javascript:alert/)
})
test('parse and stringify do not run transformer plugins; runSync does', () => {
  let transformed = 0
  const processor = remark().use(() => () => {
    transformed++
  })
  const ast = processor.parse('# heading')
  processor.stringify(ast)
  assert.equal(transformed, 0)
  processor.runSync(ast)
  assert.equal(transformed, 1)
})
test('actual shared processor enforces UTF8 bytes at exact 24000 boundary', () => {
  assert.equal(new TextEncoder().encode('中'.repeat(8000)).byteLength, MAX_BYTES)
  assert.doesNotThrow(() => transformMarkdown('中'.repeat(8000)))
  assert.throws(() => transformMarkdown('中'.repeat(8001)), /24,000 UTF-8/)
})
