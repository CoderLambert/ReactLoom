import assert from 'node:assert/strict'
import test from 'node:test'
import {
  beginComposition,
  blockEnter,
  createCompositionGuard,
  endComposition,
  releaseEnter,
} from '../examples/ime-guard.ts'
import {
  countTree,
  findLocation,
  initialTree,
  renameTree,
  stripTree,
} from '../examples/tree-model.ts'

test('fixture reset is independent and preserves the selected level capacity', () => {
  const basic = initialTree(false)
  const advanced = initialTree(true)
  assert.equal(countTree(basic), 7)
  assert.equal(countTree(advanced), 1807)
  assert.equal(findLocation(advanced, 'bulk-1799').index, 1801)
  advanced[0].children.pop()
  assert.equal(countTree(initialTree(true)), 1807)
})
test('business rename keeps identity and deleting a group removes its subtree', () => {
  const source = initialTree(false)
  const renamed = renameTree(source, 'feed-react', '  新订阅  ')
  assert.equal(renamed[0].children[0].name, '新订阅')
  assert.equal(renamed[0].children[0].id, 'feed-react')
  assert.equal(source[0].children[0].name, 'React 官方博客')
  assert.equal(renameTree(source, 'feed-react', '   ')[0].children[0].name, '未命名')
  assert.equal(countTree(stripTree(source, new Set(['grp-tech']))), 4)
})
test('IME confirming Enter is held until keyup but the next ordinary Enter submits', () => {
  const guard = createCompositionGuard()
  beginComposition(guard)
  assert.equal(blockEnter(guard, { key: 'Enter', isComposing: true, keyCode: 229 }), true)
  endComposition(guard)
  assert.equal(blockEnter(guard, { key: 'Enter', isComposing: false, keyCode: 13 }), true)
  releaseEnter(guard, 'Enter')
  assert.equal(blockEnter(guard, { key: 'Enter', isComposing: false, keyCode: 13 }), false)
})
test('Space or mouse composition confirmation does not consume an unrelated Enter', () => {
  for (const key of [' ', null]) {
    const guard = createCompositionGuard()
    beginComposition(guard)
    if (key) blockEnter(guard, { key, isComposing: true, keyCode: 32 })
    endComposition(guard)
    assert.equal(blockEnter(guard, { key: 'Enter', isComposing: false, keyCode: 13 }), false)
  }
})
test('native composing/229 protects Enter even before React composition state catches up', () => {
  for (const event of [
    { isComposing: true, keyCode: 13 },
    { isComposing: false, keyCode: 229 },
  ]) {
    assert.equal(blockEnter(createCompositionGuard(), { key: 'Enter', ...event }), true)
  }
})
