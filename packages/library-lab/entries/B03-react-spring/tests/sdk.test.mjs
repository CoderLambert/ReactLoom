import assert from 'node:assert/strict'
import test from 'node:test'
import { SpringValue } from '@react-spring/web'

test('real SpringValue advances physical tension/friction to a numeric goal', {
  timeout: 3000,
}, async () => {
  const value = new SpringValue(0)
  try {
    const result = value.start({ to: 18, config: { tension: 240, friction: 28 } })
    // Drive the real public SpringValue integrator; this is not a browser/animated DOM test.
    value.advance(16)
    assert.ok(value.get() > 0 && value.get() < 18)
    for (let frame = 0; frame < 500 && value.isAnimating; frame++) value.advance(16)
    const completed = await result
    assert.equal(completed.finished, true)
    assert.equal(completed.cancelled, false)
    assert.equal(value.get(), 18)
    assert.equal(value.isAnimating, false)
  } finally {
    value.stop(true)
  }
})

test('real immediate and cancellation return distinct terminal results', {
  timeout: 3000,
}, async () => {
  const value = new SpringValue(0)
  try {
    const immediate = value.start({ to: 0.45, immediate: true })
    value.advance(16)
    const completed = await immediate
    assert.equal(value.get(), 0.45)
    assert.equal(completed.finished, true)
    const cancelled = value.start({ to: 1, immediate: false })
    value.stop(true)
    assert.equal((await cancelled).cancelled, true)
    assert.equal(value.isAnimating, false)
  } finally {
    value.stop(true)
  }
})
