import assert from 'node:assert/strict'
import test from 'node:test'
import { getDefaultConfig, twJoin, twMerge } from 'tailwind-merge'
import {
  calculateMerge,
  cn,
  DEFAULT_BASE,
  DEFAULT_CALLER,
  paddingConflicts,
} from '../examples/merge-model.mjs'

const input = {
  base: DEFAULT_BASE,
  caller: DEFAULT_CALLER,
  selected: false,
  size: 'compact',
  custom: false,
}

test('actual shared component composition gives caller classes the last merge position', () => {
  const initial = calculateMerge(input)
  assert.equal(initial.joined, 'rounded-lg border px-3 py-2 bg-slate-100 pr-8')
  assert.equal(initial.merged, initial.joined)
  const result = calculateMerge({
    ...input,
    selected: true,
    size: 'comfortable',
    caller: 'px-1 bg-blue-100',
  })
  assert.equal(result.inputs.variants, 'bg-green-100 px-7 py-5')
  assert.equal(result.merged, 'rounded-lg border py-5 px-1 bg-blue-100')
  assert.equal(cn('p-2', { 'p-4': true, 'p-8': false }), 'p-4')
  assert.equal(twJoin('p-2', false, ['p-3']), 'p-2 p-3')
})

test('actual group configuration and asymmetric padding conflicts agree in both directions', () => {
  const config = getDefaultConfig()
  assert.deepEqual(paddingConflicts.px, config.conflictingClassGroups.px)
  assert.ok(paddingConflicts.px.includes('pr'))
  assert.ok(!paddingConflicts.pr.includes('px'))
  assert.equal(twMerge('pr-4', 'px-3'), 'px-3')
  assert.equal(twMerge('px-3', 'pr-4'), 'px-3 pr-4')
  assert.equal(twMerge('px-2', 'px-6'), 'px-6')
})

test('actual modifier contexts and important flags keep separate conflict channels', () => {
  assert.equal(twMerge('md:p-2', 'md:p-6', 'p-4'), 'md:p-6 p-4')
  assert.equal(
    twMerge('bg-slate-100 hover:bg-red-500', 'hover:bg-green-500'),
    'bg-slate-100 hover:bg-green-500',
  )
  assert.equal(twMerge('hover:focus:p-2', 'focus:hover:p-4'), 'focus:hover:p-4')
  assert.equal(twMerge('p-2!', 'p-4!'), 'p-4!')
  assert.equal(twMerge('p-2', 'p-4!'), 'p-2 p-4!')
})

test('actual custom px extension recognizes source-owned horizontal utilities without inventing CSS', () => {
  const base = { ...input, base: 'c21-pad-compact', caller: 'c21-pad-roomy' }
  assert.equal(calculateMerge(base).merged, 'c21-pad-compact c21-pad-roomy')
  const extended = calculateMerge({ ...base, custom: true })
  assert.equal(extended.defaultMerged, 'c21-pad-compact c21-pad-roomy')
  assert.equal(extended.merged, 'c21-pad-roomy')
  assert.equal(calculateMerge({ ...base, caller: 'px-6', custom: true }).merged, 'px-6')
})

test('default SDK preserves unknown classes but can recognize non-default theme names by validators', () => {
  assert.equal(twMerge('my-widget', 'my-widget'), 'my-widget my-widget')
  assert.equal(twMerge('c21-pad-compact', 'c21-pad-roomy'), 'c21-pad-compact c21-pad-roomy')
  assert.equal(twMerge('bg-brand', 'bg-accent'), 'bg-accent')
})
