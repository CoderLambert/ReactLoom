import assert from 'node:assert/strict'
import test from 'node:test'
import { createLocalColorSchemeManager } from '../examples/local-color-scheme.ts'

test('each public color scheme manager owns its in-memory value', () => {
  const first = createLocalColorSchemeManager()
  const second = createLocalColorSchemeManager()
  first.set('dark')
  assert.equal(first.get('light'), 'dark')
  assert.equal(second.get('dark'), 'light')
  first.clear()
  assert.equal(first.get('dark'), 'light')
})
