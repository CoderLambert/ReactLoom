import assert from 'node:assert/strict'
import test from 'node:test'
import Fuse from 'fuse.js'
import { removeDocument, upsertDocument } from '../examples/index-lifecycle.mjs'
import { resolveScope, visibleDocuments } from '../examples/search-scope.mjs'

const rows = [
  { id: '1', title: 'React performance', group: '技术' },
  { id: '2', title: 'Market briefing', group: '商业' },
  { id: '3', title: 'GraphQL tutorial', group: '技术' },
]
test('actual Fuse.js indexes and returns identified ranked documents', () => {
  const fuse = new Fuse(rows, { includeScore: true, keys: ['title'], threshold: 0.35 })
  const matches = fuse.search('React')
  assert.equal(matches[0].item.id, '1')
  assert.ok(matches[0].score >= 0 && matches[0].score <= 1)
})
test('actual SDK honors result limit and has no implicit group permission filter', () => {
  const fuse = new Fuse(rows, { keys: ['title'], threshold: 0.8 })
  assert.ok(fuse.search('r', { limit: 1 }).length <= 1)
  const allHits = fuse.search('a')
  assert.ok(allHits.some((hit) => hit.item.group === '商业'))
  const scopedDocs = rows.filter((row) => row.group === '技术')
  const scopedFuse = new Fuse(scopedDocs, { keys: ['title'], threshold: 0.8 })
  const scopedHits = scopedFuse.search('a')
  assert.ok(scopedHits.length > 0)
  assert.ok(scopedHits.every((hit) => hit.item.group === '技术'))
  assert.ok(scopedHits.length < allHits.length)
})
test('setCollection explicitly replaces index rather than mutating caller array', () => {
  const fuse = new Fuse(rows, { keys: ['title'] })
  fuse.setCollection([{ id: '4', title: 'React Query', group: '技术' }])
  assert.deepEqual(
    fuse.search('React').map((row) => row.item.id),
    ['4'],
  )
  assert.equal(rows.length, 3)
})

test('real Fuse index reflects active mode instead of stale hidden options', () => {
  const scope = resolveScope({ level: 'basic', group: '商业', threshold: 0.55 })
  const fuse = new Fuse(visibleDocuments(rows, scope.group), {
    keys: ['title'],
    threshold: scope.threshold,
  })
  assert.equal(fuse.search('React')[0]?.item.id, '1')
  const narrowed = resolveScope({ level: 'business', group: '商业', threshold: 0.55 })
  const scopedFuse = new Fuse(visibleDocuments(rows, narrowed.group), {
    keys: ['title'],
    threshold: narrowed.threshold,
  })
  assert.equal(
    scopedFuse.search('React').some((hit) => hit.item.id === '1'),
    false,
  )
})
test('actual Fuse snapshot rebuild removes replaced and deleted indexed text', () => {
  const index = (docs) => new Fuse(docs, { keys: ['title'], threshold: 0.15 })
  const imported = { id: 'new', title: 'React Query imported', group: '技术' }
  const added = upsertDocument(rows, imported)
  assert.equal(index(added).search('React Query imported')[0]?.item.id, 'new')
  const replaced = upsertDocument(added, { id: 'new', title: 'TypeScript imported', group: '技术' })
  assert.equal(
    index(replaced)
      .search('React Query imported')
      .some((hit) => hit.item.id === 'new'),
    false,
  )
  assert.equal(index(replaced).search('TypeScript imported')[0]?.item.id, 'new')
  const deleted = removeDocument(replaced, 'new')
  assert.equal(
    index(deleted)
      .search('TypeScript imported')
      .some((hit) => hit.item.id === 'new'),
    false,
  )
  assert.equal(rows.length, 3)
})
test('real Fuse rebuild excludes a document moved out of selected category', () => {
  const before = upsertDocument(rows, { id: 'new', title: 'Zebra special', group: '技术' })
  const after = upsertDocument(before, { id: 'new', title: 'Zebra special', group: '商业' })
  const make = (docs) => new Fuse(visibleDocuments(docs, '技术'), { keys: ['title'], threshold: 0 })
  assert.equal(make(before).search('Zebra special')[0]?.item.id, 'new')
  assert.equal(
    make(after)
      .search('Zebra special')
      .some((hit) => hit.item.id === 'new'),
    false,
  )
})

test('actual UI index weights title above summary and tags with lower scores better', async () => {
  const { createArticleIndex } = await import('../examples/article-index.mjs')
  const docs = [
    { id: 'title', title: 'zebra', summary: 'other', tags: ['other'] },
    { id: 'summary', title: 'other', summary: 'zebra', tags: ['other'] },
    { id: 'tags', title: 'other', summary: 'other', tags: ['zebra'] },
  ]
  const hits = createArticleIndex(docs).search('zebra')
  assert.deepEqual(
    hits.map((hit) => hit.item.id),
    ['title', 'summary', 'tags'],
  )
  assert.ok(hits[0].score < hits[1].score && hits[1].score < hits[2].score)
  assert.ok(hits[0].matches.some((match) => match.key === 'title'))
})
test('actual UI options ignore location, narrow threshold and remove all replaced searchable text', async () => {
  const { createArticleIndex } = await import('../examples/article-index.mjs')
  const source = [{ id: 'far', title: `${'x'.repeat(90)} React`, summary: '', tags: [] }]
  assert.equal(createArticleIndex(source, 0).search('React')[0].item.id, 'far')
  assert.equal(
    createArticleIndex([{ id: 'typo', title: 'Ract', summary: '', tags: [] }], 0).search('React')
      .length,
    0,
  )
  assert.equal(
    createArticleIndex([{ id: 'typo', title: 'Ract', summary: '', tags: [] }], 0.35).search('React')
      .length,
    1,
  )
  const added = upsertDocument([], {
    id: 'rss',
    title: 'React Query',
    summary: 'React feed',
    tags: ['React'],
  })
  const replaced = upsertDocument(added, {
    id: 'rss',
    title: 'TypeScript',
    summary: 'Types',
    tags: ['TypeScript'],
  })
  assert.equal(createArticleIndex(added).search('React').length, 1)
  assert.equal(createArticleIndex(replaced).search('React').length, 0)
  assert.equal(createArticleIndex(removeDocument(replaced, 'rss')).search('TypeScript').length, 0)
})
test('scoping before actual weighted index and limit avoids unrelated groups taking slots', async () => {
  const { createArticleIndex } = await import('../examples/article-index.mjs')
  const docs = [
    ...Array.from({ length: 25 }, (_, i) => ({
      id: `b-${i}`,
      title: 'zebra',
      summary: '',
      tags: [],
      group: '商业',
    })),
    { id: 'allowed', title: 'zebra report', summary: '', tags: [], group: '技术' },
  ]
  assert.equal(
    createArticleIndex(docs)
      .search('zebra', { limit: 20 })
      .some((hit) => hit.item.id === 'allowed'),
    false,
  )
  assert.deepEqual(
    createArticleIndex(visibleDocuments(docs, '技术'))
      .search('zebra', { limit: 20 })
      .map((hit) => hit.item.id),
    ['allowed'],
  )
})
