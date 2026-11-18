import type { MarkdownAudit } from './audit-policy.mjs'
export type Level = 'basic' | 'business' | 'advanced'
export declare const MAX_BYTES: number
export declare const MAX_UI_UNITS: number
export declare const samples: Record<Level, string>
export declare function transformMarkdown(source: string): {
  normalized: string
  audit: MarkdownAudit
}
