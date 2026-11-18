import * as Comlink from 'comlink'

export const MAX_VALUES = 10000
export const MAX_PROGRESS_STEPS = 20
export function summarize(values: unknown) {
  if (
    !Array.isArray(values) ||
    values.length > MAX_VALUES ||
    Array.from(values).some((value) => typeof value !== 'string' || value.length > 200)
  ) {
    throw new TypeError('Expected at most 10000 strings, each at most 200 UTF-16 units')
  }
  // Map treats __proto__, constructor and toString as ordinary business keys.
  const frequency = new Map<string, number>()
  for (const value of values) frequency.set(value, (frequency.get(value) ?? 0) + 1)
  return {
    count: values.length,
    frequency: Array.from(frequency, ([value, count]) => ({ value, count })),
  }
}
export const api = {
  summarize,
  sumBytes(values: unknown) {
    if (!(values instanceof Uint8Array) || values.byteLength > 1024 * 1024)
      throw new TypeError('Expected Uint8Array up to 1 MiB')
    return values.reduce((sum, value) => sum + value, 0)
  },
  async progress(
    total: unknown,
    report: Comlink.Remote<((step: number) => void) & Comlink.ProxyMarked>,
  ) {
    try {
      if (
        typeof total !== 'number' ||
        !Number.isInteger(total) ||
        total < 1 ||
        total > MAX_PROGRESS_STEPS
      )
        throw new RangeError('Expected 1..20 progress steps')
      for (let step = 1; step <= total; step++) {
        await new Promise((resolve) => setTimeout(resolve, 90))
        await report(step)
      }
      return total
    } finally {
      report[Comlink.releaseProxy]()
    }
  },
}
export type WorkerAPI = typeof api
