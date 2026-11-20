// MSW is an optional development aid. A failed worker download, registration,
// or startup must not prevent React from mounting.
export async function startOptionalDevMocks(start: () => Promise<unknown>): Promise<void> {
  try {
    await start()
  } catch {
    // Do not print the worker error, which may contain request or URL details.
    console.warn('Development request mocks could not start; continuing without mocks.')
  }
}
