/** Bound the zero-based server page after a concurrent result-count change. */
export function clampPageIndex(pageIndex, pageSize, total) {
  if (![pageIndex, pageSize, total].every(Number.isFinite) || pageSize <= 0) return 0;
  const last = Math.max(0, Math.ceil(Math.max(0, total) / pageSize) - 1);
  return Math.min(Math.max(0, Math.floor(pageIndex)), last);
}

/** Stable, explicit request identity: never show a page fetched for another query. */
export function tableQueryIdentity({pageIndex, pageSize, sorting, query, fail, limit}) {
  const allowedSort = new Set(['title', 'category', 'subscribers', 'status']);
  if (!Number.isSafeInteger(pageIndex) || pageIndex < 0 ||
      !Number.isSafeInteger(pageSize) || pageSize < 1 ||
      !Number.isSafeInteger(limit) || limit < 0 ||
      typeof query !== 'string' || typeof fail !== 'boolean' ||
      !Array.isArray(sorting) || sorting.length > 1 ||
      sorting.some(sort => !sort || !allowedSort.has(sort.id) || typeof sort.desc !== 'boolean')) {
    throw new TypeError('Invalid table request identity');
  }
  return JSON.stringify([pageIndex, pageSize, sorting.map(sort => [sort.id, sort.desc]), query, fail, limit]);
}

/** An epoch prevents an A→B→A query from accepting A's original late response. */
export function createPageRequestGate() {
  let epoch = 0;
  let controller = null;
  const invalidate = () => {
    epoch += 1;
    controller?.abort();
    controller = null;
  };
  return {
    invalidate,
    revision: () => epoch,
    begin() {
      invalidate();
      const current = new AbortController();
      controller = current;
      const mine = epoch;
      return {
        generation: mine,
        signal: current.signal,
        owns: () => mine === epoch && controller === current && !current.signal.aborted,
        close() { if (mine === epoch && controller === current) controller = null; },
        cancel() { if (mine === epoch) invalidate(); },
      };
    },
  };
}
