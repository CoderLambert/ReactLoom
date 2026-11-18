import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { entryCompletenessIssues } from '../../../scripts/entry-gate.mjs'
import { validateEntry } from '../../../src/lib/catalog.mjs'

const root = new URL('../', import.meta.url)
const json = async (path) => JSON.parse(await readFile(new URL(path, root)))
const entry = await json('library.json')
assert.deepEqual(validateEntry(entry), [])
assert.deepEqual(
  entryCompletenessIssues(entry, { guide: true, agent: true, agents: true, verification: true }),
  [],
)
assert.deepEqual(
  entry.demos.map((d) => d.level),
  ['basic', 'business', 'advanced'],
)
const sources = new Set(entry.demos.flatMap((d) => d.sourceFiles))
assert.equal(sources.size, 5)
for (const path of sources) assert.ok((await stat(new URL(path, root))).isFile())
const evidence = await json('official/source-evidence.json')
assert.equal(evidence.commit, entry.official.readme.commit)
assert.equal(evidence.tag, 'react-virtuoso@4.18.19')
assert.equal(evidence.manifest.version, '4.18.19')
assert.equal(evidence.package.gitHead, null)
assert.equal(evidence.treeTruncated, false)
assert.equal(evidence.readme.path, 'packages/react-virtuoso/README.md')
const bytes = await readFile(new URL(entry.official.readme.snapshotPath, root))
assert.equal(bytes.length, 9703)
assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.official.readme.sha256)
assert.equal(entry.official.homepage.status, 'unknown')
assert.equal(evidence.requests[evidence.homepage.requestIndex].status, 200)
assert.equal(evidence.requests[evidence.homepage.requestIndex].bodyStatus, 'NOT_READ')
const audit = await json('validation/sdk-source-audit.json')
assert.equal(audit.manifest.version, '4.18.19')
for (const kind of ['sdk', 'build', 'browser'])
  assert.equal((await json('verification.json'))[kind].status, 'NOT_RUN')
console.log(
  'C09 3 goals / 5 sources / installed4.18.19 / annotated-tag+matching manifest / original9703B+SHA / homepage unknown with complete GET headers / formal NOT_RUN',
)
