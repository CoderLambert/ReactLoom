import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  rootCatalogData,
  rootCatalogMarkdown,
  runRootCatalogAudit,
} from '../scripts/root-catalog.mjs'

async function fixture(t, { stale = false } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'lab-index-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const entry = {
    schemaVersion: 1,
    entryId: 'C20',
    slug: 'clsx',
    directory: 'C20-clsx',
    name: 'clsx',
    group: 'C',
    summary: 'Current summary',
    tags: [],
    packages: [],
    contentState: 'missing',
    demos: [],
    references: [],
    related: [],
  }
  const folder = path.join(root, 'packages/library-lab/entries/C20-clsx')
  await mkdir(folder, { recursive: true })
  await writeFile(path.join(folder, 'library.json'), JSON.stringify(entry))
  async function indexes(value) {
    await writeFile(
      path.join(root, 'library-catalog.json'),
      JSON.stringify(rootCatalogData([value]), null, 2) + '\n',
    )
    await writeFile(path.join(root, 'LIBRARY_CATALOG.md'), rootCatalogMarkdown([value]))
  }
  await indexes(stale ? { ...entry, summary: 'Stale committed summary' } : entry)
  const git = (args) => execFileSync('git', args, { cwd: root, stdio: 'pipe' })
  git(['init', '-q'])
  git(['add', '.'])
  git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@localhost', 'commit', '-qm', 'fixture'])
  return { root, entry, indexes }
}

test('a generated working copy cannot hide stale committed indexes', async (t) => {
  const { root, entry, indexes } = await fixture(t, { stale: true })
  await indexes(entry) // Simulate the previous CI generator overwriting the stale files.
  assert.equal((await runRootCatalogAudit(root)).differences.length, 0)
  const committed = await runRootCatalogAudit(root, { committed: true })
  assert.ok(
    committed.differences.length > 0,
    'must inspect HEAD, not the self-repaired working copy',
  )
})

test('a clean committed index passes the immutable gate', async (t) => {
  const { root } = await fixture(t)
  assert.deepEqual((await runRootCatalogAudit(root, { committed: true })).differences, [])
})

test('dirty index edits are not accepted by the committed gate', async (t) => {
  const { root } = await fixture(t)
  await writeFile(path.join(root, 'LIBRARY_CATALOG.md'), 'unreviewed generated content')
  assert.ok((await runRootCatalogAudit(root, { committed: true })).differences.length > 0)
})
