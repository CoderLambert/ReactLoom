import assert from 'node:assert/strict'
import test from 'node:test'
import Konva from 'konva'
import { createElement } from 'react'
import { Group, KonvaRenderer, Rect } from 'react-konva'

function createScene(t) {
  // The real renderer can reconcile a detached Group without creating browser Canvas.
  // This is a local SDK harness, not an alternate application Stage implementation.
  const root = new Konva.Group()
  const errors = []
  const onError = (error) => errors.push(error)
  const fiber = KonvaRenderer.createContainer(
    root,
    1,
    null,
    false,
    null,
    'a12-test-',
    onError,
    onError,
    onError,
    null,
  )
  const render = (element) => {
    KonvaRenderer.updateContainerSync(element, fiber, null, null)
    KonvaRenderer.flushSyncWork()
    assert.deepEqual(errors, [])
  }
  t.after(() => {
    render(null)
    root.destroy()
  })
  return { root, render }
}

test('real react-konva reconciliation preserves stable nodes and updates actual Konva props', (t) => {
  const { root, render } = createScene(t)
  const content = (x, fill) =>
    createElement(
      Group,
      { id: 'collect', x, y: 58 },
      createElement(Rect, { width: 132, height: 52, fill }),
    )
  render(content(28, '#cfe7d7'))
  const group = root.findOne('#collect')
  const rect = group.getChildren()[0]
  assert.ok(group instanceof Konva.Group)
  assert.ok(rect instanceof Konva.Rect)
  assert.equal(group.x(), 28)
  render(content(40, '#e0e9fc'))
  assert.equal(root.findOne('#collect'), group)
  assert.equal(group.getChildren()[0], rect)
  assert.equal(group.x(), 40)
  assert.equal(rect.fill(), '#e0e9fc')
  assert.equal(rect.width(), 132)
})

test('real renderer replaces event props and removes its owned handlers on unmount', (t) => {
  const { root, render } = createScene(t)
  let previous = 0
  let current = 0
  render(createElement(Group, { id: 'collect', onClick: () => previous++ }))
  const group = root.findOne('#collect')
  group.fire('click')
  assert.equal(previous, 1)
  render(createElement(Group, { id: 'collect', onClick: () => current++ }))
  group.fire('click')
  assert.deepEqual([previous, current], [1, 1])
  render(null)
  assert.equal(root.getChildren().length, 0)
  assert.equal(group.getParent(), null)
  group.fire('click')
  assert.deepEqual([previous, current], [1, 1])
})
