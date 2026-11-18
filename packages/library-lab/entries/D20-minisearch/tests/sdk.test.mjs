import assert from 'node:assert/strict'
import test from 'node:test'
import { buildMiniIndex, initialDocs, updateFirstDocument } from '../examples/runtime.mjs'
import { scopeSearchDocuments } from '../examples/scope-policy.mjs'

test('actual UI index scores title boost higher and supports prefix and optional fuzzy', () => {
  const docs = [
    { id: 'title', title: 'nebula', summary: 'plain', group: '技术' },
    { id: 'body', title: 'plain', summary: 'nebula', group: '技术' },
  ]
  const index = buildMiniIndex(docs)
  const hits = index.search('nebula', { fuzzy: false, prefix: false })
  assert.equal(hits[0].id, 'title')
  assert.ok(hits[0].score > hits[1].score)
  assert.equal(index.search('nebu', { prefix: true, fuzzy: false }).length, 2)
  assert.equal(index.search('nebxla', { prefix: false, fuzzy: false }).length, 0)
  assert.equal(index.search('nebxla', { prefix: false, fuzzy: 0.2 }).length, 2)
})
test('actual UI scoped index drives both search and autoSuggest', () => {
  const scoped = scopeSearchDocuments(initialDocs, '技术'),
    index = buildMiniIndex(scoped)
  assert.ok(index.search('React').length)
  assert.equal(index.search('Node', { fuzzy: false }).length, 0)
  assert.equal(index.autoSuggest('Node', { fuzzy: false }).length, 0)
  assert.ok(buildMiniIndex(initialDocs).autoSuggest('Nod', { fuzzy: false, prefix: true }).length)
  assert.ok(index.search('React').every((hit) => scoped.some((doc) => doc.id === hit.id)))
})
test('actual immutable update rebuild removes old tokens and indexes new text', () => {
  const old = buildMiniIndex(initialDocs),
    updated = updateFirstDocument(initialDocs),
    next = buildMiniIndex(updated)
  assert.notEqual(updated, initialDocs)
  assert.equal(initialDocs[0].title, 'React Suspense patterns')
  assert.ok(old.search('Suspense', { fuzzy: false, prefix: false }).some((hit) => hit.id === '1'))
  assert.equal(next.search('Suspense', { fuzzy: false, prefix: false }).length, 0)
  assert.ok(next.search('Streaming', { fuzzy: false }).some((hit) => hit.id === '1'))
  assert.equal(old.search('Streaming', { fuzzy: false }).length, 0)
})
test('default tokenizer does not segment continuous Chinese into semantic words', () => {
  const index = buildMiniIndex([{ id: 'cn', title: '中文全文搜索', summary: '', group: '技术' }])
  assert.equal(index.search('全文', { fuzzy: false, prefix: false }).length, 0)
  assert.equal(index.search('中文全文搜索', { fuzzy: false, prefix: false }).length, 1)
})
