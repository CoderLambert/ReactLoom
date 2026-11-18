export const MAX_HTML_BYTES = 25_000
export function assertHTMLBudget(input) {
  if (typeof input !== 'string') throw new TypeError('HTML输入必须是字符串')
  const bytes = new TextEncoder().encode(input).byteLength
  if (bytes > MAX_HTML_BYTES) throw new Error(`HTML输入${bytes}字节超过${MAX_HTML_BYTES}字节限额`)
  return input
}
