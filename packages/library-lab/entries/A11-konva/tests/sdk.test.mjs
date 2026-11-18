import assert from 'node:assert/strict'
import test from 'node:test'
import Konva from 'konva'

test('real scene graph preserves node identity, world geometry and the parent transform', () => {
  const group = new Konva.Group({ x: 20, y: 10, scaleX: 2, scaleY: 2 })
  const rect = new Konva.Rect({ id: 'card', width: 100, height: 50 })
  try {
    group.add(rect)
    assert.equal(group.findOne('#card'), rect)
    assert.deepEqual(rect.getClientRect(), { x: 20, y: 10, width: 200, height: 100 })
    assert.equal(rect.width(), 100)
    const transform = group.getAbsoluteTransform()
    const screen = transform.point({ x: 15, y: 7 })
    assert.deepEqual(screen, { x: 50, y: 24 })
    assert.deepEqual(transform.copy().invert().point(screen), { x: 15, y: 7 })
  } finally {
    group.destroy()
  }
  assert.equal(group.getChildren().length, 0)
  assert.equal(rect.getParent(), null)
})

test('real named events and detached child destruction do not leak handlers into remaining nodes', () => {
  const group = new Konva.Group()
  const rect = new Konva.Rect({ id: 'card', width: 100, height: 50 })
  let fired = 0
  try {
    group.add(rect)
    rect.on('click.a11', () => fired++)
    rect.fire('click')
    assert.equal(fired, 1)
    rect.off('.a11')
    rect.fire('click')
    assert.equal(fired, 1)
    rect.destroy()
    assert.equal(group.findOne('#card'), undefined)
    assert.equal(group.getChildren().length, 0)
  } finally {
    group.destroy()
  }
})
