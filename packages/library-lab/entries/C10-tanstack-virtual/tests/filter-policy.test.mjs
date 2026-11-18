import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeFilterQuery, stableRowId, viewIdentity } from '../examples/filter-policy.mjs'
import { filterArticles, makeArticles } from '../examples/virtual-contract.ts'

test('identical terms with a new search revision cannot reuse stale virtual measurements', () => {
  assert.notEqual(viewIdentity('all', 'react', 0), viewIdentity('all', 'react', 1))
})
test('view identities remain unambiguous when query contains separators', () => {
  assert.notEqual(viewIdentity('a|b', 'c', 2), viewIdentity('a', 'b|c', 2))
  assert.notEqual(viewIdentity('技术', 'c', 2), viewIdentity('商业', 'c', 2))
})
test('a reordered list uses business ids rather than previous array indexes', () => {
  const before = [{ id: 'rss-1' }, { id: 'rss-2' }],
    after = [before[1], before[0]]
  assert.equal(stableRowId(before, 0), 'rss-1')
  assert.equal(stableRowId(after, 0), 'rss-2')
  assert.throws(() => stableRowId([], 0), RangeError)
  assert.throws(() => stableRowId([{ id: '' }], 0), TypeError)
})
test('filter text rejects controls and caps multi-byte input by code points', () => {
  assert.equal(normalizeFilterQuery('  工\u0000程\n  '), '工程')
  assert.equal(Array.from(normalizeFilterQuery('😀'.repeat(100))).length, 80)
})

test('shared filter contract preserves row identities and does not mutate the fixture', () => {
  const all = makeArticles(3400)
  const result = filterArticles(all, '工程实践', '')
  assert.equal(result.length, 850)
  assert.equal(result[0].id, 'rss-1')
  assert.equal(result[1].id, 'rss-5')
  assert.equal(all.length, 3400)
  assert.equal(all[1].id, 'rss-2')
  assert.equal(filterArticles(all, 'all', '没有这条文章').length, 0)
})
test('identity and row-key boundaries reject invalid revisions and unresolved rows', () => {
  for (const revision of [-1, 1.5, Number.NaN])
    assert.throws(() => viewIdentity('all', '', revision), TypeError)
  assert.throws(() => stableRowId([{ id: 'rss-1' }], 1), RangeError)
  assert.throws(() => stableRowId([{ id: '   ' }], 0), TypeError)
})
