import assert from 'node:assert/strict'
import { test } from 'node:test'
import { startOptionalDevMocks } from '../src/lib/dev-mocks.ts'

test('awaits successful mock setup before continuing boot', async () => {
  let finish = () => {}
  const pending = new Promise((resolve) => {
    finish = resolve
  })
  let settled = false
  const startup = startOptionalDevMocks(() => pending).then(() => {
    settled = true
  })
  await Promise.resolve()
  assert.equal(settled, false)
  finish()
  await startup
  assert.equal(settled, true)
})

test('worker startup failure does not abort boot or expose the exception', async (t) => {
  const warn = t.mock.method(console, 'warn', () => {})
  await assert.doesNotReject(
    startOptionalDevMocks(async () => {
      throw new Error('private auth token or internal worker URL')
    }),
  )
  assert.equal(warn.mock.callCount(), 1)
  assert.equal(
    warn.mock.calls[0].arguments[0],
    'Development request mocks could not start; continuing without mocks.',
  )
})

test('synchronous worker loader failure is also non-fatal', async (t) => {
  const warn = t.mock.method(console, 'warn', () => {})
  await assert.doesNotReject(
    startOptionalDevMocks(() => {
      throw new Error('dynamic import failed')
    }),
  )
  assert.equal(warn.mock.callCount(), 1)
})
