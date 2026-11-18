import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Group, Panel, Separator } from 'react-resizable-panels'

// Real SDK SSR only: effects, geometry, events and callback timing require a browser.
test('actual v4 Group/Panel/Separator SSR preserves percentage defaults and accessible splitters', () => {
  let callbacks = 0
  const html = renderToStaticMarkup(
    h(
      Group,
      { id: 'sdk-group', orientation: 'horizontal', onLayoutChanged: () => callbacks++ },
      h(Panel, { id: 'explorer', defaultSize: '35%', minSize: '16%', maxSize: '60%' }, 'Resources'),
      h(Separator, { id: 'split-one', 'aria-label': 'Resize resources' }),
      h(Panel, { id: 'main', defaultSize: '65%', minSize: '22%' }, 'Preview'),
    ),
  )
  assert.equal(typeof document, 'undefined')
  assert.equal(callbacks, 0, 'SSR does not execute the mount callback')
  assert.match(html, /data-group="true"[^>]*id="sdk-group"[^>]*flex-direction:row/)
  assert.equal((html.match(/data-panel="true"/g) ?? []).length, 2)
  assert.match(html, /id="explorer"[^>]*flex-basis:35%/)
  assert.match(html, /id="main"[^>]*flex-basis:65%/)
  const separator = html.match(/<div[^>]*role="separator"[^>]*>/)?.[0]
  assert.ok(separator)
  assert.match(separator, /aria-label="Resize resources"/)
  assert.match(separator, /aria-orientation="vertical"/)
  assert.match(separator, /tabindex="0"/)
  assert.match(separator, /touch-action:none/)
  assert.doesNotMatch(separator, /aria-valuenow/, 'measured ARIA values are client-only')
})

test('actual v4 vertical three-panel SSR uses horizontal separators and numeric props as pixels', () => {
  const html = renderToStaticMarkup(
    h(
      Group,
      { id: 'vertical-group', orientation: 'vertical' },
      h(Panel, { id: 'pixel-panel', defaultSize: 80 }, 'Pixel default'),
      h(Separator, { id: 'vertical-one', 'aria-label': 'Resize first boundary' }),
      h(Panel, { id: 'percent-panel', defaultSize: '45%' }, 'Percent default'),
      h(Separator, { id: 'vertical-two', 'aria-label': 'Resize second boundary' }),
      h(Panel, { id: 'last-panel', defaultSize: '30%' }, 'Inspector'),
    ),
  )
  assert.match(html, /id="vertical-group"[^>]*flex-direction:column/)
  assert.equal((html.match(/data-panel="true"/g) ?? []).length, 3)
  assert.equal((html.match(/role="separator"/g) ?? []).length, 2)
  assert.equal((html.match(/aria-orientation="horizontal"/g) ?? []).length, 2)
  assert.match(html, /id="pixel-panel"[^>]*flex-basis:80px/)
  assert.match(html, /id="percent-panel"[^>]*flex-basis:45%/)
  // These are actual initial HTML styles, not a claim about client constraint solving.
})
