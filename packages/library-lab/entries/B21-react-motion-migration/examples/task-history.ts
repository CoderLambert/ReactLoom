export type Task = {id: string; text: string};
export type TaskSnapshot = {items: Task[]; selected: string | null};
export type TaskState = TaskSnapshot & {undo: TaskSnapshot | null; nextId: number};
export type TaskAction = {type: 'add'} | {type: 'remove'; id: string} | {type: 'select'; id: string} | {type: 'undo'};
export const MAX_TASKS = 24;
const INITIAL: Task[] = [
  {id: 'rss', text: 'RSS 订阅源'}, {id: 'model', text: 'AI 模型设置'},
  {id: 'notes', text: '技术阅读笔记'},
];
export function initialTaskState(): TaskState {
  return {items: INITIAL.map(item => ({...item})), selected: null, undo: null, nextId: 0};
}
export function reduceTasks(state: TaskState, action: TaskAction): TaskState {
  if (action.type === 'undo') {
    return state.undo ? {...state, items: state.undo.items, selected: state.undo.selected, undo: null} : state;
  }
  if (action.type === 'select') {
    return state.items.some(item => item.id === action.id) ? {...state, selected: action.id} : state;
  }
  if (action.type === 'add') {
    if (state.items.length >= MAX_TASKS) return state;
    const nextId = state.nextId + 1;
    return {...state, items: [...state.items, {id: `local-${nextId}`, text: `新任务 ${nextId}`}],
      undo: {items: state.items, selected: state.selected}, nextId};
  }
  if (!state.items.some(item => item.id === action.id)) return state;
  return {...state, items: state.items.filter(item => item.id !== action.id),
    selected: state.selected === action.id ? null : state.selected,
    undo: {items: state.items, selected: state.selected}};
}
