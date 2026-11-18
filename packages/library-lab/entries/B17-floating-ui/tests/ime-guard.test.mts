import assert from 'node:assert/strict'
import test from 'node:test'
import { createImeGuard, shouldApplyFilterOnKeyDown } from '../examples/ime-guard.ts'

const base = {
  key: 'Enter',
  composing: false,
  nativeComposing: false,
  legacyKeyCode: 13,
  suppressNextEnter: false,
}
test('plain Enter commits', () => assert.equal(shouldApplyFilterOnKeyDown(base), true))
test('candidate selection during composition never commits', () => {
  assert.equal(shouldApplyFilterOnKeyDown({ ...base, composing: true }), false)
  assert.equal(shouldApplyFilterOnKeyDown({ ...base, nativeComposing: true }), false)
  assert.equal(shouldApplyFilterOnKeyDown({ ...base, legacyKeyCode: 229 }), false)
})
test('compositionend before trailing Enter keydown is guarded', () => {
  assert.equal(shouldApplyFilterOnKeyDown({ ...base, suppressNextEnter: true }), false)
  assert.equal(shouldApplyFilterOnKeyDown({ ...base, suppressNextEnter: false }), true)
})
test('other keyboard keys do not submit', () =>
  assert.equal(shouldApplyFilterOnKeyDown({ ...base, key: 'Escape' }), false))

const enter = { key: 'Enter', nativeComposing: false, legacyKeyCode: 13 }
test('real Enter confirmation keeps trailing keydown guarded and releases on keyup', () => {
  const guard = createImeGuard()
  guard.compositionStart()
  assert.equal(
    guard.shouldApply({ ...enter, nativeComposing: true, legacyKeyCode: 229 }, 100),
    false,
  )
  guard.compositionEnd(100)
  assert.equal(guard.shouldApply(enter, 101), false)
  guard.keyUp(enter)
  assert.equal(guard.shouldApply(enter, 110), true)
})
test('Space confirmation needs no Enter keyup before a subsequent ordinary Enter', () => {
  const guard = createImeGuard()
  guard.compositionStart()
  guard.compositionEnd(100)
  guard.keyUp({ key: ' ', nativeComposing: false })
  assert.equal(guard.shouldApply(enter, 110), true)
})
test('mouse confirmation cannot suppress an ordinary Enter beyond the finite window', () => {
  const guard = createImeGuard()
  guard.compositionStart()
  guard.compositionEnd(100)
  assert.equal(guard.shouldApply(enter, 120), false)
  assert.equal(guard.shouldApply(enter, 181), true)
  assert.equal(guard.shouldApply({ ...enter, legacyKeyCode: 229 }, 181), false)
})
test('new non-composing character after candidate confirmation clears stale suppression', () => {
  const guard = createImeGuard()
  guard.compositionStart()
  guard.compositionEnd(100)
  assert.equal(
    guard.shouldApply({ key: 'x', nativeComposing: false, legacyKeyCode: 88 }, 110),
    false,
  )
  assert.equal(guard.shouldApply(enter, 111), true)
})
