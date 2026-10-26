// Run from packages/library-lab: node entries/F11-msw/examples/node-runner.mjs business
// Requires the actual msw@3 package. No external traffic should leave this process.
import assert from 'node:assert/strict'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {http, HttpResponse} from 'msw/http'
import {setupServer} from 'msw/node'
import {handlers, endpoints} from './handlers.mjs'

export async function runScenario(level = 'basic') {
  if (!['basic', 'business', 'advanced'].includes(level)) throw new Error('Unknown MSW scenario')
  const server = setupServer(...handlers)
  server.listen({onUnhandledFrame: 'error'})
  try {
    if (level === 'basic') {
      const response = await fetch(endpoints.article)
      assert.equal(response.status, 200)
      const body = await response.json()
      assert.deepEqual(body, {id: '42', title: 'ReactLoom engineering note'})
      return {level, status: response.status, body}
    }
    if (level === 'business') {
      const send = (code) => fetch(endpoints.verify, {
        method: 'POST', headers: {'content-type': 'application/json'},
        body: JSON.stringify({code}),
      })
      const accepted = await send('123456')
      assert.equal(accepted.status, 200)
      assert.deepEqual(await accepted.json(), {verified: true})
      const rejected = await send('000000')
      assert.equal(rejected.status, 422)
      const error = await rejected.json()
      assert.equal(error.error.code, 'INVALID_CODE')
      return {level, accepted: 200, rejected: 422, error}
    }
    let attempts = 0
    server.use(http.get(endpoints.retry, () => {
      attempts++
      if (attempts === 1) return HttpResponse.json({error: 'temporary outage'}, {status: 503})
      return HttpResponse.json({ok: true}, {status: 200})
    }))
    const first = await fetch(endpoints.retry)
    const second = await fetch(endpoints.retry)
    assert.equal(first.status, 503)
    assert.equal(second.status, 200)
    assert.deepEqual(await second.json(), {ok: true})
    assert.equal(attempts, 2)
    server.resetHandlers()
    return {level, first: 503, second: 200, attempts}
  } finally {
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
