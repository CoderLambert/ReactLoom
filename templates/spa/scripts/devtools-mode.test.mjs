import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveDevtoolsMode } from './devtools-mode.ts'

test('honors a Vite env-file opt-out for both inspector and Lighthouse', () => {
  // Vite loadEnv() resolves .env.local to false even if process.env lacks the key.
  assert.deepEqual(resolveDevtoolsMode('serve', 'false'), {
    clickToSource: false,
    lighthouse: false,
  })
})

test('preserves development defaults and explicit enablement', () => {
  for (const value of ['true', undefined]) {
    assert.deepEqual(resolveDevtoolsMode('serve', value), {
      clickToSource: true,
      lighthouse: true,
    })
  }
})

test('never registers development-only integrations for a production build', () => {
  for (const value of ['true', 'false', undefined]) {
    assert.deepEqual(resolveDevtoolsMode('build', value), {
      clickToSource: false,
      lighthouse: false,
    })
  }
})
