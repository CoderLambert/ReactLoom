// Mutations are not cancelled by TanStack Query's query cancellation.
// Bind each write's AbortSignal to the login that initiated it.
export async function runSessionBoundRequest<T>(
  isCurrentSession: () => boolean,
  subscribe: (listener: () => void) => () => void,
  request: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController()
  const abortWhenStale = () => {
    if (!isCurrentSession()) controller.abort()
  }
  const unsubscribe = subscribe(abortWhenStale)

  try {
    // A login can change between the caller's initial check and subscription.
    abortWhenStale()
    if (controller.signal.aborted) {
      throw new DOMException('The session has changed.', 'AbortError')
    }
    return await request(controller.signal)
  } finally {
    unsubscribe()
  }
}
