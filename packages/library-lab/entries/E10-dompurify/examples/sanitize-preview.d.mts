import type { htmlPolicy } from './html-policy.mjs'
export declare const MAX_INPUT_UNITS: number
export declare function sanitizePreview(
  dirty: string,
  purifier: {
    isSupported?: boolean
    sanitize(source: string, policy: typeof htmlPolicy): string
  },
): { html: string; error: string }
