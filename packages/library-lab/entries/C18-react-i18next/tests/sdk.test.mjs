import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getI18n, I18nextProvider, Trans, useTranslation } from 'react-i18next'
import { SafeEmphasis } from '../examples/safe-emphasis.mjs'
import { createWorkspace } from '../examples/workspace.mjs'

const flush = () => new Promise((resolve) => setImmediate(resolve))
function Greeting({ name = 'Ada' }) {
  const { t, ready } = useTranslation(['common', 'feed'], { useSuspense: false })
  assert.equal(ready, true)
  return React.createElement(
    'div',
    null,
    React.createElement('p', null, t('common:greeting', { name })),
    React.createElement('p', null, t('feed:unread', { count: 1 })),
    React.createElement(Trans, {
      ns: 'common',
      i18nKey: 'legal',
      components: { strong: React.createElement(SafeEmphasis) },
    }),
  )
}
const render = (workspace, name) =>
  renderToStaticMarkup(
    React.createElement(
      I18nextProvider,
      { i18n: workspace.instance, defaultNS: 'common' },
      React.createElement(Greeting, { name }),
    ),
  )

test('actual React provider creates separate localized SSR trees without changing the default singleton', async () => {
  const previous = getI18n()
  const a = createWorkspace('zh')
  const b = createWorkspace('en')
  try {
    await Promise.all([a.start(), b.start()])
    assert.notEqual(a.instance, b.instance)
    assert.match(render(a), /你好/)
    assert.match(render(b), /Hello/)
    await a.instance.changeLanguage('en')
    await b.instance.changeLanguage('zh')
    assert.match(render(a), /Hello/)
    assert.match(render(b), /你好/)
    a.instance.addResource('en', 'common', 'title', 'A only')
    assert.equal(b.instance.getResource('en', 'common', 'title'), 'Subscription preferences')
    assert.equal(getI18n(), previous)
  } finally {
    a.dispose()
    b.dispose()
  }
})

test('actual Trans maps the source-owned strong component and React escapes user text once', async () => {
  const workspace = createWorkspace('en')
  try {
    await workspace.start()
    workspace.instance.addResource(
      'en',
      'common',
      'legal',
      'Read <strong title="overridden">notice</strong> <img src="untrusted">',
    )
    const markup = render(workspace, 'Ada <img src=x> & B')
    assert.match(markup, /<strong data-testid="c18-emphasis">notice<\/strong>/)
    assert.doesNotMatch(markup, /title="overridden"|<img\b|<script\b/)
    assert.match(markup, /Ada &lt;img src=x&gt; &amp; B/)
    assert.doesNotMatch(markup, /Ada &amp;lt;/)
  } finally {
    workspace.dispose()
  }
})

test('actual stable workspace serializes changes across language events and commits the latest intent', async () => {
  const workspace = createWorkspace('zh')
  try {
    await workspace.start()
    workspace.setManual(true)
    workspace.request('en')
    workspace.request('zh')
    assert.equal(workspace.snapshot().activeTarget, 'en')
    assert.equal(workspace.snapshot().actual, 'zh')
    assert.equal(workspace.snapshot().requested, 'zh')
    workspace.release()
    await flush()
    assert.equal(workspace.snapshot().actual, 'en') // SDK may publish the first intermediate language.
    assert.equal(workspace.snapshot().activeTarget, 'zh')
    assert.equal(workspace.snapshot().awaitingRelease, true)
    assert.equal(workspace.snapshot().status, 'switching')
    assert.equal(workspace.snapshot().committed, 'zh')
    assert.match(render(workspace), /Hello/)
    workspace.release()
    await flush()
    assert.equal(workspace.snapshot().actual, 'zh')
    assert.equal(workspace.snapshot().requested, 'zh')
    assert.equal(workspace.snapshot().status, 'ready')
    assert.match(render(workspace), /你好/)
  } finally {
    workspace.dispose()
  }
})

test('local gate rejection leaves actual SDK language intact and a later real request recovers independently', async () => {
  const a = createWorkspace('zh')
  const b = createWorkspace('en')
  try {
    await Promise.all([a.start(), b.start()])
    a.setManual(true)
    a.request('en')
    a.reject()
    await flush()
    assert.equal(a.snapshot().status, 'error')
    assert.match(a.snapshot().error, /本地 fixture 拒绝/)
    assert.equal(a.instance.language, 'zh')
    assert.equal(b.instance.language, 'en')
    a.request('en')
    a.setManual(false) // Turning the local gate off also releases the already-held request.
    await flush()
    assert.equal(a.snapshot().status, 'ready')
    assert.equal(a.instance.language, 'en')
    assert.equal(a.snapshot().error, '')
  } finally {
    a.dispose()
    b.dispose()
  }
})

test('disposing a held real workspace discards its pending intent and suppresses later publications', async () => {
  const publications = []
  const workspace = createWorkspace('zh', (view) => publications.push(view))
  await workspace.start()
  workspace.setManual(true)
  workspace.request('en')
  workspace.request('zh')
  workspace.dispose()
  const count = publications.length
  workspace.release()
  workspace.request('en')
  await flush()
  assert.equal(workspace.instance.language, 'zh')
  assert.equal(publications.length, count)
  // This is a discarded private instance; an external SDK call is real but no app observer publishes.
  await workspace.instance.changeLanguage('en')
  assert.equal(publications.length, count)
})
