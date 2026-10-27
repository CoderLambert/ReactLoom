// Only for PLATFORM's isolated iframe runner, never the Library Lab SPA.
// MSW v3 needs an actual scoped Service Worker, not a Node .invalid endpoint.
import {setupWorker} from 'msw/browser'
import {createHandlers} from './handlers.mjs'
import {scenarioEndpoints, BROWSER_RUNNER_SCOPE} from './routes.mjs'
import {findExactScopeRegistration, assertWorkerRegistration} from './registration-policy.mjs'

let activeSession = false

export function browserScenarioEndpoints() {
  return scenarioEndpoints(new URL(BROWSER_RUNNER_SCOPE, location.origin).href)
}

export async function startIsolatedWorker() {
  if (activeSession) throw new Error('This iframe already owns an MSW scenario session')
  if (!globalThis.isSecureContext && !['localhost', '127.0.0.1'].includes(location.hostname)) {
    throw new Error('Browser MSW requires HTTPS or local loopback')
  }
  if (!navigator.serviceWorker?.getRegistrations) throw new Error('Service Worker is not available')
  if (window.top === window.self || !location.pathname.startsWith(BROWSER_RUNNER_SCOPE)) {
    throw new Error('MSW must start inside the dedicated scoped iframe')
  }

  const scopeURL = new URL(BROWSER_RUNNER_SCOPE, location.origin)
  const scriptURL = new URL('mockServiceWorker.js', scopeURL)
  const existing = findExactScopeRegistration(
    await navigator.serviceWorker.getRegistrations(), scopeURL.href)
  if (existing) assertWorkerRegistration(existing, scopeURL.href, scriptURL.href)

  const endpoints = browserScenarioEndpoints()
  const worker = setupWorker(...createHandlers(endpoints))
  activeSession = true
  let stopped = false
  async function stop() {
    if (stopped) return
    stopped = true
    let stopError
    try {
      await worker.stop()
    } catch (error) {
      stopError = error
    }
    try {
      // Never unregister a pre-existing registration belonging to another client.
      if (!existing) {
        const current = findExactScopeRegistration(
          await navigator.serviceWorker.getRegistrations(), scopeURL.href)
        if (current) {
          assertWorkerRegistration(current, scopeURL.href, scriptURL.href)
          await current.unregister()
        }
      }
    } finally {
      activeSession = false
    }
    if (stopError) throw stopError
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
  } catch (error) {
    try {
      await stop()
    } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], 'MSW start and cleanup both failed')
    }
    throw error
  }
  return stop
}
