import { releaseProxy } from 'comlink'
export declare function disposeSession(
  active: {
    controller: AbortController
    remote: { [releaseProxy]: () => void }
    worker: { terminate(): void }
  } | null,
): string
