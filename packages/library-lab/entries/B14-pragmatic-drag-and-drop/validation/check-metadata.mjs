import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { validateOfficialSources } from '../../../src/lib/official-sources.mjs'

const entry = new URL('../', import.meta.url)
const metadata = JSON.parse(await readFile(new URL('library.json', entry), 'utf8'))
assert.deepEqual(validateOfficialSources(metadata.official), [])
const original = await readFile(new URL(metadata.official.readme.snapshotPath, entry))
assert.equal(createHash('sha256').update(original).digest('hex'), metadata.official.readme.sha256)
for (const demo of metadata.demos)
  for (const file of demo.sourceFiles) await readFile(new URL(file, entry))
console.log(
  JSON.stringify({
    demos: metadata.demos.length,
    sourceFiles: 3,
    originalBytes: original.length,
    hash: metadata.official.readme.sha256,
  }),
)
