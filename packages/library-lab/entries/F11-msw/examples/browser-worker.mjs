// Only for PLATFORM's isolated iframe runner, never the Library Lab SPA.
// The browser must fetch runner-local URLs; Node's .invalid origin is not browser-safe.
import {setupWorker} from 'msw/browser'
import {createHandlers} from './handlers.mjs'
import {scenarioEndpoints, BROWSER_RUNNER_SCOPE} from './routes.mjs'

export function browserScenarioEndpoints() {
  return scenarioEndpoints(new URL(BROWSER_RUNNER_SCOPE, location.origin).href)
}
export async function startIsolatedWorker() {
  if (!globalThis.isSecureContext && !['localhost', '127.0.0.1'].includes(location.hostname)) {
    throw new Error('Browser MSW requires HTTPS or local loopback')
  }
  if (!navigator.serviceWorker) throw new Error('Service Worker is not available')
  if (window.top === window.self || !location.pathname.startsWith(BROWSER_RUNNER_SCOPE)) {
    throw new Error('MSW must start inside the dedicated scoped iframe')
  }

  const scopeURL = new URL(BROWSER_RUNNER_SCOPE, location.origin)
  const scriptURL = new URL('mockServiceWorker.js', scopeURL)
  const worker = setupWorker(...createHandlers(browserScenarioEndpoints()))
  try {
    await worker.start({
      onUnhandledFrame: 'error',
      serviceWorker: {
        url: scriptURL.pathname,
        options: {scope: scopeURL.pathname},
      },
      quiet: true,
    })
    // Registration success is not proof the Worker intercepted a request.
    // Check the exact scope/script before allowing the runner to claim readiness.
    const registration = await navigator.serviceWorker.getRegistration(scopeURL.href)
    const candidates = [
      registration?.active?.scriptURL,
      registration?.waiting?.scriptURL,
      registration?.installing?.scriptURL,
    ]
    if (registration?.scope !== scopeURL.href || !candidates.includes(scriptURL.href)) {
      throw new Error('MSW registration is outside the isolated runner scope')
    }
  } catch (error) {
    await worker.stop().catch(() => {})
    throw error
  }
  return async () => {
    // stop() stops MSW interception but does not unregister a Service Worker.
    await worker.stop()
  }
}
