/**
 * One small URL policy for untrusted research notes. Runtime assets are copied to
 * /raw/<ID>/assets by the catalogue generator, never served from repository paths.
 */
export function resolveDocumentUrl(value, entryId, basePath = '/') {
  if (typeof value !== 'string' || /[\u0000-\u0020\\<>"']/u.test(value)) return '';
  if (value.startsWith('#') && /^#[\p{L}\p{N}_-]+$/u.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && url.hostname && !url.username && !url.password) return url.href;
  } catch { /* relative URLs handled below */ }
  if (!/^[A-F]\d{2}$/u.test(entryId)) return '';
  const [relative, hash] = value.split('#');
  if (!relative || value.split('#').length > 2) return '';
  if (!/^(?:\.\/)?(?:assets\/)?[\p{L}\p{N}_.\/-]+$/u.test(relative) ||
      relative.startsWith('/') || relative.startsWith('//')) return '';
  const parts = relative.replace(/^\.\//u, '').split('/');
  if (parts.some(part => !part || part === '..' || part === '.')) return '';
  const prefix = basePath.startsWith('/') && !basePath.includes('..') ?
    `${basePath.replace(/\/$/u, '')}/` : '/';
  // The generator publishes only reviewed local markdown, raster assets, and
  // declared example/test sources. Avoid links that silently serve SPA HTML.
  const normalized = parts.join('/');
  let published;
  if (normalized === 'guide.md' || normalized === 'agent.md') published = normalized;
  else if (/^assets\/(?:[\p{L}\p{N}_-]+\/)*[\p{L}\p{N}_-]+\.(?:png|jpe?g|webp|gif)$/iu.test(normalized)) published = normalized;
  else if (/^(?:examples|tests)\/(?:[\p{L}\p{N}_.-]+\/)*[\p{L}\p{N}_.-]+\.(?:[cm]?[jt]sx?|json|css|md|txt|ya?ml)$/iu.test(normalized)) published = 'sources/' + normalized;
  else return '';
  const encodedPath = published.split('/').map(encodeURIComponent).join('/');
  const fragment = hash && /^[\p{L}\p{N}_-]+$/u.test(hash) ? `#${encodeURIComponent(hash)}` : '';
  return `${prefix}raw/${entryId}/${encodedPath}${fragment}`;
}

export function slugHeading(text) {
  return String(text ?? '').normalize('NFKC').toLocaleLowerCase()
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, '$1')
    .replace(/[`*_~]/gu,'')
    .replace(/<[^>]*>/gu,'')
    .replace(/[^\p{L}\p{N}_\s-]/gu,'')
    .trim().replace(/\s+/gu,'-').replace(/-+/gu,'-');
}
/** A minimal ToC scanner: fenced source code and blockquotes never create links. */
export function extractDocumentHeadings(markdown) {
  if (typeof markdown !== 'string') return [];
  const headings = [];
  const seen = new Map();
  let fence = null;
  markdown.split(/\r?\n/u).forEach((line, index) => {
    const open = line.match(/^ {0,3}(`{3,}|~{3,})/u);
    if (open) {
      const marker = open[1][0];
      if (!fence) fence = {marker, length:open[1].length};
      else if (marker === fence.marker && open[1].length >= fence.length) fence = null;
      return;
    }
    if (fence || /^\s*>/u.test(line)) return;
    const match = line.match(/^ {0,3}(#{1,3})(?:\s+|$)(.*)$/u);
    if (!match) return;
    const text = match[2].replace(/\s+#+\s*$/u,'').trim();
    if (text) {
      const stem=slugHeading(text)||`section-${index+1}`;
      const count=seen.get(stem)??0;
      seen.set(stem,count+1);
      headings.push({depth:match[1].length,title:text,line:index+1,id:count?`${stem}-${count}`:stem});
    }
  });
  return headings;
}


/** Read generated Markdown with a decoded-byte ceiling, not an unbounded
 * Response.text(). Content-Length may describe compressed bytes or be forged. */
export const MAX_MARKDOWN_BYTES = 2_000_000;
export async function readLimitedMarkdownResponse(response) {
  if (!response?.ok || response.headers?.get('content-type')?.toLowerCase().includes('text/html'))
    throw new Error('Markdown 原文未生成，或服务器返回了 SPA 页面');
  if (!response.body) throw new Error('Markdown 响应没有可读取的字节流');
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8', {fatal:true});
  const chunks = [];
  let bytes = 0;
  try {
    for (;;) {
      const {value, done} = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) throw new Error('Markdown 响应不是字节流');
      bytes += value.byteLength;
      if (bytes > MAX_MARKDOWN_BYTES) throw new Error('Markdown 响应超过 2 MB 安全上限');
      chunks.push(decoder.decode(value, {stream:true}));
    }
    chunks.push(decoder.decode());
    return chunks.join('');
  } catch(error) {
    try { await reader.cancel(); } catch { /* aborted / already closed */ }
    throw error;
  } finally {
    reader.releaseLock();
  }
}
