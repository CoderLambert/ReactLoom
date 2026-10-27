export declare const MAX_SOURCE_BYTES: number;
export interface SourceIndexFile {path: string; sha256: string; bytes: number}
export declare function validateSourceIndex(value: unknown, requestedPaths: string[]): SourceIndexFile[];
export declare function readBoundedSourceResponse(response: Response, expectedBytes: number): Promise<string>;
