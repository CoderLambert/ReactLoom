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
for (const name of sources) {
  assert.ok((await stat(new URL(name, root))).isFile())
  assert.ok(!name.startsWith('tests/'))
}
const evidence = await json('official/source-evidence.json')
assert.equal(evidence.package.version, '2.0.8')
assert.equal(evidence.commit, entry.official.readme.commit)
assert.notEqual(evidence.commit, evidence.registry.gitHead)
assert.equal(evidence.npmHeadManifestVersion, '2.0.7')
assert.equal(evidence.sourceMatch.equal, true)
assert.equal(evidence.treeTruncated, false)
assert.ok(evidence.readmeCandidates.includes('README.md'))
assert.ok(!evidence.readmeCandidates.some((name) => /zh|中文|cn\./i.test(name)))
const bytes = await readFile(new URL(entry.official.readme.snapshotPath, root))
assert.equal(bytes.length, 867)
assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.official.readme.sha256)
assert.equal(entry.official.homepage.status, 'unknown')
assert.equal(evidence.homepage.xFrameOptions, null)
assert.equal(evidence.homepage.contentSecurityPolicy, null)
assert.equal(evidence.requests[evidence.homepage.requestIndex].status, 200)
const audit = await json('validation/sdk-source-audit.json')
assert.equal(audit.package.version, '2.0.8')
assert.equal(audit.createPortalOccurrences, 0)
for (const kind of ['sdk', 'build', 'browser'])
  assert.equal((await json('verification.json'))[kind].status, 'NOT_RUN')
console.log(
  'B20 three goals / four production sources / actual2.0.8 / original README867B+SHA / explicit tag-vs-npm-head evidence / English candidates / homepage unknown / formal NOT_RUN PASS',
)
