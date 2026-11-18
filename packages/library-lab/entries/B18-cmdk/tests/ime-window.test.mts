import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createImeGuard,
  ownsPaletteShortcut,
  shouldTogglePalette,
} from '../examples/keyboard-policy.ts'

test('composition remains protected across unrelated keys while active', () => {
  const guard = createImeGuard(() => 1000)
  guard.start()
  assert.equal(guard.suppress({ key: 'ArrowDown' }), false)
  assert.equal(guard.suppress({ key: 'Enter' }), true)
})
test('trailing commit expires after 80ms even if no Enter keyup was delivered', () => {
  let time = 0
  const guard = createImeGuard(() => time)
  guard.end()
  time = 79
  assert.equal(guard.suppress({ key: 'Enter' }), true)
  time = 80
  assert.equal(guard.suppress({ key: 'Enter' }), false)
})
test('Enter release ends the pending commit guard', () => {
  const guard = createImeGuard(() => 0)
  guard.end()
  assert.equal(guard.suppress({ key: 'Enter' }), true)
  guard.release('Enter')
  assert.equal(guard.suppress({ key: 'Enter' }), false)
})
test('Space release also ends a completed candidate selection', () => {
  const guard = createImeGuard(() => 0)
  guard.end()
  guard.release(' ')
  assert.equal(guard.suppress({ key: 'Enter' }), false)
})
test('ordinary typing and blur do not leave a latched guard', () => {
  const guard = createImeGuard(() => 0)
  guard.end()
  guard.suppress({ key: 'a' })
  assert.equal(guard.suppress({ key: 'Enter' }), false)
  guard.start()
  guard.clear()
  assert.equal(guard.isComposing(), false)
  assert.equal(guard.suppress({ key: 'Enter' }), false)
})
test('a shortcut already handled by another owner is left alone', () => {
  assert.equal(
    shouldTogglePalette({ key: 'k', ctrlKey: true, defaultPrevented: true }, false, false),
    false,
  )
  assert.equal(ownsPaletteShortcut({ key: 'k', ctrlKey: true, repeat: true }, false, false), true)
  assert.equal(shouldTogglePalette({ key: 'k', ctrlKey: true, repeat: true }, false, false), false)
})
