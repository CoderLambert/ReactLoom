export const EDITABLE_STATUSES = Object.freeze(['active', 'paused', 'error']);

/** Compare-and-swap. A UI edit must carry the revision displayed when editing began. */
export function applyStatusEdit(rows, id, nextStatus, expectedRevision) {
  if (!EDITABLE_STATUSES.includes(nextStatus) || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
    return {rows, outcome: 'invalid'};
  }
  const current = rows.find(row => row.id === id);
  if (!current) return {rows, outcome: 'not-found'};
  if (current.revision !== expectedRevision) return {rows, outcome: 'conflict'};
  if (current.status === nextStatus) return {rows, outcome: 'unchanged'};
  return {
    rows: rows.map(row => row.id === id ? {...row, status: nextStatus, revision: row.revision + 1} : row),
    outcome: 'applied'
  };
}

/** Incoming server snapshots may lag local edits; drop missing rows, retain newer statuses by stable ID. */
export function reconcileFeedSnapshot(previous, incoming) {
  const prior = new Map(previous.map(row => [row.id, row]));
  return incoming.map(row => {
    const local = prior.get(row.id);
    return local && local.revision > row.revision
      ? {...row, status: local.status, revision: local.revision}
      : row;
  });
}

