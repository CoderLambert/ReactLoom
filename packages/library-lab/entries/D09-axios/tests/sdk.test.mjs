import assert from 'node:assert/strict'
import test from 'node:test'
import axios, { AxiosError, AxiosHeaders } from 'axios'

test('real Axios request/response interceptor chain with isolated adapter', async () => {
  const logs = []
  const client = axios.create({
    baseURL: 'https://lab.invalid',
    adapter: async (config) => {
      assert.equal(config.headers.get('X-Lab'), 'test')
      logs.push(config.url)
      return {
        data: { ok: true },
        status: 200,
        statusText: 'OK',
        headers: new AxiosHeaders(),
        config,
      }
    },
  })
  const req = client.interceptors.request.use((config) => {
    config.headers.set('X-Lab', 'test')
    return config
  })
  const res = client.interceptors.response.use((response) => ({
    ...response,
    data: { ...response.data, intercepted: true },
  }))
  const response = await client.get('/feed')
  assert.deepEqual(response.data, { ok: true, intercepted: true })
  assert.deepEqual(logs, ['/feed'])
  client.interceptors.request.eject(req)
  client.interceptors.response.eject(res)
})
test('actual AxiosError identifies 409 returned by custom adapter', async () => {
  const client = axios.create({
    adapter: async (config) => {
      const response = {
        status: 409,
        statusText: 'Conflict',
        headers: new AxiosHeaders(),
        data: { error: 'version_conflict' },
        config,
      }
      throw new AxiosError('conflict', AxiosError.ERR_BAD_RESPONSE, config, undefined, response)
    },
  })
  await assert.rejects(client.post('https://lab.invalid/follow', { id: 1 }), (error) => {
    assert.equal(axios.isAxiosError(error), true)
    assert.equal(error.response?.status, 409)
    return true
  })
})
test('actual Axios respects a pre-aborted signal', async () => {
  const controller = new AbortController()
  controller.abort()
  const client = axios.create({
    adapter: async (config) => ({
      status: 200,
      statusText: 'OK',
      data: 1,
      config,
      headers: new AxiosHeaders(),
    }),
  })
  await assert.rejects(
    client.get('https://lab.invalid/blocked', { signal: controller.signal }),
    (error) => axios.isCancel(error),
  )
})

test('Axios getUri constructs actual baseURL and query params for adapter routing', async () => {
  const client = axios.create({
    baseURL: 'https://lab.invalid',
    adapter: async (config) => {
      const url = new URL(axios.getUri(config))
      assert.equal(url.origin, 'https://lab.invalid')
      assert.equal(url.pathname, '/feeds')
      assert.equal(url.searchParams.get('tenant'), 'b')
      assert.equal(url.searchParams.get('q'), 'React')
      return { data: [], status: 200, statusText: 'OK', headers: new AxiosHeaders(), config }
    },
  })
  await client.get('/feeds', { params: { tenant: 'b', q: 'React' } })
})

// Import the same implementation mounted by the demo, not a second fixture.
import { boundedGetRetry, makeFixtureClient, validate } from '../examples/fixture-client.ts'

test('displayed client applies interceptor, filters tenants and safely re-installs after cleanup', async () => {
  const trace = []
  const fixture = makeFixtureClient((line) => trace.push(line))
  try {
    fixture.dispose()
    fixture.install()
    fixture.install()
    const response = await fixture.client.get('/feeds', { params: { tenant: 'b' } })
    assert.deepEqual(
      validate(response.data).map((row) => row.id),
      ['b1'],
    )
    assert.match(trace[0], /X-Lab-Request=isolated/)
    assert.equal(trace.filter((line) => line.startsWith('response interceptor')).length, 1)
    await assert.rejects(fixture.client.get('https://example.org/'), /拒绝外部请求/)
  } finally {
    fixture.dispose()
  }
})
test('displayed retry is bounded, resets each incident and never replays POST409', async () => {
  const trace = []
  const fixture = makeFixtureClient((line) => trace.push(line))
  try {
    for (let i = 0; i < 2; i++) {
      fixture.resetTransient()
      const result = await boundedGetRetry(fixture.client, new AbortController().signal)
      assert.equal(result.data.attempt, 2)
    }
    assert.equal(trace.filter((line) => line.includes('→ 503')).length, 2)
    await assert.rejects(
      fixture.client.post('/conflict', { revision: 0 }),
      (error) => axios.isAxiosError(error) && error.response.status === 409,
    )
    assert.equal(trace.filter((line) => line.startsWith('POST /conflict')).length, 1)
    let attempts = 0
    const always503 = axios.create({
      adapter: async (config) => {
        attempts++
        throw new AxiosError('busy', AxiosError.ERR_BAD_RESPONSE, config, undefined, {
          status: 503,
          data: null,
          headers: new AxiosHeaders(),
          config,
        })
      },
    })
    await assert.rejects(boundedGetRetry(always503, new AbortController().signal))
    assert.equal(attempts, 2)
  } finally {
    fixture.dispose()
  }
})
test('displayed adapter abort clears delay and does not emit a completed request', async () => {
  const trace = []
  const fixture = makeFixtureClient((line) => trace.push(line))
  const controller = new AbortController()
  try {
    const request = fixture.client.get('/slow', { signal: controller.signal })
    setTimeout(() => controller.abort(), 10)
    await assert.rejects(request, (error) => axios.isCancel(error))
    assert.deepEqual(trace, [])
    const aborted = new AbortController()
    aborted.abort()
    await assert.rejects(boundedGetRetry(fixture.client, aborted.signal), (error) =>
      axios.isCancel(error),
    )
    assert.deepEqual(trace, [])
  } finally {
    fixture.dispose()
  }
})
