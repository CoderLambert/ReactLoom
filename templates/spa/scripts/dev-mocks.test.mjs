import assert from 'node:assert/strict'
import { test, mock } from 'node:test'
import { startOptionalDevMocks } from '../src/lib/dev-mocks.ts'

test('awaits successful mock setup before continuing boot', async () => {
  let finish
  const pending = new Promise((resolve) => { finish = resolve })
  let settled = false
  const startup = startOptionalDevMocks(() => pending).then(() => { settled = true })
  await Promise.resolve()
  assert.equal(settled, false)
  finish()
  await startup
  assert.equal(settled, true)
})

test('worker start rejection cannot abort React boot or leak exception details', async () => {
  const sensitive = 'private auth token or internal worker URL'
  const warnings = []
  const originalWarn = console.warn
  console.warn = (...args) => warnings.push(args.join(' '))
  try {
    await assert.doesNotReject(startOptionalDevMocks(async () => {
      throw new Error(sensitive)
    }))
  } finally {
    console.warn = originalWarn
  }
  assert.equal(warnings.length, 1)
  assert.match(warnings[0], /continuing without mocks/)
  assert.doesNotMatch(warnings[0], /private auth token|internal worker URL/)
})

test('synchronous failure loading the optional worker is also non-fatal', async () => {
  const warn = mock.method(console, 'warn', () => {})
  try {
    await assert.doesNotReject(startOptionalDevMocks(() => {
      throw new Error('dynamic import failed')
    }))
    assert.equal(warn.mock.callCount(), 1)
  } finally {
    warn.mock.restore()
  }
})
