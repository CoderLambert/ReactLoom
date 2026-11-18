import assert from 'node:assert/strict'
import test from 'node:test'
import { Checkbox } from '@base-ui/react/checkbox'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// Actual SDK + React SSR, without a DOM substitute. Browser keyboard/FormData remain separate.
const render = (props) =>
  renderToStaticMarkup(
    h(
      'label',
      null,
      h(Checkbox.Root, props, h(Checkbox.Indicator, { 'aria-hidden': true }, '✓')),
      'Permission',
    ),
  )
const inputs = (html) => html.match(/<input\b[^>]*>/g) ?? []

test('actual Base UI SSR separates mixed ARIA from the hidden native checkbox checked value', () => {
  const html = render({ checked: false, indeterminate: true, name: 'permissions', value: 'read' })
  assert.equal(typeof document, 'undefined')
  assert.match(html, /<span[^>]*role="checkbox"[^>]*aria-checked="mixed"/)
  assert.match(html, /data-indeterminate=""/)
  assert.equal(inputs(html).length, 1)
  assert.match(inputs(html)[0], /type="checkbox"/)
  assert.match(inputs(html)[0], /name="permissions"/)
  assert.match(inputs(html)[0], /value="read"/)
  assert.match(inputs(html)[0], /tabindex="-1"/)
  assert.doesNotMatch(inputs(html)[0], /\schecked(?:=|\s|>)/)
  // indeterminate is set as a DOM property by the SDK layout effect, not an HTML attribute.
  assert.doesNotMatch(inputs(html)[0], /\sindeterminate(?:=|\s|>)/)
})

test('actual Base UI SSR forwards checked and disabled to its real form input', () => {
  const html = render({
    checked: true,
    disabled: true,
    name: 'permissions',
    value: 'manage',
    id: 'manage-control',
  })
  assert.match(html, /aria-checked="true"/)
  assert.match(html, /data-disabled=""/)
  const input = inputs(html)[0]
  assert.match(input, /id="manage-control"/)
  assert.match(input, /value="manage"/)
  assert.match(input, /\schecked=""/)
  assert.match(input, /\sdisabled=""/)
  // This proves SDK markup, not browser successful-control exclusion or user interaction.
})
