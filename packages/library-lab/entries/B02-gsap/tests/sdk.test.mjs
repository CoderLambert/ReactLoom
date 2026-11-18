import assert from 'node:assert/strict'
import test from 'node:test'
import { gsap } from 'gsap'
import { createCardSequence, createCardTween } from '../examples/motion.ts'

// Real GSAP numerical targets, using the same builders as the DOM Demo.
// No fake Element/style/RAF. DOM CSSPlugin output and actual clock belong to browser checks.
test('real paused fromTo maps linear time and context.revert restores original object properties', () => {
  assert.equal(gsap.version, '3.15.0')
  const model = { x: 7, opacity: 0.9 }
  let animation
  const context = gsap.context(() => {
    animation = createCardTween(model, 'none', () => {})
  })
  try {
    assert.ok(animation)
    assert.equal(animation.paused(), true)
    assert.equal(animation.duration(), 1.2)
    animation.progress(0.5, true)
    assert.equal(model.x, 30)
    assert.ok(Math.abs(model.opacity - 0.675) < 1e-6)
    animation.progress(1, true)
    assert.equal(model.x, 60)
    assert.equal(model.opacity, 1)
  } finally {
    context.revert()
  }
  assert.equal(model.x, 7)
  assert.equal(model.opacity, 0.9)
  assert.equal(gsap.getTweensOf(model).length, 0)
})

test('real power2.out maps 50 percent time to 52.5 of the 60px distance', () => {
  const model = { x: 0, opacity: 1 }
  const animation = createCardTween(model, 'power2.out', () => {})
  try {
    animation.progress(0.5, true)
    assert.equal(animation.progress(), 0.5)
    assert.equal(model.x, 52.5)
  } finally {
    animation.revert()
  }
})

test('real timeline has shared labels, overlapping children, reversible direction and scoped cleanup', () => {
  const cards = Array.from({ length: 4 }, () => ({ y: 0, opacity: 1 }))
  const detail = { y: 0, opacity: 1 }
  let timeline
  const context = gsap.context(() => {
    timeline = createCardSequence(cards, detail, () => {})
  })
  try {
    assert.ok(timeline)
    assert.equal(timeline.labels.cards, 0)
    assert.equal(timeline.labels.detail, 0.7)
    assert.equal(timeline.duration(), 1.1)
    const children = timeline.getChildren(false, true, true)
    assert.deepEqual(
      children.map((child) => child.startTime()),
      [0, 0.7],
    )
    assert.equal(children[0].totalDuration(), 1.02)
    timeline.seek('detail', true)
    assert.equal(timeline.time(), 0.7)
    assert.equal(cards[0].y, 0)
    assert.ok(cards[3].y > 0 && cards[3].y < 24)
    timeline.progress(1, true)
    assert.ok([...cards, detail].every((item) => item.y === 0 && item.opacity === 1))
    timeline.reversed(true).resume().pause()
    assert.equal(timeline.reversed(), true, 'resume does not erase reverse direction')
  } finally {
    context.revert()
  }
  assert.ok([...cards, detail].every((item) => item.y === 0 && item.opacity === 1))
  assert.equal(gsap.getTweensOf([...cards, detail]).length, 0)
})
