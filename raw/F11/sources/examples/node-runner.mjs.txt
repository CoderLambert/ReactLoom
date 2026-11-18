// Run from packages/library-lab: node entries/F11-msw/examples/node-runner.mjs business
// Real MSW intercepts real fetch. The fixture origin must never reach the network.
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HttpResponse, http } from 'msw/http'
import { setupServer } from 'msw/node'
import { endpoints, handlers } from './handlers.mjs'

export async function runScenario(level = 'basic') {
  if (!['basic', 'business', 'advanced'].includes(level)) throw new Error('Unknown MSW scenario')
  const server = setupServer(...handlers)
  const requests = []
  const matches = []
  server.events.on('request:match', ({ requestId, request }) => {
    matches.push({ requestId, method: request.method, url: request.url })
  })

  async function request(url, options) {
    const response = await fetch(url, options)
    const body = await response.json()
    const item = { method: options?.method ?? 'GET', url, status: response.status, body }
    requests.push(item)
    return item
  }

  function observed(result) {
    assert.deepEqual(
      matches.map(({ method, url }) => ({ method, url })),
      requests.map(({ method, url }) => ({ method, url })),
    )
    return { ...result, requests, matches }
  }

  try {
    server.listen({ onUnhandledFrame: 'error' })
    if (level === 'basic') {
      const response = await request(endpoints.article)
      assert.equal(response.status, 200)
      assert.deepEqual(response.body, { id: '42', title: 'ReactLoom engineering note' })
      return observed({ level, status: response.status, body: response.body })
    }
    if (level === 'business') {
      const send = (code) =>
        request(endpoints.verify, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ code }),
        })
      const rejected = await send('000000')
      assert.equal(rejected.status, 422)
      assert.equal(rejected.body.error.code, 'INVALID_CODE')
      const accepted = await send('123456')
      assert.equal(accepted.status, 200)
      assert.deepEqual(accepted.body, { verified: true })
      return observed({
        level,
        accepted: accepted.status,
        rejected: rejected.status,
        error: rejected.body,
      })
    }
    server.use(
      http.get(
        endpoints.retry,
        () => HttpResponse.json({ error: 'temporary outage' }, { status: 503 }),
        { once: true },
      ),
    )
    const first = await request(endpoints.retry)
    const second = await request(endpoints.retry)
    assert.equal(first.status, 503)
    assert.equal(second.status, 200)
    assert.deepEqual(second.body, { ok: true })
    return observed({
      level,
      first: first.status,
      second: second.status,
      attempts: requests.length,
    })
  } finally {
    server.resetHandlers()
    server.close()
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    console.log(JSON.stringify(await runScenario(process.argv[2] ?? 'basic'), null, 2))
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  }
}
