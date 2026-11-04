import assert from 'node:assert/strict'
import test from 'node:test'
import { diffRootCatalog, rootCatalogData, rootCatalogMarkdown } from '../scripts/root-catalog.mjs'

const entry = {
  entryId: 'C20',
  name: 'clsx',
  group: 'C',
  summary: '条件类名与语义',
  slug: 'clsx',
  directory: 'C20-clsx',
  contentState: 'recreated',
}
test('root catalog and markdown come from the same canonical entries', () => {
  const expected = rootCatalogData([entry])
  assert.deepEqual(expected, [
    {
      entryId: 'C20',
      name: 'clsx',
      group: 'C',
      summary: '条件类名与语义',
      path: 'packages/library-lab/entries/C20-clsx',
      contentState: 'recreated',
    },
  ])
  assert.equal(diffRootCatalog([entry], expected, rootCatalogMarkdown([entry])).length, 0)
})
test('stale state and summary are caught independently of tests or package installs', () => {
  const rows = rootCatalogData([entry])
  const docs = rootCatalogMarkdown([entry])
  assert.ok(
    diffRootCatalog(
      [entry],
      [{ ...rows[0], summary: '旧版介绍', contentState: 'missing' }],
      docs,
    ).some((x) => x.includes('C20')),
  )
  assert.ok(
    diffRootCatalog([entry], rows, 'stale index').some((x) => x.includes('LIBRARY_CATALOG.md')),
  )
  assert.ok(diffRootCatalog([entry], [...rows, ...rows], docs).some((x) => x.includes('duplicate')))
  assert.ok(diffRootCatalog([entry], [], docs).some((x) => x.includes('missing')))
})
