/** Bounded, deterministic fixture policy; Chart.js remains the renderer. */
export const MAX_REVISION = 10_000;

export function normalizeRevision(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(MAX_REVISION, Math.floor(value))) : 0;
}

export function nextRevision(value: number): number {
  return Math.min(MAX_REVISION, normalizeRevision(value) + 1);
}

export function chartCounts(revision: number): number[] {
  const current = normalizeRevision(revision);
  return Array.from({length: 7}, (_, index) => 110 + index * 17 + current * (index + 3));
}

/** Auto sampling never advances a hidden, non-advanced or saturated demo. */
export function shouldAutoSample(auto: boolean, level: string, visible: boolean, revision = 0): boolean {
  return auto && level === 'advanced' && visible && normalizeRevision(revision) < MAX_REVISION;
}
