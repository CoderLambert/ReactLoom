/** Immutable source-of-truth updates; callers rebuild a Fuse index from each snapshot. */
function assertDocuments(documents) {
  if (!Array.isArray(documents)) throw new TypeError('documents must be an array');
  const ids = new Set();
  for (const document of documents) {
    if (!document || typeof document.id !== 'string' || !document.id.trim() || ids.has(document.id)) {
      throw new TypeError('document IDs must be unique nonempty strings');
    }
    ids.add(document.id);
  }
  return ids;
}
export function upsertDocument(documents, incoming) {
  const ids = assertDocuments(documents);
  if (!incoming || typeof incoming.id !== 'string' || !incoming.id.trim()) {
    throw new TypeError('incoming document must have a stable ID');
  }
  return ids.has(incoming.id)
    ? documents.map(document => document.id === incoming.id ? {...incoming} : document)
    : [...documents, {...incoming}];
}
export function removeDocument(documents, id) {
  const ids = assertDocuments(documents);
  if (typeof id !== 'string' || !id.trim()) throw new TypeError('id must be a stable nonempty string');
  return ids.has(id) ? documents.filter(document => document.id !== id) : documents;
}
