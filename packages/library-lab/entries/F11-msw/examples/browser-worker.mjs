// Contract for PLATFORM's separately hosted iframe runner.
// Do NOT mount this in the main Library Lab SPA: its Service Worker must be scope-limited.
import {setupWorker} from 'msw/browser'
import {handlers} from './handlers.mjs'

const SCOPE = '/lab-runners/msw/'
export async function startIsolatedWorker() {
  if (!globalThis.isSecureContext && location.hostname !== 'localhost') {
    throw new Error('Browser MSW requires HTTPS or localhost')
  }
  if (!location.pathname.startsWith(SCOPE)) {
    throw new Error('MSW runner must be served from a dedicated scoped path')
  }
  const worker = setupWorker(...handlers)
  await worker.start({
    onUnhandledFrame: 'error',
    serviceWorker: {
      url: `${SCOPE}mockServiceWorker.js`,
      options: {scope: SCOPE},
    },
    quiet: true,
  })
  return async () => {
    // MSW v3 returns a Promise; callers must await teardown.
    await worker.stop()
  }
}
