// App Router Route Handlers use Web Request bodies rather than the Pages
// Router's bodyParser.sizeLimit. Bound JSON mutations even without Content-Length.
export const MAX_MUTATION_JSON_BYTES = 64 * 1024
// A small payload must not keep an unauthenticated Route Handler occupied forever
// when a client starts streaming and then stops sending bytes.
export const MAX_MUTATION_JSON_DURATION_MS = 10_000

type MutationJsonResult =
  | { ok: true; data: unknown }
  | { ok: false; tooLarge: boolean; timedOut?: boolean }

export async function readMutationJson(
  request: Request,
  maxDurationMs = MAX_MUTATION_JSON_DURATION_MS,
): Promise<MutationJsonResult> {
  const length = request.headers.get('content-length')
  if (length !== null) {
    if (!/^\d+$/.test(length)) return { ok: false, tooLarge: false }
    if (Number(length) > MAX_MUTATION_JSON_BYTES) return { ok: false, tooLarge: true }
  }

  if (!request.body) return { ok: false, tooLarge: false }
  const reader = request.body.getReader()
  const decoder = new TextDecoder('utf-8', { fatal: true })
  let bytes = 0
  let text = ''
  let timer: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<true>((resolve) => {
    timer = setTimeout(() => resolve(true), maxDurationMs)
  })
  // A client disconnect must release a pending read without waiting for the
  // full deadline. Do not await stream cancellation: it can remain pending.
  let onAbort: (() => void) | undefined
  const aborted = new Promise<true>((resolve) => {
    onAbort = () => resolve(true)
    request.signal.addEventListener('abort', onAbort, { once: true })
  })
  const interrupted = (): MutationJsonResult => {
    void reader.cancel().catch(() => {})
    return { ok: false, tooLarge: false, timedOut: true }
  }
  try {
    if (request.signal.aborted) return interrupted()
    while (true) {
      const chunk = await Promise.race([aborted, reader.read(), deadline])
      if (chunk === true || request.signal.aborted) return interrupted()
      if (chunk.done) break
      bytes += chunk.value.byteLength
      if (bytes > MAX_MUTATION_JSON_BYTES) {
        void reader.cancel().catch(() => {})
        return { ok: false, tooLarge: true }
      }
      text += decoder.decode(chunk.value, { stream: true })
    }
    text += decoder.decode()
    if (request.signal.aborted) return interrupted()
    return { ok: true, data: JSON.parse(text) }
  } catch {
    return { ok: false, tooLarge: false }
  } finally {
    clearTimeout(timer)
    if (onAbort) request.signal.removeEventListener('abort', onAbort)
    reader.releaseLock()
  }
}
