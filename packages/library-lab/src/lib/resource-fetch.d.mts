/** Deadline includes streaming-body parsing, not merely response headers. */
export function requestGeneratedResource<T>(
  url: string,
  parse: (response: Response) => Promise<T>,
  options?: {
    signal?: AbortSignal
    timeoutMs?: number
    fetchImpl?: typeof fetch
  },
): Promise<T>
