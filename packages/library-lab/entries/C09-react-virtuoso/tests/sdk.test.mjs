import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Virtuoso } from 'react-virtuoso'

const data = [
  { id: 'rss-a', title: 'first' },
  { id: 'rss-b', title: 'second' },
  { id: 'rss-c', title: 'third' },
]
function render(firstItemIndex = 0) {
  return renderToStaticMarkup(
    React.createElement(Virtuoso, {
      data,
      initialItemCount: 2,
      firstItemIndex,
      computeItemKey: (_index, item) => item.id,
      itemContent: (index, item) =>
        React.createElement('article', { 'data-article-id': item.id }, `${index}:${item.title}`),
      style: { height: 240 },
    }),
  )
}

test('real Virtuoso SSR initialItemCount renders two actual data rows, not the full array', () => {
  const html = render()
  assert.equal((html.match(/<article /gu) ?? []).length, 2)
  assert.match(html, /data-article-id="rss-a">0:first/u)
  assert.match(html, /data-article-id="rss-b">1:second/u)
  assert.doesNotMatch(html, /rss-c|third/u)
  assert.match(html, /data-virtuoso-scroller="true"/u)
})

test('real Virtuoso SSR offsets logical indices with firstItemIndex while retaining data IDs', () => {
  const html = render(1000)
  assert.match(html, /data-item-index="1000"/u)
  assert.match(html, /data-item-index="1001"/u)
  assert.match(html, /data-article-id="rss-a">1000:first/u)
  assert.match(html, /data-article-id="rss-b">1001:second/u)
  // SSR proves these supported inputs and actual rows, not scrolling, ResizeObserver or prepend anchoring.
})
