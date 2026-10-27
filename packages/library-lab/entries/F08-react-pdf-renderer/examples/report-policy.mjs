/** Validates only ASCII report data supported by standard PDF fonts. */
export function validatedRows(rows) {
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 140) {
    throw new Error('Row count must be 1..140');
  }
  const ids = new Set();
  return rows.map(row => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error('Row must be an object');
    }
    if (typeof row.id !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,47}$/iu.test(row.id)) {
      throw new Error('Invalid report row ID');
    }
    const id = row.id.toLowerCase();
    if (ids.has(id)) throw new Error('Duplicate report row ID');
    ids.add(id);
    if (typeof row.name !== 'string' || row.name.length < 1 || row.name.length > 70 ||
        !/^[\x20-\x7e]+$/u.test(row.name)) {
      throw new Error('Standard PDF fonts require 1..70 printable ASCII characters');
    }
    if (!Number.isSafeInteger(row.articles) || row.articles < 0 || row.articles > 1_000_000) {
      throw new Error('Invalid article count');
    }
    return { id: row.id, name: row.name, articles: row.articles };
  });
}
