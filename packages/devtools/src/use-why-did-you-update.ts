import { useEffect, useRef } from 'react'

export type PropChange = {
  previous: unknown
  next: unknown
}

/** Shallow diff of two props objects. `Object.is` decides whether a key changed. */
export function diffProps(previous: object, next: object): Record<string, PropChange> {
  const before = previous as Record<string, unknown>
  const after = next as Record<string, unknown>
  const changes: Record<string, PropChange> = {}
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (!Object.is(before[key], after[key])) {
      changes[key] = { previous: before[key], next: after[key] }
    }
  }
  return changes
}

/**
 * Logs the props that changed since the previous render.
 * Opt in from the component you are debugging. Do not mount it on the app root.
 * Production builds inline `NODE_ENV` and drop the log. The hook is omitted from
 * the bundle when nothing imports it.
 */
export function useWhyDidYouUpdate(name: string, props: object): void {
  const previous = useRef(props)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      const changes = diffProps(previous.current, props)
      if (Object.keys(changes).length > 0) {
        console.log(`[why-did-you-update] ${name}`, changes)
      }
    }
    previous.current = props
  }, [name, props])
}
