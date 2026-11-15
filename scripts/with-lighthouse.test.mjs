import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { test } from 'node:test'
import { waitForUrl } from './with-lighthouse.mjs'

async function withServer(handler, task) {
  const server = createServer(handler)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  try {
    await task(`http://127.0.0.1:${address.port}/`)
  } finally {
    server.closeAllConnections()
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  }
}

test('accepts the first non-5xx response', async () => {
  await withServer((_req, res) => {
    res.writeHead(204)
    res.end()
  }, async (url) => {
    await waitForUrl(url, { timeoutMs: 500, retryDelayMs: 1 })
  })
})

test('retries 503 until the preview responds', async () => {
  let hits = 0
  await withServer((_req, res) => {
    hits += 1
    res.writeHead(hits === 1 ? 503 : 200)
    res.end()
  }, async (url) => {
    await waitForUrl(url, { timeoutMs: 1_000, retryDelayMs: 1 })
  })
  assert.equal(hits, 2)
})

test('times out when server accepts connection but never sends response headers', async () => {
  await withServer(() => {
    // Deliberately leave the response pending until the probe aborts.
  }, async (url) => {
    const began = Date.now()
    await assert.rejects(
      waitForUrl(url, { timeoutMs: 100, retryDelayMs: 1 }),
      /Timed out waiting for/,
    )
    const elapsed = Date.now() - began
    assert.ok(elapsed >= 60, `unexpectedly early timeout: ${elapsed}ms`)
    assert.ok(elapsed < 2_000, `unbounded HTTP probe: ${elapsed}ms`)
  })
})

test('times out while the server repeatedly returns 503', async () => {
  await withServer((_req, res) => {
    res.writeHead(503)
    res.end()
  }, async (url) => {
    await assert.rejects(
      waitForUrl(url, { timeoutMs: 100, retryDelayMs: 5 }),
      /Timed out waiting for/,
    )
  })
})

test('running the wrapper with no command still returns the usage error', async () => {
  const { execFileSync } = await import('node:child_process')
  const { fileURLToPath } = await import('node:url')
  const script = fileURLToPath(new URL('./with-lighthouse.mjs', import.meta.url))
  assert.throws(
    () => execFileSync(process.execPath, [script], { encoding: 'utf8', stdio: 'pipe' }),
    (error) => error.status === 1 && /usage: node scripts\/with-lighthouse/.test(error.stderr),
  )
})
