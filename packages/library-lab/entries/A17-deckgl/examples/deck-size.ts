export type DeckSize = Readonly<{width: number; height: number}>;
/** Don't trigger WebGL resize while a lazy-mounted host is hidden/zero-sized.
 * Bound pathological measurements to avoid requesting giant GPU framebuffers. */
export function measuredDeckSize(width: number, height: number): DeckSize | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  return {width: Math.min(4096, Math.max(1, Math.ceil(width))), height: Math.min(4096, Math.max(1, Math.ceil(height)))};
}
export function needsDeckResize(current: DeckSize, next: DeckSize | null): next is DeckSize {
  return next !== null && (next.width !== current.width || next.height !== current.height);
}
