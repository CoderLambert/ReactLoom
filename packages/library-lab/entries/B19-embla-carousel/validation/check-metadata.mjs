import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { validateOfficialSources } from '../../../src/lib/official-sources.mjs'

const entry = new URL('../', import.meta.url)
const metadata = JSON.parse(await readFile(new URL('library.json', entry), 'utf8'))
assert.deepEqual(validateOfficialSources(metadata.official), [])
assert.deepEqual(
  metadata.demos.map((demo) => demo.demoId),
  ['basic', 'advanced'],
)
for (const demo of metadata.demos)
  for (const path of demo.sourceFiles) await readFile(new URL(path, entry))
const original = await readFile(new URL(metadata.official.readme.snapshotPath, entry))
assert.equal(createHash('sha256').update(original).digest('hex'), metadata.official.readme.sha256)
console.log(
  JSON.stringify({
    demos: 2,
    sourceFiles: 3,
    originalBytes: original.length,
    sha256: metadata.official.readme.sha256,
  }),
)
