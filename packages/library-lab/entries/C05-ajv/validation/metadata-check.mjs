import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { entryCompletenessIssues } from '../../../scripts/entry-gate.mjs'
import { validateEntry } from '../../../src/lib/catalog.mjs'

const root = new URL('../', import.meta.url)
const read = (file) => readFileSync(new URL(file, root))
const json = (file) => JSON.parse(read(file).toString())
const entry = json('library.json')
assert.deepEqual(validateEntry(entry), [])
assert.deepEqual(
  entryCompletenessIssues(entry, { guide: true, agent: true, agents: true, verification: true }),
  [],
)
assert.equal(entry.demos.length, 3)
for (const demo of entry.demos) {
  assert.equal(demo.sourceFiles.length, 6)
  for (const file of demo.sourceFiles) assert.ok(existsSync(new URL(file, root)))
}
const audit = json('official/source-audit.json')
assert.equal(audit.manifest.version, '8.20.0')
assert.equal(audit.npm.gitHead, entry.official.readme.commit)
assert.equal(audit.readmeCandidates.length, 5)
assert.ok(!audit.readmeCandidates.some((path) => /zh|中文/u.test(path)))
assert.equal(read('official/readme.md').length, 13781)
assert.equal(
  createHash('sha256').update(read('official/readme.md')).digest('hex'),
  entry.official.readme.sha256,
)
for (const kind of ['sdk', 'build', 'browser'])
  assert.equal(json('verification.json')[kind].status, 'NOT_RUN')
assert.equal(entry.official.homepage.status, 'unknown')
console.log(
  'C05 three goals / six sources / actual shared schema / fixed original13781B / complete source headers / homepage unknown / formal NOT_RUN PASS',
)
