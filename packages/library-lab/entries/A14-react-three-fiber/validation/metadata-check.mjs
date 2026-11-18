import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { entryCompletenessIssues } from '../../../scripts/entry-gate.mjs'
import { validateEntry } from '../../../src/lib/catalog.mjs'

const root = new URL('../', import.meta.url)
const json = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'))
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
const paths = new Set(entry.demos.flatMap((demo) => demo.sourceFiles))
assert.equal(paths.size, 6)
for (const path of paths) assert.ok((await stat(new URL(path, root))).isFile(), path)
const bytes = await readFile(new URL(entry.official.readme.snapshotPath, root))
assert.equal(bytes.length, 14301)
assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.official.readme.sha256)
const evidence = await json('official/source-evidence.json')
assert.equal(evidence.tree.truncated, false)
assert.deepEqual(
  evidence.tree.readmeCandidates.filter((path) => /(?:zh|chinese|cn)/i.test(path)),
  [],
)
assert.equal(evidence.commit, entry.official.readme.commit)
assert.equal(
  evidence.package.data.version,
  '9.8.1',
  'fixed release tag discrepancy must remain visible',
)
assert.equal(evidence.npmPublication.package.version, '9.8.2')
assert.match(entry.official.readme.version, /9\.8\.2.*9\.8\.1/)
const integrity = await json('official/npm-integrity.json')
assert.equal(integrity.response.integrity, evidence.npmPublication.package.dist.integrity)
assert.equal(integrity.installedVersion, '9.8.2')
for (const file of integrity.checks) assert.equal(file.matchesInstalled, true)
assert.equal(entry.official.homepage.status, 'unknown')
const verification = await json('verification.json')
assert.ok(Object.values(verification).every((item) => item.status === 'NOT_RUN'))
console.log(
  'A14 metadata/three goals/six runtime sources/README14301B+hash/release manifest discrepancy/npm integrity/unknown homepage/formal NOT_RUN PASS',
)
