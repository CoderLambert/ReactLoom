import assert from 'node:assert/strict'
import test from 'node:test'
import clsx from 'clsx'
import { clsx as lite } from 'clsx/lite'
import { cardClassInputs } from '../examples/class-policy.mjs'
import { comparisonPresets } from '../examples/comparison-presets.mjs'

test('real clsx merges approved card parts and ignores unapproved server tone', () => {
  assert.equal(
    clsx(...cardClassInputs({ selected: true, tone: 'success' })),
    'demo-card is-selected tone-success',
  )
  assert.equal(
    clsx(...cardClassInputs({ selected: true, disabled: true, tone: 'warning' })),
    'demo-card is-selected is-disabled tone-warning',
  )
  assert.equal(
    clsx(...cardClassInputs({ disabled: true, tone: 'hidden fixed' })),
    'demo-card is-disabled',
  )
  assert.equal(clsx(...cardClassInputs({ selected: false, tone: 'neutral' })), 'demo-card')
})

test('page presets compare real full and lite with exactly the same inputs', () => {
  const expected = {
    strings: ['card is-selected', 'card is-selected'],
    object: ['card is-selected', 'card'],
    array: ['card is-selected tone-success', 'card'],
    number: ['card 1', 'card'],
    utilities: ['px-2 px-4 px-4', 'px-2 px-4 px-4'],
  }

  assert.deepEqual(
    Object.fromEntries(
      comparisonPresets.map(({ id, inputs }) => [id, [clsx(...inputs), lite(...inputs)]]),
    ),
    expected,
  )
})
