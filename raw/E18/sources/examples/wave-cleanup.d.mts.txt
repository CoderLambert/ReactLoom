export function releaseWave(
  instance: { destroy(): void },
  unsubscribers: (() => void)[],
  revoke: () => void,
): string[]
