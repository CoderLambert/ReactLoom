import assert from 'node:assert/strict'
import test from 'node:test'
import {
  elementScroll,
  observeElementOffset,
  observeElementRect,
  useVirtualizer,
  Virtualizer,
} from '@tanstack/react-virtual'
import React, { useRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createVirtualOptions, makeArticles } from '../examples/virtual-contract.ts'

function SsrProbe() {
  const ref = useRef(null)
  const options = createVirtualOptions(makeArticles(400))
  const virtualizer = useVirtualizer({
    ...options,
    getScrollElement: () => ref.current,
    useFlushSync: false,
  })
  return React.createElement(
    'div',
    {
      'data-count': virtualizer.options.count,
      'data-dom-rows': virtualizer.getVirtualItems().length,
    },
    String(virtualizer.getTotalSize()),
  )
}
test('actual React adapter SSR initializes shared options without a browser viewport', () => {
  assert.equal(
    renderToStaticMarkup(React.createElement(SsrProbe)),
    '<div data-count="400" data-dom-rows="0">37600</div>',
  )
  assert.equal(typeof document, 'undefined')
})
function model(items) {
  return new Virtualizer({
    ...createVirtualOptions(items),
    getScrollElement: () => null,
    observeElementRect,
    observeElementOffset,
    scrollToFn: elementScroll,
    initialRect: { width: 640, height: 200 },
  })
}
test('actual public core model computes estimated range and total from initialRect and shared keys', () => {
  const rows = makeArticles(20)
  const instance = model(rows)
  const virtual = instance.getVirtualItems()
  assert.equal(instance.getTotalSize(), 1880)
  assert.deepEqual(instance.range, { startIndex: 0, endIndex: 2 })
  assert.deepEqual(
    virtual.map((item) => item.key),
    rows.slice(0, 8).map((row) => row.id),
  )
  assert.equal(virtual[0].size, 94)
  assert.equal(virtual[7].start, 7 * 94)
  // initialRect is supplied model input; no element, observer or DOM measurement ran.
})
test('actual resizeItem cache follows business keys on reorder and public measure clears it', () => {
  const rows = makeArticles(20)
  const instance = model(rows)
  instance.getVirtualItems()
  instance.resizeItem(0, 152)
  assert.equal(instance.getVirtualItems()[0].size, 152)
  assert.equal(instance.getTotalSize(), 1938)
  instance.setOptions({ ...instance.options, ...createVirtualOptions([...rows].reverse()) })
  assert.equal(instance.getVirtualItems()[0].key, 'rss-20')
  assert.equal(instance.getVirtualItems()[0].size, 94)
  assert.equal(instance.getTotalSize(), 1938) // rss-1 keeps its size at its new index.
  instance.resizeItem(0, 100)
  assert.equal(instance.getVirtualItems()[0].size, 100)
  assert.equal(instance.getTotalSize(), 1944)
  instance.measure()
  assert.equal(instance.getVirtualItems()[0].size, 94)
  assert.equal(instance.getTotalSize(), 1880)
  // No measureElement, fake DOM/ResizeObserver, mount-private API or scroll receipt.
})
