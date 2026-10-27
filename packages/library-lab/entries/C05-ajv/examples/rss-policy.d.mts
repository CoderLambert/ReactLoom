export declare function canonicalHttpsFeedUrl(input: unknown): string | null;
export interface FeedBoundaryIssue { path: string; message: string; }
export declare function validateFeedBoundaries(level: 'basic' | 'business' | 'advanced', payload: unknown): FeedBoundaryIssue[];
