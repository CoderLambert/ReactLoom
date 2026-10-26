/**
 * One small URL policy for untrusted research notes. Runtime assets are copied to
 * /raw/<ID>/assets by the catalogue generator, never served from repository paths.
 */
export function resolveDocumentUrl(value, entryId, basePath = '/') {
  if (typeof value !== 'string' || /[\u0000-\u0020\\<>"']/u.test(value)) return '';
  if (value.startsWith('#') && /^#[\p{L}\p{N}_-]+$/u.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:') return url.href;
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
  const encodedPath = parts.map(encodeURIComponent).join('/');
  const fragment = hash && /^[\p{L}\p{N}_-]+$/u.test(hash) ? `#${encodeURIComponent(hash)}` : '';
  return `${prefix}raw/${entryId}/${encodedPath}${fragment}`;
}

/** A minimal ToC scanner: fenced source code and blockquotes never create links. */
export function extractDocumentHeadings(markdown) {
  if (typeof markdown !== 'string') return [];
  const headings = [];
  let fence = null;
  markdown.split(/\r?\n/u).forEach((line, index) => {
    const open = line.match(/^ {0,3}(`{3,}|~{3,})/u);
    if (open) {
      const marker = open[1][0];
      if (!fence) fence = {marker, length:open[1].length};
      else if (marker === fence.marker && open[1].length >= fence.length) fence = null;
      return;
    }
    if (fence) return;
    const match = line.match(/^ {0,3}(#{1,3})(?:\s+|$)(.*)$/u);
    if (!match) return;
    const text = match[2].replace(/\s+#+\s*$/u,'').trim();
    if (text) headings.push({depth:match[1].length,title:text,line:index+1,id:`section-${index+1}`});
  });
  return headings;
}
