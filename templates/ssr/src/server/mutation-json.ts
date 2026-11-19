// App Router Route Handlers use Web Request bodies rather than the Pages
// Router's bodyParser.sizeLimit. Bound JSON mutations even without Content-Length.
export const MAX_MUTATION_JSON_BYTES = 64 * 1024

type MutationJsonResult = { ok: true; data: unknown } | { ok: false; tooLarge: boolean }

export async function readMutationJson(request: Request): Promise<MutationJsonResult> {
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
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > MAX_MUTATION_JSON_BYTES) {
        // An untrusted stream cancel hook can stall; return the 413 without waiting.
        void reader.cancel().catch(() => {})
        return { ok: false, tooLarge: true }
      }
      text += decoder.decode(value, { stream: true })
    }
    text += decoder.decode()
    return { ok: true, data: JSON.parse(text) }
  } catch {
    return { ok: false, tooLarge: false }
  } finally {
    reader.releaseLock()
  }
}
