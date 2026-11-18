export type CompositionGuard = { composing: boolean; confirmationEnterHeld: boolean }
export const createCompositionGuard = (): CompositionGuard => ({
  composing: false,
  confirmationEnterHeld: false,
})
export function beginComposition(guard: CompositionGuard) {
  guard.composing = true
  guard.confirmationEnterHeld = false
}
export function endComposition(guard: CompositionGuard) {
  guard.composing = false
}
export function blockEnter(
  guard: CompositionGuard,
  event: { key: string; isComposing: boolean; keyCode: number },
): boolean {
  if (event.key !== 'Enter') {
    guard.confirmationEnterHeld = false
    return false
  }
  if (guard.composing || event.isComposing || event.keyCode === 229) {
    guard.confirmationEnterHeld = true
    return true
  }
  return guard.confirmationEnterHeld
}
export function releaseEnter(guard: CompositionGuard, key: string) {
  if (key === 'Enter') guard.confirmationEnterHeld = false
}
