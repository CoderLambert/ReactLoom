// React's pending state updates after an event. Claim the action synchronously
// so two clicks in the same event turn cannot issue competing PATCH requests.
export function createSingleFlightAction() {
  let active = false
  return async (action: () => Promise<unknown>): Promise<boolean> => {
    if (active) return false
    active = true
    try {
      await action()
      return true
    } finally {
      active = false
    }
  }
}
