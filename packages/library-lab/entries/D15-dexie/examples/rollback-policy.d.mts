export interface FeedSnapshot {
  id: string;
  group: string;
  updatedAt: number;
  read: boolean;
}
export function sameFeedSnapshot(before: readonly FeedSnapshot[], after: readonly FeedSnapshot[]): boolean;
