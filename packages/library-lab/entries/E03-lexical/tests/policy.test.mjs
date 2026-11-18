import assert from 'node:assert/strict'
import test from 'node:test'
import { assertLexicalSnapshot, MAX_SNAPSHOT } from '../examples/snapshot-policy.mjs'

const text = (value) => ({
  type: 'text',
  text: value,
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  version: 1,
})
const root = (children) => JSON.stringify({ root: { type: 'root', version: 1, children } })
test('valid paragraph plus text serialized snapshot survives exact', () => {
  const raw = root([
    { type: 'paragraph', version: 1, children: [text('你好'), { type: 'linebreak', version: 1 }] },
  ])
  assert.equal(assertLexicalSnapshot(raw), raw)
})
test('rejects empty root before setEditorState', () => {
  for (const raw of ['{', '{}', root([]), 'x'.repeat(MAX_SNAPSHOT + 1)])
    assert.throws(() => assertLexicalSnapshot(raw))
})
test('unknown nodes and nested bombs are rejected', () => {
  assert.throws(() => assertLexicalSnapshot(root([{ type: 'html', children: [] }])))
  assert.throws(() =>
    assertLexicalSnapshot(
      root([
        {
          type: 'paragraph',
          children: [{ type: 'text', text: 'x', style: 'background:url(https://evil.test/)' }],
        },
      ]),
    ),
  )
  assert.throws(() =>
    assertLexicalSnapshot(
      root(Array.from({ length: 401 }, () => ({ type: 'paragraph', children: [] }))),
    ),
  )
})

test('field types and nonempty CSS are rejected instead of being coerced by SDK', () => {
  for (const node of [
    { ...text('x'), format: 'bold' },
    { ...text('x'), mode: 'anything' },
    { ...text('x'), detail: -1 },
    { ...text('x'), style: 'color:red' },
    { ...text('x'), unknown: 1 },
    { type: 'tab', version: 1, text: 'not tab' },
  ])
    assert.throws(() =>
      assertLexicalSnapshot(root([{ type: 'paragraph', version: 1, children: [node] }])),
    )
  assert.throws(() =>
    assertLexicalSnapshot(
      JSON.stringify({
        root: {
          type: 'root',
          version: 1,
          children: [{ type: 'paragraph', version: 1, children: [], textStyle: 'url(x)' }],
        },
        selection: {},
      }),
    ),
  )
})
