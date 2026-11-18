import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Markdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import { markdownComponents, safeMarkdownURL } from '../examples/render-policy.mjs'

// This suite imports the real SDKs and the exact component/URL policy used by example.tsx.
function render(source) {
  return renderToStaticMarkup(
    createElement(
      Markdown,
      {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSanitize],
        skipHtml: true,
        urlTransform: safeMarkdownURL,
        components: markdownComponents,
      },
      source,
    ),
  )
}
test('E06 real SDK: basic formatting and safe links', () => {
  const html = render('# Title\n\n**bold** [doc](https://example.com/doc)')
  assert.match(html, /<h1>Title<\/h1>/)
  assert.match(html, /<strong>bold<\/strong>/)
  assert.match(html, /href="https:\/\/example.com\/doc"/)
  assert.match(html, /rel="noopener noreferrer"/)
})
test('E06 real SDK: GFM business table', () => {
  const html = render('| Field | Status |\n| --- | --- |\n| Case | PASS |')
  assert.match(html, /<table>/)
  assert.match(html, /<td>PASS<\/td>/)
})
test('E06 real SDK: unsafe links, raw HTML and remote tracking image', () => {
  const html = render(
    '[bad](javascript:alert%281%29) <script>alert(1)</script>\n\n![track](https://example.com/track.png)\n\n[auth](https://name:secret@example.com/)',
  )
  assert.doesNotMatch(html, /<script|<img|javascript:|onerror=|src="https:\/\//i)
  assert.match(html, /图片外链被禁用/)
  assert.doesNotMatch(html, /href="https:\/\/name:secret@/)
})

test('E06 real SDK: GFM task list checkboxes are disabled and preserve checked state', () => {
  const html = render('- [x] reviewed\n- [ ] pending')
  assert.equal((html.match(/type="checkbox"/g) ?? []).length, 2)
  assert.equal((html.match(/disabled=""/g) ?? []).length, 2)
  assert.equal((html.match(/checked=""/g) ?? []).length, 1)
})
test('E06 real SDK: custom URL policy replaces default and rejects relative/mailto/data/backslash', () => {
  const html = render(
    '[mail](mailto:reader@example.com) [local](/private) [data](data:text/html,evil) [anchor](#section) [credential](https://name:secret@example.com/)',
  )
  assert.doesNotMatch(html, /href="(?:mailto:|\/private|data:|https:\/\/name:)/)
  assert.match(html, /href="#section"/)
  assert.equal(safeMarkdownURL('https:\\example.com\\path'), '')
})
test('E06 real SDK: sanitizer removes dangerous HAST added by a plugin before custom components', () => {
  function unsafePlugin() {
    return (tree) => {
      tree.children.push({
        type: 'element',
        tagName: 'script',
        properties: {},
        children: [{ type: 'text', value: 'bad()' }],
      })
    }
  }
  const html = renderToStaticMarkup(
    createElement(
      Markdown,
      {
        rehypePlugins: [unsafePlugin, rehypeSanitize],
        skipHtml: true,
        urlTransform: safeMarkdownURL,
        components: markdownComponents,
      },
      'safe',
    ),
  )
  assert.doesNotMatch(html, /<script|bad\(\)/)
  assert.match(html, /safe/)
})
