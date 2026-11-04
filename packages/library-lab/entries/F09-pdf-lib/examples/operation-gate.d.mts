export declare function createOperationGate(): {
  begin(): number | null;
  isCurrent(id: number | null): boolean;
  finish(id: number | null): boolean;
  invalidate(): void;
};
