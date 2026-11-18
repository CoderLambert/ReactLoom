import { createElement } from 'react'

export function trustedDocumentationUrl(value) {
  try {
    const url = new URL(value)
    return url.origin === 'https://streamdown.ai' && !url.username && !url.password ? url.href : ''
  } catch {
    return ''
  }
}

function DocumentationLink({ href, children }) {
  const trusted = trustedDocumentationUrl(href)
  return trusted
    ? createElement('a', { href: trusted, target: '_blank', rel: 'noopener noreferrer' }, children)
    : createElement('span', { className: 'e11-blocked-link' }, children, '（链接已阻止）')
}

function ImagePlaceholder({ alt }) {
  return createElement(
    'span',
    { className: 'e11-blocked-image' },
    `图片已阻止：${alt || '无替代文本'}`,
  )
}

// Keep Streamdown's default remark/rehype pipeline. This is application policy,
// not a claim that the library's defaults restrict links to this one origin.
export const markdownPolicy = {
  skipHtml: true,
  controls: false,
  urlTransform: trustedDocumentationUrl,
  components: { a: DocumentationLink, img: ImagePlaceholder },
}
