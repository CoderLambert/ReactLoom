/** A pure task owner: serialized execution, latest queued intent and deferred cleanup.
 * This does not abort a running SDK operation; the caller must check owns after awaits. */
export function createAsyncOwner(cleanup: () => void | Promise<void>) {
  let revision = 0
  let disposed = false
  let tail: Promise<void> = Promise.resolve()
  let disposal: Promise<void> | null = null
  return {
    run(task: (owns: () => boolean) => Promise<void>) {
      if (disposed) return { owns: () => false, finished: Promise.resolve() }
      const ticket = ++revision
      const owns = () => !disposed && ticket === revision
      const finished = tail.then(async () => {
        if (owns()) await task(owns)
      })
      // Keep the queue live after a failed operation; the returned job still rejects.
      tail = finished.then(
        () => undefined,
        () => undefined,
      )
      return { owns, finished }
    },
    dispose() {
      if (disposal) return disposal
      disposed = true
      revision++
      disposal = tail.then(cleanup)
      return disposal
    },
  }
}
