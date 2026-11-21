import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createOptionalDevToolStartup } from './optional-dev-tool-startup.ts'

test('a rejected optional startup is handled, warns without exposing the error, and can retry', async () => {
  const warning = '[ReactLoom] Optional dev tool could not start.'
  const originalWarn = console.warn
  const warnings = []
  console.warn = (value) => warnings.push(value)
  let calls = 0
  const start = createOptionalDevToolStartup(async () => {
    calls += 1
    if (calls === 1) throw new Error('sensitive internal details')
  }, warning)
  try {
    await assert.doesNotReject(start())
    assert.deepEqual(warnings, [warning])
    await assert.doesNotReject(start())
    assert.equal(calls, 2)
    assert.deepEqual(warnings, [warning])
    await start()
    assert.equal(calls, 2)
  } finally {
    console.warn = originalWarn
  }
})

test('concurrent calls share startup and successful startup is not repeated', async () => {
  let calls = 0
  let finish
  const start = createOptionalDevToolStartup(
    () => {
      calls += 1
      return new Promise((resolve) => {
        finish = resolve
      })
    },
    'no startup warning expected',
  )
  const first = start()
  const second = start()
  assert.equal(first, second)
  await Promise.resolve()
  assert.equal(calls, 1)
  finish()
  await first
  await start()
  assert.equal(calls, 1)
})

test('a synchronous throw is handled without leaving a cached rejection', async () => {
  let calls = 0
  const originalWarn = console.warn
  const warnings = []
  console.warn = (value) => warnings.push(value)
  const start = createOptionalDevToolStartup(() => {
    calls += 1
    if (calls === 1) throw new Error('sync failure')
    return Promise.resolve()
  }, 'Generic dev-tool startup warning')
  try {
    await assert.doesNotReject(start())
    await assert.doesNotReject(start())
    assert.equal(calls, 2)
    assert.deepEqual(warnings, ['Generic dev-tool startup warning'])
  } finally {
    console.warn = originalWarn
  }
})
