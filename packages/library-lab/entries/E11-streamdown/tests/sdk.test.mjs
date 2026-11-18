import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Streamdown } from 'streamdown'
import { fixtures } from '../examples/fixtures.mjs'
import { markdownPolicy } from '../examples/markdown-policy.mjs'

function render(markdown, extra = {}) {
  return renderToStaticMarkup(
    createElement(Streamdown, { ...markdownPolicy, mode: 'streaming', ...extra }, markdown),
  )
}

test('real Streamdown repairs an incomplete emphasis without modifying source', () => {
  const markdown = fixtures.basic.chunks.slice(0, 2).join('')
  assert.match(render(markdown), /data-streamdown="strong">流式<\/span>/)
  assert.doesNotMatch(
    render(markdown, { parseIncompleteMarkdown: false }),
    /data-streamdown="strong"/,
  )
  assert.ok(markdown.endsWith('**流式'))
})

test('real Streamdown renders an incomplete fenced code block as code', () => {
  const markdown = fixtures.basic.chunks.slice(0, 6).join('')
  assert.match(render(markdown), /<pre\b/)
  assert.match(render(markdown), /const result =/)
  assert.match(render(markdown), /累计全文/)
})

test('real Streamdown renders GFM table and task list with the shared application policy', () => {
  const html = render(fixtures.business.chunks.join(''))
  assert.match(html, /<table\b/)
  assert.match(html, /<td[^>]*>React<\/td>/)
  assert.equal((html.match(/type="checkbox"/g) || []).length, 2)
  assert.equal((html.match(/disabled=""/g) || []).length, 2)
  assert.match(html, /href="https:\/\/streamdown.ai\/docs"/)
  assert.doesNotMatch(html, /href="[^"]*(?:example.com|javascript:)/)
  assert.doesNotMatch(html, /<(?:img|script)\b/)
  assert.match(html, /图片已阻止：远程图片/)
  assert.match(html, /未知外站（链接已阻止）/)
})
