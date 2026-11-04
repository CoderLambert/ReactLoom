import { sourceTextPath } from './source-integrity.mjs'

/**
 * One small URL policy for untrusted research notes. Runtime assets are copied to
 * /raw/<ID>/assets by the catalogue generator, never served from repository paths.
 */
export function resolveDocumentUrl(value, entryId, basePath = '/') {
  if (
    typeof value !== 'string' ||
    Array.from(value).some((character) => character.charCodeAt(0) <= 32) ||
    /[\\<>"']/u.test(value)
  )
    return ''
  if (value.startsWith('#') && /^#[\p{L}\p{N}_-]+$/u.test(value)) return value
  try {
    const url = new URL(value)
    if (url.protocol === 'https:' && url.hostname && !url.username && !url.password) return url.href
  } catch {
    /* relative URLs handled below */
  }
  if (!/^[A-F]\d{2}$/u.test(entryId)) return ''
  const [relative, hash] = value.split('#')
  if (!relative || value.split('#').length > 2) return ''
  if (
    !/^(?:\.\/)?(?:assets\/)?[\p{L}\p{N}_./-]+$/u.test(relative) ||
    relative.startsWith('/') ||
    relative.startsWith('//')
  )
    return ''
  const parts = relative.replace(/^\.\//u, '').split('/')
  if (parts.some((part) => !part || part === '..' || part === '.')) return ''
  // Vite BASE_URL must be a same-origin pathname, never a scheme-relative URL.
  const segments = typeof basePath === 'string' ? basePath.split('/') : []
  const safeBase =
    typeof basePath === 'string' &&
    basePath.startsWith('/') &&
    !basePath.startsWith('//') &&
    !basePath.includes('//') &&
    segments.every(
      (part, index) =>
        index === 0 ||
        (part === '' && index === segments.length - 1) ||
        (part !== '.' && part !== '..' && /^[\p{L}\p{N}_.~-]+$/u.test(part)),
    )
      ? basePath
      : '/'
  const prefix = safeBase.replace(/\/$/u, '') + '/'
  // The generator publishes only reviewed local markdown, raster assets, and
  // declared example/test sources. Avoid links that silently serve SPA HTML.
  const normalized = parts.join('/')
  let published
  if (normalized === 'guide.md' || normalized === 'agent.md') published = normalized
  else if (
    /^assets\/(?:[\p{L}\p{N}_-]+\/)*[\p{L}\p{N}_-]+\.(?:png|jpe?g|webp|gif)$/iu.test(normalized)
  )
    published = normalized
  else if (
    /^(?:examples|tests)\/(?:[\p{L}\p{N}_.-]+\/)*[\p{L}\p{N}_.-]+\.(?:[cm]?[jt]sx?|json|css|md|txt|ya?ml|html?|svg)$/iu.test(
      normalized,
    )
  )
    published = 'sources/' + sourceTextPath(normalized)
  else return ''
  const encodedPath = published.split('/').map(encodeURIComponent).join('/')
  const fragment = hash && /^[\p{L}\p{N}_-]+$/u.test(hash) ? `#${encodeURIComponent(hash)}` : ''
  return `${prefix}raw/${entryId}/${encodedPath}${fragment}`
}

export function slugHeading(text) {
  return String(text ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, '$1')
    .replace(/[`*_~]/gu, '')
    .replace(/<[^>]*>/gu, '')
    .replace(/[^\p{L}\p{N}_\s-]/gu, '')
    .trim()
    .replace(/\s+/gu, '-')
    .replace(/-+/gu, '-')
}
/** Keep Markdown ToC anchors aligned with actual ATX/setext headings.
 * A fence closes only on a blank-suffix delimiter, not on code following ticks.
 * The source line is the first line of a setext heading (as in remark). */
export function extractDocumentHeadings(markdown) {
  if (typeof markdown !== 'string') return []
  const headings = []
  const seen = new Map()
  let fence = null
  let previous = null
  const pushHeading = (title, depth, line) => {
    const stem = slugHeading(title) || 'section-' + line
    const count = seen.get(stem) ?? 0
    seen.set(stem, count + 1)
    headings.push({ depth, title, line, id: count ? stem + '-' + count : stem })
  }
  markdown.split(/\r?\n/u).forEach((line, index) => {
    const fenceLine = line.match(/^ {0,3}(\x60{3,}|~{3,})(.*)$/u)
    if (fence) {
      if (
        fenceLine &&
        fenceLine[1][0] === fence.marker &&
        fenceLine[1].length >= fence.length &&
        !fenceLine[2].trim()
      )
        fence = null
      previous = null
      return
    }
    if (fenceLine) {
      if (fenceLine[1][0] === '~' || !fenceLine[2].includes('\x60'))
        fence = { marker: fenceLine[1][0], length: fenceLine[1].length }
      previous = null
      return
    }
    if (/^(?: {4}|\t| {0,3}>)/u.test(line)) {
      previous = null
      return
    }
    const atx = line.match(/^ {0,3}(#{1,3})(?:\s+|$)(.*)$/u)
    if (atx) {
      const title = atx[2].replace(/\s+#+\s*$/u, '').trim()
      if (title) pushHeading(title, atx[1].length, index + 1)
      previous = null
      return
    }
    const setext = line.match(/^ {0,3}(=+|-+)\s*$/u)
    if (setext && previous && previous.line === index) {
      pushHeading(previous.title, setext[1][0] === '=' ? 1 : 2, previous.line)
      previous = null
      return
    }
    // A list, quote, code block or thematic break is not a setext heading.
    previous =
      /^\s*$/u.test(line) || /^ {0,3}(?:[-*+]\s+|\d+[.)]\s+|(?:[-*_]\s*){3,}$)/u.test(line)
        ? null
        : { title: line.trim(), line: index + 1 }
  })
  return headings
}

/** Read generated Markdown with a decoded-byte ceiling, not an unbounded
 * Response.text(). Content-Length may describe compressed bytes or be forged. */
export const MAX_MARKDOWN_BYTES = 2_000_000
export async function readLimitedMarkdownResponse(response) {
  if (!response?.ok || response.headers?.get('content-type')?.toLowerCase().includes('text/html'))
    throw new Error('Markdown 原文未生成，或服务器返回了 SPA 页面')
  if (!response.body) throw new Error('Markdown 响应没有可读取的字节流')
  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8', { fatal: true })
  const chunks = []
  let bytes = 0
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      if (!(value instanceof Uint8Array)) throw new Error('Markdown 响应不是字节流')
      bytes += value.byteLength
      if (bytes > MAX_MARKDOWN_BYTES) throw new Error('Markdown 响应超过 2 MB 安全上限')
      chunks.push(decoder.decode(value, { stream: true }))
    }
    chunks.push(decoder.decode())
    return chunks.join('')
  } catch (error) {
    try {
      await reader.cancel()
    } catch {
      /* aborted / already closed */
    }
    throw error
  } finally {
    reader.releaseLock()
  }
}
