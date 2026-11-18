import assert from 'node:assert/strict'
import test from 'node:test'
import { parseAsInteger, parseAsString } from 'nuqs/server'

test('nuqs real integer parser accepts and rejects URL input', () => {
  assert.equal(parseAsInteger.parse('7'), 7)
  assert.equal(parseAsInteger.parse('broken'), null)
})
test('nuqs real parsers preserve URL string semantics', () => {
  assert.equal(parseAsString.parse('你好'), '你好')
  assert.equal(parseAsString.parse(''), '')
})
test('nuqs real integer serialization is stable', () => {
  assert.equal(parseAsInteger.serialize(23), '23')
})

import { deriveSearchView } from '../examples/url-policy.mjs'

test('real nuqs server parser feeds safely clamped URL view', () => {
  const page = parseAsInteger.parse('9007199254740993')
  const view = deriveSearchView({ level: 'advanced', query: 'React', group: 'tech', page }, [
    { id: 'rss', name: 'React', group: 'tech' },
  ])
  assert.equal(view.safePage, 1)
  assert.equal(view.pageItems[0].id, 'rss')
})

import { loadQuery, serializeQuery } from '../examples/query-contract.mjs'

test('page-shared actual nuqs loader applies defaults while preserving parser leniency for the business layer', () => {
  assert.deepEqual(loadQuery('?tab=demo'), { query: '', page: 1, group: 'all' })
  assert.equal(loadQuery('?ll_c19_page=broken').page, 1)
  assert.equal(loadQuery('?ll_c19_page=2tail').page, 2)
  const raw = loadQuery('?ll_c19_q=React&ll_c19_group=unknown&ll_c19_page=-3')
  assert.equal(raw.page, -3)
  assert.equal(raw.group, 'unknown')
  const view = deriveSearchView({ level: 'business', ...raw }, [
    { id: 'one', name: 'React', group: 'tech' },
  ])
  assert.equal(view.safeGroup, 'all')
  assert.equal(view.safePage, 1)
  assert.equal(view.matches.length, 1)
})
test('page-shared actual nuqs serializer/loader roundtrip mapped keys and preserve host parameters/hash', () => {
  const base = 'https://fixture.invalid/libraries/nuqs?tab=demo&example=advanced&keep=stable#anchor'
  const encoded = serializeQuery(base, { query: 'React 新闻', page: 2, group: 'tech' })
  const url = new URL(encoded)
  assert.deepEqual(loadQuery(url), { query: 'React 新闻', page: 2, group: 'tech' })
  assert.equal(url.searchParams.get('tab'), 'demo')
  assert.equal(url.searchParams.get('example'), 'advanced')
  assert.equal(url.searchParams.get('keep'), 'stable')
  assert.equal(url.hash, '#anchor')
  const cleared = new URL(serializeQuery(encoded, { query: null, page: null, group: null }))
  for (const name of ['ll_c19_q', 'll_c19_page', 'll_c19_group'])
    assert.equal(cleared.searchParams.has(name), false)
  assert.equal(cleared.searchParams.get('keep'), 'stable')
  assert.equal(cleared.hash, '#anchor')
})
