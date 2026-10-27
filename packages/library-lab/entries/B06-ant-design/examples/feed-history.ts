export interface FeedRecord { id: string; url: string; enabled: boolean; }
export type FeedHistory<T extends FeedRecord> = { rows: readonly T[]; previous: readonly T[] | null };

/** One atomic state transition owns both current data and its undo snapshot. */
export function appendFeed<T extends FeedRecord>(state: FeedHistory<T>, feed: T): FeedHistory<T> {
  if (state.rows.some(existing => existing.id === feed.id || existing.url === feed.url)) return state;
  return {rows: [feed, ...state.rows], previous: state.rows};
}

export function toggleFeed<T extends FeedRecord>(state: FeedHistory<T>, id: string, enabled: boolean): FeedHistory<T> {
  if (!state.rows.some(feed => feed.id === id && feed.enabled !== enabled)) return state;
  return {rows: state.rows.map(feed => feed.id === id ? {...feed, enabled} : feed), previous: state.rows};
}

export function undoFeed<T extends FeedRecord>(state: FeedHistory<T>): FeedHistory<T> {
  if (!state.previous) return state;
  return {rows: state.previous, previous: null};
}
