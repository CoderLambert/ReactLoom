export type Feed = {id: string; title: string; quota: number; enabled: boolean};
export type FeedHistory = {rows: Feed[]; before: Feed[] | null};
export const INITIAL_FEEDS: Feed[] = [
  {id: 'frontend', title: '前端实践', quota: 15, enabled: true},
  {id: 'ai', title: 'AI 与工程', quota: 25, enabled: true},
  {id: 'security', title: '安全公告', quota: 5, enabled: false},
];
export const initialFeedHistory: FeedHistory = {rows: INITIAL_FEEDS, before: null};

export function validQuota(value: number | string): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1 && value <= 100;
}
export function updateQuota(state: FeedHistory, id: string, value: number | string): FeedHistory {
  if (!validQuota(value)) return state;
  const current = state.rows.find(row => row.id === id);
  if (!current || current.quota === value) return state;
  return {...state, before: state.rows, rows: state.rows.map(row => row.id === id ? {...row, quota: value} : row)};
}
export function toggleFeed(state: FeedHistory, id: string, enabled: boolean): FeedHistory {
  const current = state.rows.find(row => row.id === id);
  if (!current || current.enabled === enabled) return state;
  return {...state, before: state.rows, rows: state.rows.map(row => row.id === id ? {...row, enabled} : row)};
}
export function undoFeed(state: FeedHistory): FeedHistory {
  if (!state.before) return state;
  return {...state, rows: state.before, before: null};
}
