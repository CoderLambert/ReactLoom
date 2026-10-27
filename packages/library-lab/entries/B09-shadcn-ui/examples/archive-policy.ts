export type Archivable = {id: string; archived: boolean};
/** Stable id snapshot; archived/unknown ids never count as new work. */
export function pendingArchiveIds<T extends Archivable>(rows: readonly T[], selectedIds: readonly string[]): string[] {
  const selected = new Set(selectedIds);
  return rows.filter(row => selected.has(row.id) && !row.archived).map(row => row.id);
}
export function archiveByIds<T extends Archivable>(rows: readonly T[], ids: readonly string[]): T[] {
  const selected = new Set(ids);
  return rows.map(row => selected.has(row.id) && !row.archived ? {...row, archived: true} : row);
}
/** Invalidate every scheduled callback on reset, level switch or unmount. */
export function isCurrentArchiveRun(scheduledEpoch: number, currentEpoch: number): boolean {
  return Number.isSafeInteger(scheduledEpoch) && scheduledEpoch === currentEpoch;
}
