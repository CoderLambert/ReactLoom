import assert from 'node:assert/strict'
import test from 'node:test'
import {
  computePosition,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createPositionMiddleware } from '../examples/positioning.ts'

// This runs the real React SDK hooks during SSR. DOM positioning, Escape,
// IME and focus return must still pass the independent browser suite.
function FloatingFixture() {
  const { refs, floatingStyles, context, placement } = useFloating({
    open: true,
    onOpenChange: () => {},
    placement: 'bottom-start',
    middleware: createPositionMiddleware(),
  })
  const click = useClick(context)
  const dismiss = useDismiss(context, { escapeKey: true, outsidePress: true })
  const role = useRole(context, { role: 'dialog' })
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role])
  assert.equal(placement, 'bottom-start')
  return React.createElement(
    'section',
    null,
    React.createElement(
      'button',
      {
        ...getReferenceProps({ 'aria-label': 'Open article' }),
        type: 'button',
        ref: refs.setReference,
      },
      'Open article',
    ),
    React.createElement(
      'div',
      {
        ...getFloatingProps({ 'aria-label': 'Article actions' }),
        ref: refs.setFloating,
        style: floatingStyles,
      },
      'Article actions',
    ),
  )
}

test('B17 real Floating UI React hooks compose semantic reference and dialog props', () => {
  const markup = renderToStaticMarkup(React.createElement(FloatingFixture))
  assert.match(markup, /Open article/u)
  assert.match(markup, /Article actions/u)
  assert.match(markup, /role="dialog"/u)
  assert.match(markup, /aria-label="Article actions"/u)
})

// A public custom platform supplies deterministic geometry to the real SDK.
// This checks collision algorithms; it does not pretend Node has browser layout.
function geometryPlatform(reference) {
  return {
    getElementRects: async () => ({ reference, floating: { x: 0, y: 0, width: 180, height: 120 } }),
    getClippingRect: async () => ({ x: 0, y: 0, width: 400, height: 300 }),
    getDimensions: async () => ({ width: 180, height: 120 }),
    getOffsetParent: async () => null,
    getDocumentElement: () => ({}),
    isElement: () => false,
    isRTL: () => false,
    convertOffsetParentRelativeRectToViewportRelativeRect: async ({ rect }) => rect,
  }
}
test('actual SDK preserves requested placement with a 10px gap when geometry fits', async () => {
  const result = await computePosition(
    {},
    {},
    {
      placement: 'bottom-start',
      middleware: createPositionMiddleware(),
      platform: geometryPlatform({ x: 20, y: 20, width: 80, height: 30 }),
    },
  )
  assert.equal(result.placement, 'bottom-start')
  assert.equal(result.x, 20)
  assert.equal(result.y, 60)
  assert.equal(result.middlewareData.shift.x, 0)
})
test('actual SDK flips the overflowing side and shifts horizontally inside 12px padding', async () => {
  const result = await computePosition(
    {},
    {},
    {
      placement: 'bottom-start',
      middleware: createPositionMiddleware(),
      platform: geometryPlatform({ x: 300, y: 250, width: 80, height: 30 }),
    },
  )
  assert.equal(result.placement, 'top-start')
  assert.equal(result.x, 208)
  assert.equal(result.y, 120)
  assert.equal(result.middlewareData.shift.x, -92)
  assert.equal(result.middlewareData.shift.y, 0)
  assert.ok(result.x >= 12 && result.x + 180 <= 388)
  assert.ok(result.y >= 12 && result.y + 120 <= 288)
})
