export type ReadingPoint = {day: string; views: number; saves: number};
export function visibleSeries<T extends ReadingPoint>(rows: readonly T[], days: number, threshold: number): T[] {
  const count = Number.isFinite(days) ? Math.max(0, Math.floor(days)) : 0;
  if (count === 0) return [];
  const minimum = Number.isFinite(threshold) ? threshold : 0;
  return rows.slice(-count).filter(row => Number.isFinite(row.views) && row.views >= minimum);
}
export function visibleSelection<T extends ReadingPoint>(rows: readonly T[], selected: string | null): T | null {
  return selected ? rows.find(row => row.day === selected) ?? null : null;
}
export function measuredWidth(raw: number): number | null {
  if (!Number.isFinite(raw) || raw <= 0) return null;
  return Math.max(1, Math.min(4096, Math.floor(raw)));
}
