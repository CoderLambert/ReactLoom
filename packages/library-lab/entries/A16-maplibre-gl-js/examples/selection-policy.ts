/** Keep map selection aligned with the visible GeoJSON and the keyboard table. */
export function resolveVisibleStation<T extends {readonly id: string}>(
  visible: readonly T[], selectedId: string,
): string {
  return visible.some(station => station.id === selectedId) ? selectedId : (visible[0]?.id ?? '');
}

/** A zero-sized or detached container must never schedule a GL resize. */
export function canResizeMap(width: number, height: number, active: boolean): boolean {
  return active && Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;
}
