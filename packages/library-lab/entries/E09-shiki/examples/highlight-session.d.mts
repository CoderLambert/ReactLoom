export function scheduleHighlight<T>(
  run: () => Promise<T>,
  apply: (result: T) => void,
  fail: (error: unknown) => void,
  delay?: number,
): () => void
