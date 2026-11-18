// Reads bounded bytes. Not a file-format validator, parser, or upload operation.
export const PREVIEW_BYTES = 8 * 1024
export const PREVIEW_CHARACTERS = 1600 // Kept export name; budget is UTF-16 code units.
export async function readLocalTextPreview(file) {
  if (
    !file ||
    typeof file.slice !== 'function' ||
    !Number.isSafeInteger(file.size) ||
    file.size < 0
  ) {
    throw new TypeError('A valid local Blob/File is required')
  }
  const bytes = await file.slice(0, PREVIEW_BYTES).arrayBuffer()
  // Streaming decode deliberately leaves a cut final UTF-8 sequence buffered; no flush.
  // Invalid interior sequences may become U+FFFD. This is a lossy preview, not validation.
  const text = new TextDecoder('utf-8').decode(bytes, { stream: true })
  const limited = text.slice(0, PREVIEW_CHARACTERS)
  const last = limited.charCodeAt(limited.length - 1)
  return last >= 0xd800 && last <= 0xdbff ? limited.slice(0, -1) : limited
}
