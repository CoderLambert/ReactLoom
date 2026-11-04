import test from 'node:test'
import assert from 'node:assert/strict'
import {remark} from 'remark'
import remarkGfm from 'remark-gfm'
test('real remark parses GFM table into mdast',()=>{
  const md='# 标题\n\n| name | state |\n| --- | --- |\n| A | PASS |'
  const ast=remark().use(remarkGfm).parse(md)
  assert.equal(ast.children[0].type,'heading')
  assert.ok(ast.children.some(n=>n.type==='table'))
})
test('remark serializes raw HTML as inert Markdown text, not sanitized HTML',()=>{
  const md='# Note\n\n<script>alert(1)</script>\n'
  const text=String(remark().use(remarkGfm).processSync(md))
  assert.ok(text.includes('script'))
  // Parsing text does not execute it. Sanitization is a separate HTML pipeline.
})

import {auditMarkdownTree} from '../examples/audit-policy.mjs'
test('real remark nested heading and shared URL audit',()=>{
  const tree=remark().use(remarkGfm).parse('## **重要** [来源](https://example.org)\n\n![追踪图](https://u:p@tracker.invalid/1.gif)')
  const report=auditMarkdownTree(tree)
  assert.deepEqual(report.headings,['重要 来源'])
  assert.deepEqual(report.links.map(item=>item.safe),[true,false])
})
