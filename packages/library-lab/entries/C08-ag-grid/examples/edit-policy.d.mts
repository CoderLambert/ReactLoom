export type FeedStatus = 'active' | 'paused' | 'error';
export type FeedRow = {id: string; status: FeedStatus; revision: number};
export declare const EDITABLE_STATUSES: readonly FeedStatus[];
export declare function applyStatusEdit<T extends FeedRow>(
  rows: readonly T[], id: string, nextStatus: string, expectedRevision: number
): {rows: T[]; outcome: 'invalid' | 'not-found' | 'conflict' | 'unchanged' | 'applied'};
export declare function reconcileFeedSnapshot<T extends FeedRow>(
  previous: readonly T[], incoming: readonly T[]
): T[];

