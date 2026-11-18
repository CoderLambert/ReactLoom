export type EnterContext = {
  key: string
  composing: boolean
  nativeComposing: boolean
  legacyKeyCode: number
  suppressNextEnter: boolean
}
export function shouldApplyFilterOnKeyDown(event: EnterContext): boolean {
  return (
    event.key === 'Enter' &&
    !event.composing &&
    !event.nativeComposing &&
    event.legacyKeyCode !== 229 &&
    !event.suppressNextEnter
  )
}

export type ImeKeyContext = Pick<EnterContext, 'key' | 'nativeComposing' | 'legacyKeyCode'>

/** Synchronous event ownership with a bounded trailing-confirmation window. */
export function createImeGuard() {
  let composing = false
  let suppressUntil = 0
  return {
    compositionStart() {
      composing = true
      suppressUntil = 0
    },
    compositionEnd(now = Date.now()) {
      composing = false
      suppressUntil = now + 80
    },
    shouldApply(event: ImeKeyContext, now = Date.now()) {
      // A normal subsequent character is a new input action, not a trailing confirmation.
      if (
        !composing &&
        !event.nativeComposing &&
        event.legacyKeyCode !== 229 &&
        event.key !== 'Enter'
      ) {
        suppressUntil = 0
      }
      return shouldApplyFilterOnKeyDown({
        ...event,
        composing,
        suppressNextEnter: now < suppressUntil,
      })
    },
    keyUp(event: Pick<ImeKeyContext, 'key' | 'nativeComposing'>) {
      if (
        !composing &&
        !event.nativeComposing &&
        (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar')
      ) {
        suppressUntil = 0
      }
    },
    blur() {
      if (!composing) suppressUntil = 0
    },
    reset() {
      composing = false
      suppressUntil = 0
    },
  }
}
