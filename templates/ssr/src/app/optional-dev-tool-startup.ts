// Optional browser tooling must not leave an unhandled rejection in the Next.js
// development overlay. A failed start may be retried on a later mount.
export function createOptionalDevToolStartup(
  startup: () => Promise<unknown>,
  failureMessage: string,
): () => Promise<void> {
  let startPromise: Promise<void> | undefined
  return () => {
    if (!startPromise) {
      startPromise = Promise.resolve()
        .then(startup)
        .then(
          () => undefined,
          () => {
            startPromise = undefined
            console.warn(failureMessage)
          },
        )
    }
    return startPromise
  }
}
