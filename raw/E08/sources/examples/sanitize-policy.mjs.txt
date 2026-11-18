import { rehype } from 'rehype'
import rehypeSanitize from 'rehype-sanitize'
import { assertHTMLBudget } from './input-policy.mjs'
// Exact schema shared by the React example and real SDK tests.
// Disable outbound links/media instead of relying on iframe CSP alone.
export const strictHtmlSchema = {
  tagNames: [
    'article',
    'h2',
    'h3',
    'h4',
    'p',
    'strong',
    'em',
    'b',
    'i',
    'ul',
    'ol',
    'li',
    'blockquote',
    'code',
    'pre',
    'br',
    'a',
  ],
  attributes: { a: ['title'] },
  protocols: { href: [] },
  required: {},
  strip: [
    'script',
    'style',
    'iframe',
    'form',
    'svg',
    'math',
    'object',
    'embed',
    'template',
    'textarea',
  ],
}

export const blockedCsp =
  "default-src 'none'; script-src 'none'; connect-src 'none'; img-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none';"
export function sanitizeHTML(input) {
  return String(rehype().use(rehypeSanitize, strictHtmlSchema).processSync(assertHTMLBudget(input)))
}
export function previewDocument(cleanHTML) {
  return (
    '<!doctype html><meta http-equiv="Content-Security-Policy" content="' +
    blockedCsp +
    '">' +
    cleanHTML
  )
}
