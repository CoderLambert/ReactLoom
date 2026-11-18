export type Source = { id: string; title: string; url: string }
export function validateSources(value: unknown): Source[]
export function createFixtureTransport(): {
  fetch: typeof globalThis.fetch
  attempts: Map<string, number>
  resetTransient(): void
}
