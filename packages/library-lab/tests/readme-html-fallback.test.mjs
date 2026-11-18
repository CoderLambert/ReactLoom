import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Markdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import { rehypeReadmeHtmlFallback } from '../src/lib/readme-html-fallback.mjs'

function render(source, readme = true) {
  return renderToStaticMarkup(
    createElement(
      Markdown,
      {
        remarkPlugins: [remarkGfm],
        rehypePlugins: readme
          ? [[rehypeReadmeHtmlFallback, { source }], rehypeSanitize]
          : [rehypeSanitize],
        skipHtml: true,
      },
      source,
    ),
  )
}

test('actual HTML-only Embla README stays readable as escaped original text', async () => {
  const original = await readFile(
    new URL('../entries/B19-embla-carousel/official/readme.md', import.meta.url),
    'utf8',
  )
  const html = render(original)
  assert.match(html, /<pre><code class="language-html">/u)
  assert.match(html, /Embla Carousel React/u)
  assert.match(html, /&lt;div align=/u)
  assert.doesNotMatch(html, /<img\b|<iframe\b|<script\b/iu)
})

test('HTML-only executable tags and handlers become literal source, never active elements', () => {
  const source =
    '<script>globalThis.unsafeReadme = true</script>\n\n<img src="https://untrusted.invalid/pixel" onerror="alert(1)">\n\n<iframe src="https://untrusted.invalid/frame"></iframe>\n'
  const html = render(source)
  assert.match(html, /&lt;script&gt;/u)
  assert.match(html, /onerror=/u) // Preserved as source text, not an attribute.
  assert.doesNotMatch(html, /<(?:script|img|iframe)\b/iu)
  assert.match(html, /<pre><code/u)
})

test('ordinary and mixed Markdown retain their existing sanitize-and-skip policy', () => {
  const source =
    '# Plain title\n\nA **real** paragraph.\n\n<div onclick="alert(1)">Hidden HTML</div>\n'
  assert.equal(render(source), render(source, false))
  assert.match(render(source), /<h1>Plain title<\/h1>/u)
  assert.doesNotMatch(render(source), /Hidden HTML|onclick/u)
})

test('code fences are ordinary Markdown and are never rewrapped as the entire source', () => {
  const source = '```html\n<script>alert(1)</script>\n```\n'
  assert.equal(render(source), render(source, false))
  assert.match(render(source), /&lt;script&gt;/u)
})

test('the guide path still drops HTML-only material rather than enabling the README fallback', () => {
  const source = '<div>HTML-only guide text</div>\n'
  assert.equal(render(source, false).trim(), '')
  assert.match(render(source), /HTML-only guide text/u)
})

test('whitespace-only documents do not become empty code blocks', () => {
  assert.equal(render(' \n\n').trim(), '')
})
