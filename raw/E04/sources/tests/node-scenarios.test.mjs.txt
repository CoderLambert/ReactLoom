import assert from 'node:assert/strict'
import test from 'node:test'
import { Compartment, EditorState } from '@codemirror/state'

test('real CodeMirror state transaction changes doc immutably', () => {
  const original = EditorState.create({ doc: '你好' })
  const next = original.update({
    changes: { from: original.doc.length, insert: ' CodeMirror' },
  }).state
  assert.equal(original.doc.toString(), '你好')
  assert.equal(next.doc.toString(), '你好 CodeMirror')
})
test('Compartment reconfigures readOnly through real state effects', () => {
  const compartment = new Compartment()
  const state = EditorState.create({ extensions: [compartment.of(EditorState.readOnly.of(false))] })
  const reconfigured = state.update({
    effects: compartment.reconfigure(EditorState.readOnly.of(true)),
  }).state
  assert.equal(state.facet(EditorState.readOnly), false)
  assert.equal(reconfigured.facet(EditorState.readOnly), true)
})

test('UI extension config permits programmatic changes even when user readOnly facet is true', async () => {
  const { createEditorConfig } = await import('../examples/editor-config.mjs')
  const config = createEditorConfig()
  const state = EditorState.create({
    doc: 'const total: number = 1',
    extensions: config.extensions,
  })
  const locked = state.update({
    effects: config.readOnly.reconfigure(EditorState.readOnly.of(true)),
  }).state
  const changed = locked.update({ changes: { from: locked.doc.length, insert: ';' } }).state
  assert.equal(locked.facet(EditorState.readOnly), true)
  assert.equal(changed.doc.toString(), 'const total: number = 1;')
  assert.equal(state.facet(EditorState.tabSize), 2)
})
