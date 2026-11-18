/** Pure guards for cmdk's keyboard path; no global listeners or browser state. */
export type PaletteKey = {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  isComposing?: boolean
  keyCode?: number
  defaultPrevented?: boolean
  repeat?: boolean
}

export function ownsPaletteShortcut(
  event: PaletteKey,
  editableTarget: boolean,
  alreadyOpen: boolean,
): boolean {
  return (
    !event.defaultPrevented &&
    event.key.toLowerCase() === 'k' &&
    Boolean(event.ctrlKey || event.metaKey) &&
    !event.shiftKey &&
    !event.altKey &&
    !event.isComposing &&
    event.keyCode !== 229 &&
    (alreadyOpen || !editableTarget)
  )
}

export function shouldTogglePalette(
  event: PaletteKey,
  editableTarget: boolean,
  alreadyOpen: boolean,
): boolean {
  return !event.repeat && ownsPaletteShortcut(event, editableTarget, alreadyOpen)
}

/** A short trailing window protects commit Enter even when a browser ends composition first. */
export function createImeGuard(now: () => number = () => performance.now()) {
  let composing = false
  let pendingUntil = 0
  return {
    start() {
      composing = true
      pendingUntil = Number.POSITIVE_INFINITY
    },
    end() {
      composing = false
      pendingUntil = now() + 80
    },
    isComposing() {
      return composing
    },
    suppress(event: Pick<PaletteKey, 'key' | 'isComposing' | 'keyCode'>) {
      if (event.key !== 'Enter' && !composing) pendingUntil = 0
      return shouldSuppressCommandEnter(event, composing, now() < pendingUntil)
    },
    release(key: string) {
      if (key === 'Enter' || key === ' ') pendingUntil = 0
    },
    clear() {
      composing = false
      pendingUntil = 0
    },
  }
}

export function shouldSuppressCommandEnter(
  event: Pick<PaletteKey, 'key' | 'isComposing' | 'keyCode'>,
  composing: boolean,
  pendingCompositionCommit: boolean,
): boolean {
  return (
    event.key === 'Enter' &&
    (composing || pendingCompositionCommit || Boolean(event.isComposing) || event.keyCode === 229)
  )
}
