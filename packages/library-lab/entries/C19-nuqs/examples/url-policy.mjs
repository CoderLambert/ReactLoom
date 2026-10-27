export const PAGE_SIZE = 2;
export const MAX_QUERY_LENGTH = 80;

// URL input is shareable and can be edited manually; cap and sanitize it before
// performing any filtering. This is a display rule, not authorization.
export function sanitizeQuery(input) {
  if (typeof input !== 'string') return '';
  return Array.from(input.replace(/[\u0000-\u001f\u007f]/gu, '').trim()).slice(0, MAX_QUERY_LENGTH).join('');
}

export function deriveSearchView({level, query, group, page}, feeds) {
  const safeQuery = sanitizeQuery(query);
  // The basic UI has no group control and must not silently honor a stale
  // group parameter left by the business/advanced levels.
  const safeGroup = level === 'basic' ? 'all' : group === 'tech' || group === 'business' ? group : 'all';
  const matches = feeds.filter(item =>
    (safeGroup === 'all' || item.group === safeGroup) &&
    item.name.toLocaleLowerCase().includes(safeQuery.toLocaleLowerCase()));
  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const requestedPage = Number.isSafeInteger(page) && page > 0 ? page : 1;
  const safePage = Math.min(requestedPage, pageCount);
  return {safeQuery, safeGroup, matches, pageCount, safePage,
    pageItems: matches.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)};
}
