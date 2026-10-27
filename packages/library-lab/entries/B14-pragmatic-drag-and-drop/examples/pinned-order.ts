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

/** A drag is valid only for the data revision and demo mode in which it started. */
export type DragSession={activeId:string;revision:number;level:'basic'|'business'|'advanced'};
export function isCurrentDragSession(session:DragSession|null,activeId:string,revision:number,level:DragSession['level']):boolean {
  return session!==null && session.activeId===activeId && session.revision===revision && session.level===level;
}
