export interface ScanState {
  enabled: boolean
  toolbar: boolean
  error: string | null
}

export interface ScanController {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => ScanState
  configure: (enabled: boolean, toolbar: boolean) => void
}

// Shared by the app entry and the panel. Panel unmounts do not stop scanning.
export function createScanController(
  apply: (enabled: boolean, toolbar: boolean) => void,
): ScanController {
  let state: ScanState = { enabled: false, toolbar: false, error: null }
  const listeners = new Set<() => void>()
  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot: () => state,
    configure(enabled, toolbar) {
      try {
        apply(enabled, toolbar)
        state = { enabled, toolbar, error: null }
      } catch (cause) {
        state = { ...state, error: cause instanceof Error ? cause.message : 'Scan failed.' }
      }
      for (const listener of listeners) listener()
    },
  }
}
