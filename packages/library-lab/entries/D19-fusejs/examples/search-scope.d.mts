export type ScopeLevel = 'basic'|'business'|'advanced';
export type SearchGroup = '全部'|'技术'|'商业'|'开源';
export function normalizeQuery(value: unknown): string;
export function resolveScope(input: {level: ScopeLevel; group: SearchGroup; threshold: number}): {group: SearchGroup; threshold: number};
export function visibleDocuments<T extends {group: string}>(documents: T[], group: string): T[];
