// Business code under test: no Vitest import here so it can be reused by a real project.
export function normalizeFeedURL(input: string): string {
  const url = new URL(input)
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Requires credential-free HTTPS')
  url.hash = ''
  return url.href
}
function requireActive(signal: AbortSignal): void {
  if (signal.aborted) throw new DOMException('cancelled', 'AbortError')
}
export type RequestOutcome = {kind: 'ok'; message: string} | {kind: 'invalid'; code: string} | {kind: 'retry'; after: number}
export async function verifyCode(
  request: (signal: AbortSignal) => Promise<Response>,
  signal: AbortSignal,
): Promise<RequestOutcome> {
  requireActive(signal)
  const response = await request(signal)
  requireActive(signal)
  if (response.status === 422) {
    const data: unknown = await response.json()
    requireActive(signal)
    if (typeof data === 'object' && data && 'code' in data && typeof data.code === 'string') {
      return {kind: 'invalid', code: data.code}
    }
    return {kind:'invalid',code:'UNKNOWN'}
  }
  if (response.status === 503) return {kind:'retry',after:3}
  if (!response.ok) throw new Error('Unexpected status: '+response.status)
  const data: unknown = await response.json()
  requireActive(signal)
  if (!data || typeof data !== 'object' || !('message' in data) || typeof data.message !== 'string') throw new Error('Invalid JSON shape')
  return {kind:'ok',message:data.message}
}
export function createLatestRequest<T>(load: (signal: AbortSignal) => Promise<T>) {
  let generation = 0
  let current: AbortController | null = null
  return {
    async run(): Promise<T | null> {
      current?.abort()
      const token = ++generation
      const controller = new AbortController()
      current = controller
      try {
        const result = await load(controller.signal)
        return token === generation && !controller.signal.aborted ? result : null
      } catch (error) {
        if (token !== generation || controller.signal.aborted) return null
        throw error
      } finally {
        if (current === controller) current = null
      }
    },
    cancel(): void {generation++;current?.abort();current=null},
  }
}
