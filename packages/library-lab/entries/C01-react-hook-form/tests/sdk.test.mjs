import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createFormControl, useFieldArray, useForm } from 'react-hook-form'
import { canonicalFeedUrl } from '../examples/feed-url-policy.mjs'

test('real RHF registers an array field through its public hooks', () => {
  function Fixture() {
    const { control, register } = useForm({
      defaultValues: { group: '技术', sources: [{ name: '前端', url: 'https://example.com/rss' }] },
    })
    const { fields } = useFieldArray({ control, name: 'sources' })
    assert.equal(fields.length, 1)
    assert.equal(typeof fields[0].id, 'string')
    return React.createElement(
      'form',
      null,
      fields.map((row, index) =>
        React.createElement('input', { key: row.id, ...register(`sources.${index}.url`) }),
      ),
    )
  }
  const markup = renderToStaticMarkup(React.createElement(Fixture))
  assert.match(markup, /name="sources\.0\.url"/)
})

test('real RHF validates registered nested values before calling the valid submit handler', async () => {
  const form = createFormControl({
    defaultValues: { group: '', sources: [{ name: '前端', url: 'http://example.com/rss' }] },
  })
  form.register('group', { required: '请输入分组名' })
  form.register('sources.0.url', {
    validate: (value) => canonicalFeedUrl(value) !== null || '仅支持 HTTPS',
  })
  let submitted = null
  let invalidCalls = 0
  const submit = form.handleSubmit(
    (value) => {
      submitted = value
    },
    () => {
      invalidCalls++
    },
  )
  await submit()
  assert.equal(submitted, null)
  assert.equal(invalidCalls, 1)
  assert.equal(form.getFieldState('group').error.message, '请输入分组名')
  assert.equal(form.getFieldState('sources.0.url').error.message, '仅支持 HTTPS')
  form.setValue('group', '技术')
  form.setValue('sources.0.url', 'https://example.com/rss')
  await submit()
  assert.deepEqual(submitted, {
    group: '技术',
    sources: [{ name: '前端', url: 'https://example.com/rss' }],
  })
})

test('real RHF exposes a mapped server field error and resets to its default nested values', () => {
  const defaults = { group: '技术', sources: [{ name: '前端', url: 'https://example.com/rss' }] }
  const form = createFormControl({ defaultValues: defaults })
  form.register('sources.0.url')
  form.setError('sources.0.url', { type: 'server', message: '本地 409 fixture' })
  assert.equal(form.getFieldState('sources.0.url').invalid, true)
  assert.equal(form.getFieldState('sources.0.url').error.message, '本地 409 fixture')
  form.clearErrors('sources.0.url')
  assert.equal(form.getFieldState('sources.0.url').invalid, false)
  form.setValue('sources.0.url', 'https://example.com/edited')
  form.reset()
  assert.deepEqual(form.getValues(), defaults)
})
