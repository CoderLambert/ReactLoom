export declare function upsertDocument<T extends {id: string}>(documents: readonly T[], incoming: T): T[];
export declare function removeDocument<T extends {id: string}>(documents: T[], id: string): T[];
export declare function removeDocument<T extends {id: string}>(documents: readonly T[], id: string): readonly T[];
