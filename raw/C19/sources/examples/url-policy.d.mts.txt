export type Feed = { id: string; name: string; group: 'tech' | 'business' }
export declare const PAGE_SIZE: number
export declare const MAX_QUERY_LENGTH: number
export declare function sanitizeQuery(input: unknown): string
export declare function deriveSearchView(
  state: { level: 'basic' | 'business' | 'advanced'; query: string; group: string; page: number },
  feeds: Feed[],
): {
  safeQuery: string
  safeGroup: string
  matches: Feed[]
  pageCount: number
  safePage: number
  pageItems: Feed[]
}

export type CompositionGuard = { composing: boolean; enterHeld: boolean }
export function createCompositionGuard(): CompositionGuard
export function beginComposition(guard: CompositionGuard): void
export function endComposition(guard: CompositionGuard): void
export function recordKey(
  guard: CompositionGuard,
  event: { key: string; isComposing: boolean; keyCode: number },
): void
export function releaseKey(guard: CompositionGuard, key: string): void
export function suppressSubmit(guard: CompositionGuard): boolean
