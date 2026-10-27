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

export type Channel = {id: string; label: string; fixed?: boolean};
export type OrderState = {items: Channel[]; previous: Channel[] | null; message: string; revision: number};
export type OrderAction =
  | {type: 'move'; from: number; to: number; visibleCount: number}
  | {type: 'undo'} | {type: 'reset'} | {type: 'notice'; message: string};
export type DragSnapshot = {ids: string[]; revision: number; level: string};
const INITIAL: Channel[] = [
  {id: 'ai', label: 'AI 模型研究'}, {id: 'frontend', label: '前端工程'},
  {id: 'rss', label: 'RSS 频道'}, {id: 'global', label: '国际时事', fixed: true},
  {id: 'notes', label: '深度阅读'},
];
export function initialOrderState(): OrderState {
  return {items: INITIAL.map(item => ({...item})), previous: null, revision: 0,
    message: '拖动手柄更改顺序，或使用上下按钮。'};
}
export function reduceOrder(state: OrderState, action: OrderAction): OrderState {
  if (action.type === 'notice') return {...state, message: action.message};
  if (action.type === 'undo') {
    return state.previous ? {...state, items: state.previous, previous: null,
      revision: state.revision + 1, message: '已撤销'} : state;
  }
  if (action.type === 'reset') {
    return {...state, previous: state.items, items: INITIAL.map(item => ({...item})),
      revision: state.revision + 1, message: '已重置频道'};
  }
  const visible = state.items.slice(0, action.visibleCount);
  if (!canReorderAroundPinned(visible, action.from, action.to)) {
    return {...state, message: '固定频道不可移动，也不能被跨越；顺序未改变'};
  }
  const list = visible.slice();
  const [item] = list.splice(action.from, 1);
  list.splice(action.to, 0, item);
  return {...state, previous: state.items, items: [...list, ...state.items.slice(action.visibleCount)],
    revision: state.revision + 1, message: `已调整频道 ${item.label} 的顺序`};
}
export function isFreshDrop(snapshot: DragSnapshot | null, state: OrderState,
  level: string, sourceIndex: number, draggedId: string, visibleCount: number): boolean {
  if (!snapshot || snapshot.level !== level || snapshot.revision !== state.revision) return false;
  const ids = state.items.slice(0, visibleCount).map(item => item.id);
  return snapshot.ids.length === ids.length && snapshot.ids.every((id, i) => id === ids[i]) &&
    Number.isInteger(sourceIndex) && sourceIndex >= 0 && snapshot.ids[sourceIndex] === draggedId;
}
