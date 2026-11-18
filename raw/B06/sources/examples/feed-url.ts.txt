/** Local identity/validation only. This demo never fetches the submitted URL. */
export function normalizeHttpsFeedUrl(value: string): string | null {
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return null
    url.hash = ''
    return url.href
  } catch {
    return null
  }
}
