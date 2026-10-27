// For PLATFORM's dedicated scoped iframe only, never the Library Lab SPA.
// stop() disables mocking for THIS client; global unregister would break other tabs.
import {setupWorker} from 'msw/browser'
import {createHandlers} from './handlers.mjs'
import {scenarioEndpoints, BROWSER_RUNNER_SCOPE} from './routes.mjs'
import {findExactScopeRegistration, assertWorkerRegistration} from './registration-policy.mjs'
import {createExclusiveSessionGate} from './session-gate.mjs'

const sessionGate = createExclusiveSessionGate()

export function browserScenarioEndpoints() {
  return scenarioEndpoints(new URL(BROWSER_RUNNER_SCOPE, location.origin).href)
}

export async function startIsolatedWorker() {
  // Acquire before ANY await: two rapid start calls must not register twice.
  const release = sessionGate.acquire()
  let worker
  let scopeURL
  let scriptURL
  let endpoints
  try {
    if (!globalThis.isSecureContext && !['localhost', '127.0.0.1'].includes(location.hostname)) {
      throw new Error('Browser MSW requires HTTPS or local loopback')
    }
    if (!navigator.serviceWorker?.getRegistrations) throw new Error('Service Worker is not available')
    if (window.top === window.self || !location.pathname.startsWith(BROWSER_RUNNER_SCOPE)) {
      throw new Error('MSW must start inside the dedicated scoped iframe')
    }
    scopeURL = new URL(BROWSER_RUNNER_SCOPE, location.origin)
    scriptURL = new URL('mockServiceWorker.js', scopeURL)
    const existing = findExactScopeRegistration(
      await navigator.serviceWorker.getRegistrations(), scopeURL.href)
    if (existing) assertWorkerRegistration(existing, scopeURL.href, scriptURL.href)
    endpoints = browserScenarioEndpoints()
    worker = setupWorker(...createHandlers(endpoints))
  } catch (error) {
    release()
    throw error
  }

  // Concurrent stop() calls join the same operation. A rejected stop leaves
  // the lease held so a new worker cannot race a potentially active old one.
  let stopTask = null
  const stop = () => {
    if (!stopTask) {
      stopTask = Promise.resolve()
        .then(() => worker.stop())
        .then(() => { release() })
        .catch(error => { stopTask = null; throw error })
    }
    return stopTask
  }

  try {
    await worker.start({
      onUnhandledFrame: 'error',
      serviceWorker: {
        url: scriptURL.pathname,
        options: {scope: scopeURL.pathname},
      },
      quiet: true,
    })
    const registration = findExactScopeRegistration(
      await navigator.serviceWorker.getRegistrations(), scopeURL.href)
    assertWorkerRegistration(registration, scopeURL.href, scriptURL.href)
    if (navigator.serviceWorker.controller?.scriptURL !== scriptURL.href) {
      throw new Error('MSW worker does not control the isolated iframe')
    }
    const response = await fetch(endpoints.article, {cache: 'no-store'})
    const article = await response.json().catch(() => null)
    if (response.status !== 200 || article?.id !== '42' ||
        article?.title !== 'ReactLoom engineering note') {
      throw new Error('MSW did not intercept the scoped article request')
    }
    return stop
  } catch (error) {
    try {
      await stop()
    } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], 'MSW start and cleanup both failed')
    }
    throw error
  }
}
