// MSW is an optional development aid. A failed or indefinitely stalled worker
// must not prevent React from mounting. Late startup is stopped so it cannot
// silently begin intercepting requests after the app chose to run without mocks.
const DEFAULT_MOCK_START_TIMEOUT_MS = 10_000

type DevMockOptions = {
  timeoutMs?: number
  stop?: () => void
}

export async function startOptionalDevMocks(
  start: () => Promise<unknown>,
  options: DevMockOptions = {},
): Promise<void> {
  let timeout: ReturnType<typeof setTimeout> | undefined
  let expired = false
  // Wrap the loader so a synchronous dynamic-import error follows the same path.
  const startup = Promise.resolve().then(start)
  // The start promise may settle after the timeout. Its eventual resolution must
  // not enable an unexpected service worker, and a late rejection is observed.
  void startup.then(
    () => {
      if (!expired) return
      try {
        options.stop?.()
      } catch {
        // Development mock cleanup must not create an unhandled rejection.
      }
    },
    () => {},
  )

  try {
    await Promise.race([
      startup,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => {
          expired = true
          reject(new Error('Development mock startup timed out'))
        }, options.timeoutMs ?? DEFAULT_MOCK_START_TIMEOUT_MS)
      }),
    ])
  } catch {
    // Do not print worker errors, which may contain request or URL details.
    console.warn('Development request mocks could not start; continuing without mocks.')
  } finally {
    clearTimeout(timeout)
  }
}
