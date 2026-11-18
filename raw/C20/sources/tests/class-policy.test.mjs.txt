import assert from 'node:assert/strict'
import test from 'node:test'
import { cardClassInputs } from '../examples/class-policy.mjs'

test('state class inputs are finite and never interpolate untrusted tone', () => {
  assert.deepEqual(cardClassInputs({ selected: true, disabled: false, tone: 'success' }), [
    'demo-card',
    { 'is-selected': true, 'is-disabled': false },
    'tone-success',
  ])
  assert.equal(cardClassInputs({ tone: 'fixed z-50 hidden' })[2], null)
  assert.deepEqual(cardClassInputs({ selected: 'yes', disabled: 1 })[1], {
    'is-selected': false,
    'is-disabled': false,
  })
})
