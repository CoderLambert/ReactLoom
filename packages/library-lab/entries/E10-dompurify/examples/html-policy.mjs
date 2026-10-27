// A fixed vocabulary, not DOMPurify's broad default HTML profile.
// Do not combine USE_PROFILES with ALLOWED_TAGS (profiles take precedence).
// External links are HTTPS-only and exclude credential-bearing authorities.
export const htmlPolicy = {
  ALLOWED_TAGS: ['section', 'h3', 'h4', 'p', 'strong', 'em', 'b', 'i', 'br',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a'],
  ALLOWED_ATTR: ['href', 'title'],
  ALLOWED_URI_REGEXP: /^https:\/\/[a-z0-9.-]+(?::\d{1,5})?(?:[/?#]|$)/i,
};
