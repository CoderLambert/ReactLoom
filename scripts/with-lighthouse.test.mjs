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

test('accepts the first successful 2xx response', async () => {
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

test('does not report readiness for a wrong service returning 404', async () => {
  await withServer((_req, res) => {
    res.writeHead(404)
    res.end('not found')
  }, async (url) => {
    await assert.rejects(
      waitForUrl(url, { timeoutMs: 100, retryDelayMs: 5 }),
      /Timed out waiting for/,
    )
  })
})

test('waits through temporary 401, 302 and 429 responses before healthy 200', async () => {
  const statuses = [401, 302, 429, 200]
  let hits = 0
  await withServer((_req, res) => {
    res.writeHead(statuses[Math.min(hits, statuses.length - 1)])
    hits += 1
    res.end()
  }, async (url) => {
    await waitForUrl(url, { timeoutMs: 1_000, retryDelayMs: 5 })
  })
  assert.equal(hits, statuses.length)
})


test('releases streaming 503 responses before retrying a preview readiness probe', async () => {
  const sockets = new Set()
  let hits = 0
  let peakConnections = 0
  const server = createServer((_request, response) => {
    hits += 1
    if (hits <= 6) {
      // Send the status and body prefix but deliberately never end the stream.
      response.writeHead(503, { 'content-type': 'text/plain' })
      response.write('still starting')
    } else {
      response.writeHead(204)
      response.end()
    }
  })
  server.on('connection', (socket) => {
    sockets.add(socket)
    peakConnections = Math.max(peakConnections, sockets.size)
    socket.on('close', () => sockets.delete(socket))
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  try {
    await waitForUrl(`http://127.0.0.1:${address.port}/`, {
      timeoutMs: 2_000,
      retryDelayMs: 15,
    })
    assert.equal(hits, 7)
    assert.ok(
      peakConnections <= 3,
      `readiness polling leaked ${peakConnections} simultaneous HTTP connections`,
    )
  } finally {
    server.closeAllConnections()
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  }
})


test('accepts a healthy response even if its body cancellation never settles', async () => {
  const originalFetch = globalThis.fetch
  let cancelCalls = 0
  globalThis.fetch = async () => ({
    ok: true,
    body: {
      cancel: () => {
        cancelCalls += 1
        return new Promise(() => {})
      },
    },
  })
  let guard
  try {
    await Promise.race([
      waitForUrl('http://127.0.0.1:4317/', { timeoutMs: 50, retryDelayMs: 1 }),
      new Promise((_, reject) => {
        guard = setTimeout(() => reject(new Error('2xx cleanup blocked readiness')), 500)
      }),
    ])
    assert.equal(cancelCalls, 1)
  } finally {
    clearTimeout(guard)
    globalThis.fetch = originalFetch
  }
})

test('enforces the startup deadline when an unhealthy body cancel never settles', async () => {
  const originalFetch = globalThis.fetch
  let probes = 0
  globalThis.fetch = async () => {
    probes += 1
    return { ok: false, body: { cancel: () => new Promise(() => {}) } }
  }
  let guard
  try {
    await assert.rejects(
      Promise.race([
        waitForUrl('http://127.0.0.1:4317/', { timeoutMs: 60, retryDelayMs: 1 }),
        new Promise((_, reject) => {
          guard = setTimeout(() => reject(new Error('non-2xx cleanup exceeded deadline')), 500)
        }),
      ]),
      /Timed out waiting for/,
    )
    assert.equal(probes, 1)
  } finally {
    clearTimeout(guard)
    globalThis.fetch = originalFetch
  }
})

test('fails cleanly when a preview command cannot spawn, without starting Lighthouse polling', async () => {
  const { spawnSync } = await import('node:child_process')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const { fileURLToPath } = await import('node:url')
  const script = fileURLToPath(new URL('./with-lighthouse.mjs', import.meta.url))
  const absent = join(tmpdir(), `reactloom-missing-preview-${process.pid}-${Date.now()}`)
  const result = spawnSync(process.execPath, [script, 'dev', '--', absent], {
    encoding: 'utf8',
    timeout: 2_000,
    env: {
      ...process.env,
      LIGHTHOUSE_LOCAL: 'true',
      LIGHTHOUSE_URL: 'http://127.0.0.1:1/',
    },
  })

  assert.equal(result.error, undefined, String(result.error))
  assert.equal(result.status, 1, result.stderr)
  assert.match(result.stderr, /Failed to start preview command:/)
  assert.doesNotMatch(result.stderr, /Unhandled 'error' event/)
  assert.doesNotMatch(result.stderr, /Timed out waiting for/)
})

test('preserves a normally spawned preview command exit status', async () => {
  const { spawnSync } = await import('node:child_process')
  const { fileURLToPath } = await import('node:url')
  const script = fileURLToPath(new URL('./with-lighthouse.mjs', import.meta.url))
  const result = spawnSync(process.execPath, [script, 'preview', '--', process.execPath, '-e', 'process.exit(17)'], {
    encoding: 'utf8',
    timeout: 2_000,
    env: { ...process.env, LIGHTHOUSE_LOCAL: 'false' },
  })

  assert.equal(result.error, undefined, String(result.error))
  assert.equal(result.status, 17, result.stderr)
})
