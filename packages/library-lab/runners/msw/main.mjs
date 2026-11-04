import { setupWorker } from 'msw/browser'
import { HttpResponse, http } from 'msw/http'
import { createHandlers } from '../../entries/F11-msw/examples/handlers.mjs'
import { scenarioEndpoints } from '../../entries/F11-msw/examples/routes.mjs'
import {
  APP_ORIGIN,
  FRAME_PROTOCOL,
  RUNNER_ORIGIN,
  SESSION_ID,
} from '../../src/lib/frame-session.mjs'

const match = location.pathname.match(/^\/lab-runners\/msw\/sessions\/([^/]+)\/$/u)
if (
  window.parent !== window &&
  location.origin === RUNNER_ORIGIN &&
  match &&
  SESSION_ID.test(match[1])
) {
  const session = match[1],
    scope = new URL('./', location.href).href,
    script = new URL('mockServiceWorker.js', scope).href
  const endpoints = scenarioEndpoints(scope),
    abort = new AbortController()
  let worker,
    operation = Promise.resolve(),
    started = false,
    stopping = false,
    cleanup
  const post = (type, data = {}) =>
    window.parent.postMessage({ protocol: FRAME_PROTOCOL, session, type, ...data }, APP_ORIGIN)
  const assert = (condition, message) => {
    if (!condition) throw new Error(message)
  }
  async function request(method, url, body) {
    const response = await fetch(url, {
      method,
      signal: abort.signal,
      cache: 'no-store',
      credentials: 'omit',
      ...(body
        ? { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
        : {}),
    })
    const value = await response.json()
    return { method, url, status: response.status, body: JSON.stringify(value).slice(0, 2048) }
  }
  async function run(level) {
    worker = setupWorker(...createHandlers(endpoints))
    await worker.start({
      quiet: true,
      onUnhandledFrame: 'error',
      serviceWorker: { url: script, options: { scope } },
    })
    if (stopping) return
    const registration = await navigator.serviceWorker.getRegistration(scope)
    assert(registration?.scope === scope, 'Worker scope mismatch')
    const requests = []
    if (level === 'basic') {
      const item = await request('GET', endpoints.article)
      assert(
        item.status === 200 && JSON.parse(item.body).id === '42',
        'Article was not intercepted by MSW',
      )
      requests.push(item)
    } else if (level === 'business') {
      requests.push(
        await request('POST', endpoints.verify, { code: 'wrong' }),
        await request('POST', endpoints.verify, { code: '123456' }),
      )
      assert(
        requests[0].status === 422 &&
          requests[1].status === 200 &&
          JSON.parse(requests[1].body).verified === true,
        'Verification scenario mismatch',
      )
    } else {
      worker.use(
        http.get(
          endpoints.retry,
          () => HttpResponse.json({ error: 'temporary' }, { status: 503 }),
          { once: true },
        ),
      )
      requests.push(await request('GET', endpoints.retry), await request('GET', endpoints.retry))
      assert(requests[0].status === 503 && requests[1].status === 200, 'Recovery scenario mismatch')
    }
    if (!stopping) post('result', { requests })
  }
  function stop() {
    if (cleanup) return cleanup
    stopping = true
    abort.abort()
    cleanup = operation
      .catch(() => {})
      .then(async () => {
        await worker?.stop()
        const registration = await navigator.serviceWorker.getRegistration(scope)
        if (registration?.scope === scope) {
          for (const sw of [
            registration.active,
            registration.waiting,
            registration.installing,
          ].filter(Boolean))
            assert(sw.scriptURL === script, 'Refusing to remove a foreign worker')
          assert(await registration.unregister(), 'Worker could not be unregistered')
        }
        post('stopped', { cleanup: true })
      })
      .catch((error) => post('error', { message: String(error) }))
    return cleanup
  }
  window.addEventListener('message', (event) => {
    const message = event.data
    if (
      event.source !== window.parent ||
      event.origin !== APP_ORIGIN ||
      message?.protocol !== FRAME_PROTOCOL ||
      message.session !== session
    )
      return
    if (message.type === 'stop') {
      void stop()
      return
    }
    if (
      message.type === 'start' &&
      !started &&
      !stopping &&
      ['basic', 'business', 'advanced'].includes(message.level)
    ) {
      started = true
      operation = run(message.level).catch((error) => {
        if (!stopping) post('error', { message: String(error) })
      })
    }
  })
  window.addEventListener(
    'pagehide',
    () => {
      void stop()
    },
    { once: true },
  )
  post('ready')
}
