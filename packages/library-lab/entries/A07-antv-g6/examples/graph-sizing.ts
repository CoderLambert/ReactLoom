/** Ignore hidden/invalid hosts; never exceed a bounded Canvas dimension. */
export function measuredGraphWidth(width: number): number | null {
  if (!Number.isFinite(width) || width < 1) return null;
  return Math.min(4096, Math.floor(width));
}
