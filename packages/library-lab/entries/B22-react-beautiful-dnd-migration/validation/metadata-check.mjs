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
assert.deepEqual(entry.packages, [{ name: '@hello-pangea/dnd', version: '18.0.1' }])
assert.deepEqual(
  entry.demos.map((demo) => demo.level),
  ['basic', 'business', 'advanced'],
)
const sources = new Set(entry.demos.flatMap((demo) => demo.sourceFiles))
assert.equal(sources.size, 4)
for (const name of sources) {
  assert.ok((await stat(new URL(name, root))).isFile())
  assert.doesNotMatch(
    await readFile(new URL(name, root), 'utf8'),
    /from ['"]react-beautiful-dnd['"]/,
  )
}
const evidence = await json('official/source-evidence.json')
assert.equal(evidence.package.version, '18.0.1')
assert.equal(evidence.commit, entry.official.readme.commit)
assert.deepEqual(evidence.tree, { truncated: false, readmeCandidates: ['README.md'] })
const current = await readFile(new URL(entry.official.readme.snapshotPath, root))
assert.equal(current.length, 10875)
assert.equal(createHash('sha256').update(current).digest('hex'), entry.official.readme.sha256)
const legacy = await readFile(new URL(evidence.legacy.snapshotPath, root))
assert.equal(createHash('sha256').update(legacy).digest('hex'), evidence.legacy.sha256)
assert.equal(evidence.legacy.archived, true)
assert.match(evidence.legacy.deprecated, /deprecated/)
assert.equal(evidence.legacy.version, '13.1.1')
assert.equal(evidence.legacy.executed, false)
assert.equal(evidence.legacyExecuted, false)
assert.equal(entry.official.homepage.status, 'unknown')
assert.equal(evidence.requests[evidence.homepage.requestIndex].status, 200)
const verification = await json('verification.json')
for (const kind of ['sdk', 'build', 'browser']) assert.equal(verification[kind].status, 'NOT_RUN')
console.log(
  'B22 replacement-only18.0.1 / 3 goals 4 sources / fixed original README10875B / legacy archived13.1.1 unexecuted+separate hash / homepage unknown / formal NOT_RUN PASS',
)
