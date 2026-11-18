import type { Source } from './grid-contract'

// This is application ownership, not an SDK concurrency guarantee.
export type EditSession = { id: string; revision: number }
export function captureEdit(data: Source | undefined): EditSession | null {
  return data ? { id: data.id, revision: data.revision } : null
}
export function expectedRevision(session: EditSession | null, id: string): number | null {
  return session?.id === id ? session.revision : null
}
