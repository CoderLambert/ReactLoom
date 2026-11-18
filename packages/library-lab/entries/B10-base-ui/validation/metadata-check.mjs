import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { entryCompletenessIssues } from '../../../scripts/entry-gate.mjs'
import { validateEntry } from '../../../src/lib/catalog.mjs'

const root = new URL('../', import.meta.url)
const json = async (name) => JSON.parse(await readFile(new URL(name, root)))
const entry = await json('library.json')
assert.deepEqual(validateEntry(entry), [])
assert.deepEqual(
  entryCompletenessIssues(entry, { guide: true, agent: true, agents: true, verification: true }),
  [],
)
assert.deepEqual(
  entry.demos.map((demo) => demo.level),
  ['basic', 'business', 'advanced'],
)
const sources = new Set(entry.demos.flatMap((demo) => demo.sourceFiles))
assert.equal(sources.size, 4)
for (const name of sources) assert.ok((await stat(new URL(name, root))).isFile())
const evidence = await json('official/source-evidence.json')
assert.equal(evidence.commit, entry.official.readme.commit)
assert.equal(evidence.package.name, '@base-ui/react')
assert.equal(evidence.package.version, '1.9.0')
assert.deepEqual(evidence.readmeCandidates, {
  root: ['README.md'],
  'packages/react': ['README.md'],
})
const bytes = await readFile(new URL(entry.official.readme.snapshotPath, root))
assert.equal(bytes.length, 1856)
assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.official.readme.sha256)
assert.equal(entry.official.homepage.status, 'unknown')
const headers = evidence.requests[evidence.homepage.requestIndex].headers
const lower = Object.fromEntries(
  Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
)
assert.equal(lower['x-frame-options'], 'SAMEORIGIN')
assert.match(lower['content-security-policy'], /frame-ancestors \*/)
const verification = await json('verification.json')
for (const kind of ['sdk', 'build', 'browser']) assert.equal(verification[kind].status, 'NOT_RUN')
console.log(
  'B10 3 goals / 4 sources / official1.9.0 README1856B + hash / English candidates / homepage unknown / formal NOT_RUN PASS',
)
