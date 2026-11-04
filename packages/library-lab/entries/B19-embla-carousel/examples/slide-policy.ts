/** Snap positions can be fewer than cards with containScroll: trimSnaps. */
export function boundedSnap(index: number, snapCount: number): number {
  if (!Number.isSafeInteger(index) || !Number.isSafeInteger(snapCount) || snapCount < 1) return 0;
  return Math.max(0, Math.min(index, snapCount - 1));
}

/** Keyboard arrows act only when the carousel viewport itself has focus. */
export function carouselArrow(key: string, onViewport: boolean, canPrevious: boolean, canNext: boolean): 'prev' | 'next' | null {
  if (!onViewport) return null;
  if (key === 'ArrowLeft' && canPrevious) return 'prev';
  if (key === 'ArrowRight' && canNext) return 'next';
  return null;
}
/** Never reuse a slide ID after removals or restore operations. */
export function allocateSlideId(lastAllocated: number, presentIds: readonly number[]): number {
  const maximum = presentIds.reduce((max, id) => Number.isSafeInteger(id) && id >= 0 ? Math.max(max, id) : max, lastAllocated);
  if (!Number.isSafeInteger(maximum) || maximum < 0 || maximum >= Number.MAX_SAFE_INTEGER) throw new RangeError('Invalid slide ID');
  return maximum + 1;
}
