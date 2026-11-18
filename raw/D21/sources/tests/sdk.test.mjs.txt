import assert from 'node:assert/strict'
import test from 'node:test'
import * as pagefind from 'pagefind'
import { runWorkshop } from '../examples/workshop.mjs'

test.after(async () => {
  await pagefind.close()
})
test('real Pagefind binary indexes HTML and writes a bundle', async () => {
  const result = await runWorkshop('basic')
  assert.equal(result.indexer, 'pagefind Node API')
  assert.equal(result.submittedRecords, 2)
  assert.equal(result.wroteActualBundle, true)
  assert.equal(result.visitorSearchExecuted, false)
  assert.ok(result.fileCount > 0)
  assert.ok(result.bundleBytes > 0)
  assert.equal(
    result.assets.reduce((sum, asset) => sum + asset.bytes, 0),
    result.bundleBytes,
  )
  assert.ok(result.assets.every((asset) => /^[a-f0-9]{64}$/.test(asset.sha256)))
  assert.ok(result.paths.every((path) => !path.includes('private')))
})
test('real Pagefind indexes custom RSS notes without an API server', async () => {
  const result = await runWorkshop('business')
  assert.equal(result.submittedRecords, 4)
  assert.deepEqual(
    result.indexedDocuments.find((doc) => doc.url === '/files/rss-playbook.txt').meta,
    { title: 'RSS field notes', category: 'guide' },
  )
  assert.ok(result.paths.some((path) => path.includes('filter')))
  assert.ok(result.fileCount > 0)
  assert.ok(result.bundleBytes > 0)
})
test('real Pagefind scans local generated HTML and cleans native index', async () => {
  const result = await runWorkshop('advanced')
  assert.equal(result.submittedRecords, 5)
  assert.equal(result.directoryPages, 1)
  assert.ok(result.paths.some((p) => p.endsWith('.js')))
})
