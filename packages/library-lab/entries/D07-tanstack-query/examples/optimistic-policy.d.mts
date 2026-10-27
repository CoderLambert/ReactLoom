export interface OptimisticFeed {id: string; enabled: boolean; rev: number; optimisticToken?: number;}
export interface OptimisticPage<T extends OptimisticFeed> {items: T[]; total: number; page: number;}
export declare function optimisticRow<T extends OptimisticFeed>(page: OptimisticPage<T> | undefined, change: {id: string; enabled: boolean; expectedRev: number; token: number}): OptimisticPage<T> | undefined;
export declare function rollbackRow<T extends OptimisticFeed>(page: OptimisticPage<T> | undefined, change: {id: string; token: number; previous: T | undefined}): OptimisticPage<T> | undefined;
export declare function commitRow<T extends OptimisticFeed>(page: OptimisticPage<T> | undefined, change: {id: string; token: number; saved: T}): OptimisticPage<T> | undefined;
