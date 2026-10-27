export declare function clampPageIndex(pageIndex: number, pageSize: number, total: number): number;
export declare function tableQueryIdentity(value: {
  pageIndex: number;
  pageSize: number;
  sorting: ReadonlyArray<{id: string; desc: boolean}>;
  query: string;
  fail: boolean;
  limit: number;
}): string;
export interface PageRequestLease {
  readonly signal: AbortSignal;
  owns(): boolean;
  close(): void;
  cancel(): void;
}
export declare function createPageRequestGate(): {
  invalidate(): void;
  begin(): PageRequestLease;
};
