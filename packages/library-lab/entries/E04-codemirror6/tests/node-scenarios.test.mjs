import test from 'node:test'
import assert from 'node:assert/strict'
import {EditorState, Compartment} from '@codemirror/state'
test('real CodeMirror state transaction changes doc immutably',()=>{
  const original=EditorState.create({doc:'你好'})
  const next=original.update({changes:{from:original.doc.length,insert:' CodeMirror'}}).state
  assert.equal(original.doc.toString(),'你好')
  assert.equal(next.doc.toString(),'你好 CodeMirror')
})
test('Compartment reconfigures readOnly through real state effects',()=>{
  const compartment=new Compartment()
  const state=EditorState.create({extensions:[compartment.of(EditorState.readOnly.of(false))]})
  const reconfigured=state.update({effects:compartment.reconfigure(EditorState.readOnly.of(true))}).state
  assert.equal(state.facet(EditorState.readOnly),false)
  assert.equal(reconfigured.facet(EditorState.readOnly),true)
})
