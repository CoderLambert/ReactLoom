// Cancels pending timer and suppresses stale settlements; cannot abort an already started tokenizer.
export function scheduleHighlight(run, apply, fail, delay = 160) {
  let live = true
  const timer = setTimeout(() => {
    Promise.resolve()
      .then(run)
      .then((result) => {
        if (live) apply(result)
      })
      .catch((error) => {
        if (live) fail(error)
      })
  }, delay)
  return () => {
    live = false
    clearTimeout(timer)
  }
}
