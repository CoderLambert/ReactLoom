import assert from 'node:assert/strict'
import test from 'node:test'
import { AnimatePresence, MotionConfig, motion, useIsPresent } from 'motion/react'
import { forwardRef, createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// Modern Motion14.6.0 only. No legacy react-motion import or claim of browser animation.
test('actual modern Motion SSR respects AnimatePresence initial=false and numeric animate targets', () => {
  const html = renderToStaticMarkup(
    h(
      MotionConfig,
      { reducedMotion: 'never' },
      h(
        AnimatePresence,
        { initial: false },
        h(
          motion.div,
          {
            key: 'details',
            id: 'modern-details',
            initial: { opacity: 0, y: -12 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -12 },
          },
          'Modern content',
        ),
      ),
    ),
  )
  assert.equal(typeof document, 'undefined')
  assert.match(html, /id="modern-details"/)
  assert.match(html, /opacity:1/)
  assert.doesNotMatch(html, /opacity:0|translateY\(-12px\)/)
  assert.match(html, /Modern content/)
})

test('actual modern popLayout supports a forwarded-ref child and public presence hook in SSR', () => {
  const Row = forwardRef(function Row(_, ref) {
    const present = useIsPresent()
    return h(
      motion.li,
      { ref, layout: true, 'data-present': present, exit: { opacity: 0 }, inert: !present },
      h('button', { type: 'button', disabled: !present }, 'Select task'),
    )
  })
  const html = renderToStaticMarkup(
    h(
      'ul',
      null,
      h(AnimatePresence, { mode: 'popLayout', initial: false }, h(Row, { key: 'stable-id' })),
    ),
  )
  assert.match(html, /<li[^>]*data-present="true"/)
  assert.match(html, /<button type="button">Select task<\/button>/)
  assert.doesNotMatch(html, /\sinert=|\sdisabled=/)
  // SSR never renders an exiting child or runs PopChild measurement, focus, RAF or media listeners.
})
