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
  try {
    while (true) {
      const chunk = await Promise.race([reader.read(), deadline])
      if (chunk === true) {
        // Cancellation may itself never settle; neither it nor a silent client
        // may delay the timeout response. Handle a future rejection explicitly.
        void reader.cancel().catch(() => {})
        return { ok: false, tooLarge: false, timedOut: true }
      }
      if (chunk.done) break
      bytes += chunk.value.byteLength
      if (bytes > MAX_MUTATION_JSON_BYTES) {
        void reader.cancel().catch(() => {})
        return { ok: false, tooLarge: true }
      }
      text += decoder.decode(chunk.value, { stream: true })
    }
    text += decoder.decode()
    return { ok: true, data: JSON.parse(text) }
  } catch {
    return { ok: false, tooLarge: false }
  } finally {
    clearTimeout(timer)
    reader.releaseLock()
  }
}
