export type ChartRow = {day: string; reads: number; saved: number; rate: number};
const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
export const MAX_REVISION = 1000;

export function normalizeWindow(value: number, fallback = 7): number {
  return Number.isInteger(value) ? Math.max(3, Math.min(14, value)) : fallback;
}

export function nextRevision(value: number): number {
  return Number.isFinite(value) ? Math.min(MAX_REVISION, Math.max(0, Math.trunc(value)) + 1) : 0;
}

export function sampleRows(days: number, revision: number): ChartRow[] {
  const count = normalizeWindow(days);
  const rev = Number.isFinite(revision) ? Math.max(0, Math.min(MAX_REVISION, Math.trunc(revision))) : 0;
  return Array.from({length: count}, (_, index) => {
    const reads = Math.round(140 + 23 * index + 25 * (index % 3) + rev * (index + 2));
    const saved = Math.round(reads * (0.16 + (index % 4) * 0.04));
    return {day: DAYS[index % 7] + (index >= 7 ? '·2' : ''), reads, saved, rate: Math.round(100 * saved / reads)};
  });
}
