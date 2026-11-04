export type Feed = {id: string; name: string; group: 'tech'|'business'};
export declare const PAGE_SIZE: number;
export declare const MAX_QUERY_LENGTH: number;
export declare function sanitizeQuery(input: unknown): string;
export declare function deriveSearchView(
  state: {level: 'basic'|'business'|'advanced'; query: string; group: string; page: number},
  feeds: Feed[],
): {safeQuery: string; safeGroup: string; matches: Feed[]; pageCount: number; safePage: number; pageItems: Feed[]};
