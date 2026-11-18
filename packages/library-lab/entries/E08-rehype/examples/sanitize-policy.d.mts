export declare const strictHtmlSchema: {
  tagNames: string[]
  attributes: { a: string[] }
  protocols: { href: string[] }
  required: Record<string, never>
  strip: string[]
}

export const blockedCsp: string
export function sanitizeHTML(input: string): string
export function previewDocument(cleanHTML: string): string
