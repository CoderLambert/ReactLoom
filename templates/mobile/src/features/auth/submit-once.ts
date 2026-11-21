// Concurrent async form validation may invoke multiple submit handlers before
// React updates the button's disabled state. Claim the operation synchronously.
export async function submitOnce(
  pending: { current: boolean },
  operation: () => Promise<void>,
): Promise<boolean> {
  if (pending.current) return false
  pending.current = true
  try {
    await operation()
    return true
  } finally {
    pending.current = false
  }
}
