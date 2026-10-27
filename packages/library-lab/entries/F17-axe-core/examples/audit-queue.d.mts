export type AuditResult<T> = { skipped: true } | { skipped: false; result: T };
export declare function enqueueAxeAudit<T>(
  run: () => Promise<T> | T,
  isCurrent: () => boolean,
): Promise<AuditResult<T>>;
