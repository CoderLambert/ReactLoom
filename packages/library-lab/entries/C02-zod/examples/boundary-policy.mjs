/** Credential-free HTTPS identity, not a replacement for server-side SSRF checks.
 * Host/default port canonicalize for identity; path/query remain case-sensitive.
 * Calling this predicate from refine does not replace the caller’s output URL. */
export function canonicalHttpsFeedUrl(input) {
  if (typeof input !== 'string') return null
  const value = input.trim()
  // biome-ignore lint/suspicious/noControlCharactersInRegex: rejecting ASCII controls is the input boundary
  if (!value || /[\u0000-\u001f\u007f]/u.test(value)) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return null
    url.hash = ''
    return url.href
  } catch {
    return null
  }
}

/** A basename, never a path supplied by an OPML import. */
export function isSafeOpmlFilename(value) {
  return (
    typeof value === 'string' &&
    // biome-ignore lint/suspicious/noControlCharactersInRegex: filenames intentionally reject control characters
    /^[^/\\\u0000-\u001f\u007f]+\.opml$/iu.test(value) &&
    value !== '.' &&
    value !== '..'
  )
}
/** Invalid URLs belong to per-field validation and cannot be dedupe keys. */
export function duplicateFeedIndex(sources) {
  const seen = new Set()
  for (const [index, source] of sources.entries()) {
    const key = canonicalHttpsFeedUrl(source.url)
    if (key === null) continue
    if (seen.has(key)) return index
    seen.add(key)
  }
  return -1
}
