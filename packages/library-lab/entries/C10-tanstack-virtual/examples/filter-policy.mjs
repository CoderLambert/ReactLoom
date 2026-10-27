/** Filter-session identity and stable virtual row keys, used by TanStack Virtual demo. */
export function normalizeFilterQuery(value) {
  if (typeof value !== 'string') return '';
  return Array.from(value.normalize('NFC').replace(/[\u0000-\u001f\u007f]/gu, '').trim()).slice(0, 80).join('');
}
export function viewIdentity(group, query, revision) {
  if (typeof group !== 'string' || typeof query !== 'string' ||
      !Number.isSafeInteger(revision) || revision < 0) throw new TypeError('invalid view identity');
  // Length-delimited encoding prevents ambiguous string concatenation collisions.
  return JSON.stringify([group, query, revision]);
}
export function stableRowId(items, index) {
  if (!Array.isArray(items) || !Number.isSafeInteger(index) || index < 0 || index >= items.length) {
    throw new RangeError('virtual row index is outside current data');
  }
  const id=items[index]?.id;
  if (typeof id !== 'string' || !id.trim()) throw new TypeError('virtual row requires a stable business id');
  return id;
}
