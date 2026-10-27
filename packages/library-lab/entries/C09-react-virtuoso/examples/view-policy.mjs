/** Query and pagination policy shared by the actual Virtuoso example and its offline tests. */
export function normalizeFeedQuery(value) {
  if (typeof value !== 'string') return '';
  return Array.from(value.normalize('NFC').replace(/[\u0000-\u001f\u007f]/gu, '').trim()).slice(0, 80).join('');
}
export function nextWindowLimit(current, total, batch = 30) {
  if (![current, total, batch].every(Number.isSafeInteger) || current < 0 || total < 0 || batch <= 0) {
    throw new RangeError('pagination requires non-negative safe integers and positive batch');
  }
  return Math.min(total, current + batch);
}
export function nextViewRevision(revision) {
  if (!Number.isSafeInteger(revision) || revision < 0 || revision === Number.MAX_SAFE_INTEGER) {
    throw new RangeError('invalid view revision');
  }
  return revision + 1;
}
