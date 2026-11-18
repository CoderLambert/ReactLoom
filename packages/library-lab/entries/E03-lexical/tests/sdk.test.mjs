import assert from 'node:assert/strict'
import test from 'node:test'
import { $createParagraphNode, $createTextNode, $getRoot, createEditor } from 'lexical'
import { assertLexicalSnapshot } from '../examples/snapshot-policy.mjs'
import { resetDocument, restoreSnapshot } from '../examples/state-operations.ts'

function editor() {
  return createEditor({
    namespace: 'E03-headless-state',
    onError(error) {
      throw error
    },
  })
}
test('real no-DOM EditorState update/read and shared reset/restore round-trip', () => {
  const e = editor()
  resetDocument(e)
  assert.equal(
    e.getEditorState().read(() => $getRoot().getTextContent()),
    '新的编辑草稿',
  )
  const saved = assertLexicalSnapshot(JSON.stringify(e.getEditorState().toJSON()))
  e.update(
    () => {
      $getRoot()
        .clear()
        .append($createParagraphNode().append($createTextNode('changed').toggleFormat('bold')))
    },
    { discrete: true },
  )
  assert.equal(e.getEditorState().toJSON().root.children[0].children[0].format, 1)
  restoreSnapshot(e, saved)
  // setEditorState commits synchronously without a DOM root.
  assert.equal(
    e.getEditorState().read(() => $getRoot().getTextContent()),
    '新的编辑草稿',
  )
})
test('shared restore rejects malformed protocol before changing current EditorState', () => {
  const e = editor()
  resetDocument(e)
  const before = JSON.stringify(e.getEditorState().toJSON())
  for (const raw of [
    '{',
    '{}',
    JSON.stringify({
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [{ type: 'text', version: 1, text: 'x', format: 'bad' }],
          },
        ],
      },
    }),
  ]) {
    assert.throws(() => restoreSnapshot(e, raw))
    assert.equal(JSON.stringify(e.getEditorState().toJSON()), before)
  }
})
test('real update unregister prevents further notifications without DOM/destroy claims', () => {
  const e = editor()
  let calls = 0
  const off = e.registerUpdateListener(() => calls++)
  resetDocument(e)
  assert.ok(calls > 0)
  off()
  const before = calls
  resetDocument(e)
  assert.equal(calls, before)
})

test('throwing onError propagates actual SDK parse failure without applying partial state', () => {
  const e = editor()
  resetDocument(e)
  const before = JSON.stringify(e.getEditorState().toJSON())
  assert.throws(() =>
    e.parseEditorState(
      JSON.stringify({
        root: { type: 'root', version: 1, children: [{ type: 'unknown-node', version: 1 }] },
      }),
    ),
  )
  assert.equal(JSON.stringify(e.getEditorState().toJSON()), before)
})
