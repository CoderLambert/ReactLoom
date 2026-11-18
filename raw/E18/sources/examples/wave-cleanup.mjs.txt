// Ownership policy, not a substitute for actual SDK/native media teardown evidence.
export function releaseWave(instance, unsubscribers, revoke) {
  const errors = []
  for (const unsubscribe of unsubscribers) {
    try {
      unsubscribe()
    } catch (error) {
      errors.push(String(error))
    }
  }
  try {
    instance.destroy()
  } catch (error) {
    errors.push(String(error))
  } finally {
    revoke()
  }
  return errors
}
