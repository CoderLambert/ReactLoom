import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { resetFixtures } from '@/mocks/handlers'
import { server } from '@/mocks/server'
import '@/lib/i18n'

window.scrollTo = () => undefined

if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  })
}

beforeAll(() => {
  server.listen({
    onUnhandledFrame(frame) {
      if ('request' in frame && frame.request instanceof Request) {
        throw new Error(`Unhandled request: ${frame.request.method} ${frame.request.url}`)
      }
    },
  })
})

afterEach(() => {
  server.resetHandlers()
  resetFixtures()
  sessionStorage.clear()
})

afterAll(() => {
  server.close()
})
