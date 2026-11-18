/** Bounded local UTF-8 text only; not content scanning or CSV/Markdown parsing. */
export const MAX_PREVIEW_BYTES = 12_000
export const MAX_DISPLAY_CHARACTERS = 4_000
export async function readTextPreview(blob) {
  if (!(blob instanceof Blob) || blob.size > MAX_PREVIEW_BYTES)
    throw new Error('预览仅读取不超过12,000字节的本地Blob')
  const bytes = await blob.arrayBuffer()
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  if (
    Array.from(text).some((character) => {
      const point = character.codePointAt(0)
      return (point < 32 && ![9, 10, 13].includes(point)) || point === 127
    })
  )
    throw new Error('文件含NUL或不允许的C0/DEL控制字符')
  return Array.from(text).slice(0, MAX_DISPLAY_CHARACTERS).join('')
}
