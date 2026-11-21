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

test('a worker startup that never resolves cannot block app boot', async (t) => {
  const warn = t.mock.method(console, 'warn', () => {})
  let stopped = 0
  const result = startOptionalDevMocks(() => new Promise(() => {}), {
    timeoutMs: 15,
    stop: () => {
      stopped += 1
    },
  })
  await result
  assert.equal(warn.mock.callCount(), 1)
  assert.equal(stopped, 0)
})

test('stops worker that starts after fallback to prevent late interception', async (t) => {
  const warn = t.mock.method(console, 'warn', () => {})
  let finish = () => {}
  let stopped = 0
  const pending = new Promise((resolve) => {
    finish = resolve
  })
  await startOptionalDevMocks(() => pending, {
    timeoutMs: 15,
    stop: () => {
      stopped += 1
    },
  })
  assert.equal(warn.mock.callCount(), 1)
  assert.equal(stopped, 0)
  finish()
  await pending
  await Promise.resolve()
  assert.equal(stopped, 1)
})

test('handles late worker rejection without unhandled rejection or retry', async (t) => {
  const warn = t.mock.method(console, 'warn', () => {})
  let fail = () => {}
  const pending = new Promise((_resolve, reject) => {
    fail = reject
  })
  await startOptionalDevMocks(() => pending, { timeoutMs: 15 })
  fail(new Error('secret URL after startup deadline'))
  await Promise.resolve()
  assert.equal(warn.mock.callCount(), 1)
})

test('fast worker startup preserves the normal wait and never stops it', async (t) => {
  const warn = t.mock.method(console, 'warn', () => {})
  let stopped = 0
  await startOptionalDevMocks(async () => {}, {
    timeoutMs: 15,
    stop: () => {
      stopped += 1
    },
  })
  assert.equal(stopped, 0)
  assert.equal(warn.mock.callCount(), 0)
})
