/** Bound the zero-based server page after a concurrent result-count change. */
export function clampPageIndex(pageIndex, pageSize, total) {
  if (![pageIndex, pageSize, total].every(Number.isFinite) || pageSize <= 0) return 0;
  const last = Math.max(0, Math.ceil(Math.max(0, total) / pageSize) - 1);
  return Math.min(Math.max(0, Math.floor(pageIndex)), last);
}
