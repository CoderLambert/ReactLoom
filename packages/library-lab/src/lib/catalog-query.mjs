/** URL-bound search is limited; composing text must never be navigated mid-IME. */
export const SEARCH_QUERY_LIMIT = 200;
export const SEARCH_DEBOUNCE_MS = 180;
export function normalizeCatalogQuery(value) {
  return typeof value === 'string' ? value.slice(0, SEARCH_QUERY_LIMIT) : '';
}
