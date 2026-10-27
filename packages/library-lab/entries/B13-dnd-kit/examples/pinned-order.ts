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

export type SortableRecord={id:string;locked?:boolean;fixed?:boolean};
/** Reorder a visible prefix, preserving hidden items and pinned positions atomically. */
export function reorderVisible<T extends SortableRecord>(items:readonly T[],sourceId:string,targetId:string,visibleCount=items.length):T[]|null {
  if(!Number.isInteger(visibleCount)||visibleCount<1||visibleCount>items.length)return null;
  const visible=items.slice(0,visibleCount);
  if(new Set(visible.map(item=>item.id)).size!==visible.length)return null;
  const source=visible.findIndex(item=>item.id===sourceId);
  const target=visible.findIndex(item=>item.id===targetId);
  if(!canReorderAroundPinned(visible,source,target))return null;
  const result=visible.slice();
  const [moving]=result.splice(source,1);
  result.splice(target,0,moving);
  return [...result,...items.slice(visibleCount)];
}
