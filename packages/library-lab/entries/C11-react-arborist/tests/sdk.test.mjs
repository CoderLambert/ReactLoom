import assert from 'node:assert/strict'
import test from 'node:test'
import { adjustMoveIndex } from 'react-arborist'
import { moveTree } from '../examples/move-tree.ts'
import { countTree, initialTree, locate } from '../examples/tree-model.ts'

test('real react-arborist helper corrects pre-removal target slots', () => {
  const siblings = ['a', 'b', 'c', 'd']
  assert.equal(adjustMoveIndex({ index: 3, dragIds: ['b'], siblingIds: siblings }), 2)
  assert.equal(adjustMoveIndex({ index: 1, dragIds: ['b'], siblingIds: siblings }), 1)
})
test('real helper keeps target index for cross-parent moves', () => {
  assert.equal(
    adjustMoveIndex({ index: 2, dragIds: ['other-parent'], siblingIds: ['a', 'b', 'c'] }),
    2,
  )
})
test('page moveTree uses the real helper for one-slot downward reorder', () => {
  const source = initialTree(false)
  const before = structuredClone(source)
  const moved = moveTree(source, ['feed-react'], 'grp-tech', 2)
  assert.deepEqual(
    locate(moved, 'grp-tech').map((item) => item.id),
    ['feed-vite', 'feed-react'],
  )
  assert.deepEqual(source, before)
  assert.equal(countTree(moved), 7)
})
test('page SDK integration moves a subtree exactly once when parent and child are selected', () => {
  const source = initialTree(false)
  const moved = moveTree(source, ['grp-tech', 'feed-react'], 'grp-business', 1)
  const target = locate(moved, 'grp-business')
  assert.deepEqual(
    target.map((item) => item.id),
    ['feed-product', 'grp-tech'],
  )
  assert.strictEqual(target[1], source[0])
  assert.equal(countTree(moved), 7)
  assert.deepEqual(
    target[1].children.map((item) => item.id),
    ['feed-react', 'feed-vite'],
  )
})
test('page SDK integration rejects insertion into a removed descendant atomically', () => {
  const source = initialTree(false)
  assert.strictEqual(moveTree(source, ['grp-tech'], 'feed-react', 0), source)
  assert.strictEqual(moveTree(source, ['feed-react'], 'missing-group', 0), source)
})
