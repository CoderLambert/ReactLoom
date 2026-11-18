/**
 * Canonical HTTP fetch identity for a credentials-free HTTPS feed.
 * URL performs host/default-port normalization; path/query remain case-sensitive.
 * This is input validation, not a server-side SSRF/authorization policy.
 */
export function canonicalFeedUrl(input) {
  const value = input.trim()
  const hasControl = Array.from(value).some((character) => {
    const code = character.charCodeAt(0)
    return code < 32 || code === 127
  })
  if (!value || hasControl) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return null
    url.hash = ''
    return url.href
  } catch {
    return null
  }
}

/** -1 if no duplicate. Invalid URLs are left to the field validator. */
export function findDuplicateFeedIndex(sources) {
  const seen = new Set()
  for (const [index, source] of sources.entries()) {
    const key = canonicalFeedUrl(source.url)
    if (key === null) continue
    if (seen.has(key)) return index
    seen.add(key)
  }
  return -1
}
