/**
 * Keep pinned items at the same index in both drag and keyboard reordering.
 * SDK drag/drop callbacks give positions; domain rules own lock constraints.
 */
export function canReorderAroundPinned<T extends {locked?: boolean; fixed?: boolean}>(
  items: readonly T[], source: number, destination: number,
): boolean {
  if (!Number.isInteger(source) || !Number.isInteger(destination)) return false;
  if (source < 0 || destination < 0 || source >= items.length || destination >= items.length) return false;
  if (source === destination) return false;
  for (let index = Math.min(source, destination); index <= Math.max(source, destination); index++) {
    const item = items[index];
    if (item?.locked || item?.fixed) return false;
  }
  return true;
}
