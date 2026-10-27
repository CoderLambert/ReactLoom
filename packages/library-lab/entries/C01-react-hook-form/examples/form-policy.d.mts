export function fingerprintDraft(draft: unknown): string | null;
export function canApplySubmitResult(input: {
  expectedFingerprint: string | null;
  currentFingerprint: string | null;
  expectedEpoch: number;
  currentEpoch: number;
  aborted: boolean;
}): boolean;
export function shouldBlockCompositionEnter(input: {
  key: string;
  composing?: boolean;
  isComposing?: boolean;
  keyCode?: number;
  sinceCompositionEndMs?: number;
}): boolean;
