export type Subscription = {id: string; title: string; endpoint: string; enabled: boolean};
export type FeedHistory = {rows: Subscription[]; before: Subscription[] | null; nextId: number};

export const INITIAL_FEEDS: Subscription[] = [
  {id: 's-1', title: '工程实践', endpoint: 'https://example.org/engineering.xml', enabled: true},
  {id: 's-2', title: '设计系统', endpoint: 'https://example.org/design.xml', enabled: true},
  {id: 's-3', title: '资讯观察', endpoint: 'https://example.org/news.xml', enabled: false},
];
export const initialFeedHistory: FeedHistory = {rows: INITIAL_FEEDS, before: null, nextId: 1};

export function toggleFeed(state: FeedHistory, id: string, enabled: boolean): FeedHistory {
  const current = state.rows.find(row => row.id === id);
  if (!current || current.enabled === enabled) return state;
  return {...state, before: state.rows, rows: state.rows.map(row => row.id === id ? {...row, enabled} : row)};
}

export function addFeed(state: FeedHistory, title: string, endpoint: string): FeedHistory {
  if (!title.trim() || !endpoint || state.rows.some(row => row.endpoint === endpoint)) return state;
  const row: Subscription = {id: 'local-' + state.nextId, title, endpoint, enabled: true};
  return {...state, before: state.rows, nextId: state.nextId + 1, rows: [...state.rows, row]};
}

export function undoFeed(state: FeedHistory): FeedHistory {
  if (!state.before) return state;
  return {...state, rows: state.before, before: null};
}
