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
  entry.demos.map((demo) => demo.level),
  ['basic', 'business', 'advanced'],
)
const paths = new Set(entry.demos.flatMap((demo) => demo.sourceFiles))
assert.equal(paths.size, 6)
for (const path of paths) assert.ok((await stat(new URL(path, root))).isFile())
const bytes = await readFile(new URL(entry.official.readme.snapshotPath, root))
assert.equal(bytes.length, 4388)
assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.official.readme.sha256)
const evidence = await json('official/source-evidence.json')
assert.equal(evidence.package.data.version, '4.37.0')
assert.equal(evidence.tree.truncated, false)
assert.equal(evidence.tree.readmeCandidates.length, 4)
assert.ok(evidence.tree.readmeCandidates.every((path) => !/(?:zh|chinese|cn)/i.test(path)))
assert.equal(entry.official.homepage.status, 'blocked')
assert.equal(evidence.homepage.headers['X-Frame-Options'], 'DENY')
assert.match(evidence.homepage.headers['Content-Security-Policy'], /frame-ancestors/)
const verification = await json('verification.json')
for (const key of ['sdk', 'build', 'browser']) assert.equal(verification[key].status, 'NOT_RUN')
assert.equal(verification.assets.status, 'BLOCKED')
console.log(
  'B05 metadata/3 goals/6 sources/fixed4.37.0 README4388B+hash/no Chinese/blocked homepage/formal NOT_RUN/offline asset BLOCKED PASS',
)
