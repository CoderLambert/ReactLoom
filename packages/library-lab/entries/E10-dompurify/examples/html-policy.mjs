// A fixed vocabulary, not DOMPurify's broad default HTML profile.
// Do not combine USE_PROFILES with ALLOWED_TAGS (profiles take precedence).
// URI regex is an HTTPS authority prefix test, NOT full URL/host validation.
export const htmlPolicy = {
  ALLOWED_TAGS: [
    'section',
    'h3',
    'h4',
    'p',
    'strong',
    'em',
    'b',
    'i',
    'br',
    'ul',
    'ol',
    'li',
    'blockquote',
    'code',
    'pre',
    'a',
  ],
  ALLOWED_ATTR: ['href', 'title'],
  // DOMPurify defaults these to true even with ALLOWED_ATTR. Be explicitly narrower.
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: false,
  ALLOWED_URI_REGEXP: /^https:\/\/[a-z0-9.-]+(?::\d{1,5})?(?:[/?#]|$)/i,
}
