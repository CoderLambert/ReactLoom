/** Maps reviewed source extensions to an on-demand Shiki grammar; unknowns stay plaintext. */
export function sourceLanguage(filePath) {
  if (typeof filePath !== 'string') return ''
  const lower = filePath.toLowerCase()
  if (/\.tsx$/u.test(lower)) return 'tsx'
  if (/\.jsx$/u.test(lower)) return 'jsx'
  if (/\.(ts|mts|cts)$/u.test(lower)) return 'typescript'
  if (/\.(js|mjs|cjs)$/u.test(lower)) return 'javascript'
  if (/\.css$/u.test(lower)) return 'css'
  if (/\.json$/u.test(lower)) return 'json'
  if (/\.(yml|yaml)$/u.test(lower)) return 'yaml'
  if (/\.(md|mdx)$/u.test(lower)) return 'markdown'
  if (/\.(sh|bash)$/u.test(lower)) return 'bash'
  if (/\.html?$/u.test(lower)) return 'html'
  if (/\.py$/u.test(lower)) return 'python'
  if (/\.go$/u.test(lower)) return 'go'
  if (/\.rs$/u.test(lower)) return 'rust'
  return ''
}
