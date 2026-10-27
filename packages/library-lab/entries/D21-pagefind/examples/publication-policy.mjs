const HTML_ENTITIES = {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'};
export function escapeHtmlText(value) {
  return String(value).replace(/[&<>"']/g, ch => HTML_ENTITIES[ch]);
}
// Only documents explicitly marked public can enter a downloadable Pagefind bundle.
// This is a local build assertion, not a substitute for upstream ACL or content review.
export function assertPublicDocument(record) {
  if (!record || record.visibility !== 'public') throw new Error('Pagefind requires explicit public visibility');
  if (typeof record.url !== 'string' || !/^\/(?:articles|files)\/[a-z0-9][a-z0-9/.-]*$/u.test(record.url) ||
      record.url.includes('..') || record.url.includes('//')) {
    throw new Error('Pagefind document URL must be an approved public site path');
  }
  for (const key of ['title','content']) {
    if (typeof record[key] !== 'string' || !record[key].trim()) {
      throw new Error('Pagefind public document missing ' + key);
    }
  }
  return record;
}
