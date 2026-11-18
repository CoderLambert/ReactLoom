import assert from 'node:assert/strict'
import test from 'node:test'
import { convertToValidClassName, createAjv } from '@jsonforms/core'
import { JsonForms } from '@jsonforms/react'
import { vanillaCells, vanillaRenderers } from '@jsonforms/vanilla-renderers'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  subscriptionSchema,
  subscriptionUiSchema,
  toServerError,
} from '../examples/submission-policy.mjs'

const initial = {
  name: 'Weekly',
  feedType: 'rss',
  url: 'https://example.org/feed.xml',
  enabled: true,
}
const render = (data, extra = {}) =>
  renderToStaticMarkup(
    h(JsonForms, {
      schema: subscriptionSchema,
      uischema: subscriptionUiSchema,
      data,
      renderers: vanillaRenderers,
      cells: vanillaCells,
      ...extra,
    }),
  )
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Real JSON Forms/Vanilla SSR: initial markup only, no callback/DOM/IME simulation.
test('actual JSON Forms Vanilla labels real cells and HIDE marks its URL wrapper without deleting data', () => {
  const visible = render(initial)
  assert.equal(typeof document, 'undefined')
  assert.match(visible, /订阅名称/)
  assert.match(visible, /RSS 地址/)
  const labels = [...visible.matchAll(/<label\b[^>]*for="([^"]+)"/gu)]
  assert.equal(labels.length, 4)
  for (const [, id] of labels) assert.match(visible, new RegExp(`id="${escapeRegExp(id)}"`))
  assert.match(visible, /value="https:\/\/example.org\/feed.xml"/)
  const manual = { ...initial, feedType: 'manual' }
  const html = render(manual)
  const urlClass = escapeRegExp(convertToValidClassName('#/properties/url'))
  const opening = html.match(new RegExp(`<div\\b[^>]*class="[^"]*${urlClass}[^"]*"[^>]*>`))?.[0]
  assert.ok(opening, 'SDK owns the URL wrapper')
  assert.match(opening, /\shidden=""/)
  assert.equal(manual.url, initial.url)
})

test('actual JSON Forms Ajv validates the same conditional subscription schema', () => {
  const validate = createAjv().compile(subscriptionSchema)
  assert.equal(validate({ ...initial, feedType: 'manual', url: '' }), true)
  assert.equal(validate({ ...initial, url: 'http://invalid.test/rss' }), false)
  assert.equal(validate(initial), true)
  assert.equal(validate({ ...initial, name: '' }), false)
})

test('actual JSON Forms additionalErrors render even when normal validation is disabled', () => {
  const error = toServerError('name', '该订阅名已存在（本地服务fixture）')
  const html = render(initial, { validationMode: 'NoValidation', additionalErrors: [error] })
  assert.match(html, /该订阅名已存在（本地服务fixture）/)
  assert.equal(error.instancePath, '/name')
  // Does not prove dynamic clearing, callback timing or real browser error association.
})
