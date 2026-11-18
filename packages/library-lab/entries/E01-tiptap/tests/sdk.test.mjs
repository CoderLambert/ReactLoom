import assert from 'node:assert/strict'
import test from 'node:test'
import { getSchema } from '@tiptap/react'
import { createExtensions, START } from '../examples/editor-config.ts'
import { parseTiptapSnapshot } from '../examples/snapshot-policy.mjs'

test('actual configured StarterKit schema roundtrips valid document and bold marks', () => {
  const schema = getSchema(createExtensions())
  const doc = schema.nodeFromJSON(START)
  doc.check()
  assert.equal(doc.textContent, '工程笔记编辑 Tiptap 示例，观察结构化文档。')
  const bold = schema.nodeFromJSON({
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'SDK', marks: [{ type: 'bold' }] }] },
    ],
  })
  bold.check()
  assert.equal(bold.toJSON().content[0].content[0].marks[0].type, 'bold')
})
test('actual schema rejects structurally invalid allowed nodes before any editor mutation', () => {
  const schema = getSchema(createExtensions())
  const raw = JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'paragraph' }] }],
  })
  const parsed = parseTiptapSnapshot(raw)
  assert.throws(() => schema.nodeFromJSON(parsed).check())
})

test('policy rejects implicit level-one headings accepted by actual schema defaults', () => {
  const schema = getSchema(createExtensions())
  for (const heading of [{ type: 'heading' }, { type: 'heading', attrs: {} }]) {
    const document = { type: 'doc', content: [heading] }
    const acceptedBySdk = schema.nodeFromJSON(document)
    acceptedBySdk.check()
    assert.equal(acceptedBySdk.firstChild.attrs.level, 1)
    assert.throws(() => parseTiptapSnapshot(JSON.stringify(document)), /二三级标题/)
  }
  for (const level of [2, 3]) {
    const parsed = parseTiptapSnapshot(
      JSON.stringify({
        type: 'doc',
        content: [{ type: 'heading', attrs: { level } }],
      }),
    )
    const accepted = schema.nodeFromJSON(parsed)
    accepted.check()
    assert.equal(accepted.firstChild.attrs.level, level)
  }
})
