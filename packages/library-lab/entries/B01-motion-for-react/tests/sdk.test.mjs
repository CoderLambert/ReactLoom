import assert from 'node:assert/strict'
import test from 'node:test'
import { AnimatePresence, MotionConfig, motion, useIsPresent, usePresenceData } from 'motion/react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// Real React SSR + Motion components/context. No DOM, RAF, fake Motion or browser animation proof.
function Probe({ id }) {
  const present = useIsPresent()
  const reduced = Boolean(usePresenceData())
  return createElement(
    motion.li,
    {
      'data-card-id': id,
      'data-present': present,
      'data-reduced': reduced,
      layout: !reduced,
      initial: reduced ? false : { opacity: 0, y: 14 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: reduced ? 0 : -10 },
      transition: { duration: reduced ? 0 : 0.24 },
    },
    `card ${id}`,
  )
}
function render(reduced) {
  return renderToStaticMarkup(
    createElement(
      MotionConfig,
      { reducedMotion: 'never' },
      createElement(
        'ul',
        null,
        createElement(
          AnimatePresence,
          { initial: false, custom: reduced },
          [1, 2].map((id) => createElement(Probe, { key: id, id })),
        ),
      ),
    ),
  )
}
test('actual Motion SSR presence contexts keep initial=false at the visible target', () => {
  const html = render(false)
  assert.equal(typeof document, 'undefined')
  assert.equal((html.match(/data-present="true"/g) ?? []).length, 2)
  assert.match(html, /data-card-id="1"/)
  assert.match(html, /data-card-id="2"/)
  assert.equal((html.match(/opacity:1/g) ?? []).length, 2)
  assert.doesNotMatch(html, /translateY\(14|layout=|animate=|initial=/)
  console.log('Actual Motion SSR:', html)
})
test('actual presence custom reaches children for the explicit reduced visual policy', () => {
  const html = render(true)
  assert.equal((html.match(/data-reduced="true"/g) ?? []).length, 2)
  assert.equal((html.match(/opacity:1/g) ?? []).length, 2)
  assert.doesNotMatch(html, /translateY\(14|layout=|exit=|transition=/)
})
