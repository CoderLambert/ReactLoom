export const FEED_HEADERS: readonly ['title', 'url', 'note']
export type Feed = { title: string; url: string; note: string }
export function validateHeaders(
  fields: string[] | undefined,
  renamedHeaders?: Record<string, string>,
): void
export function normalizeFeed(raw: unknown, seen: Set<string>): Feed

export const CSV_BYTE_LIMIT: 256000
export function readLocalCSV(blob: Blob): Promise<string>
