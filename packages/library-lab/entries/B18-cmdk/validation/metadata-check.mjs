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
assert.equal(sources.size, 5)
for (const name of sources) assert.ok((await stat(new URL(name, root))).isFile())
const evidence = await json('official/source-evidence.json')
assert.equal(evidence.package.name, 'cmdk')
assert.equal(evidence.package.version, '1.1.1')
assert.equal(evidence.commit, entry.official.readme.commit)
assert.equal(evidence.tree.truncated, false)
assert.deepEqual(evidence.tree.readmeCandidates, ['README.md', 'website/README.md'])
const readme = await readFile(new URL(entry.official.readme.snapshotPath, root))
assert.equal(readme.length, 14036)
assert.equal(createHash('sha256').update(readme).digest('hex'), entry.official.readme.sha256)
assert.equal(entry.official.homepage.url, evidence.package.homepage)
assert.equal(entry.official.homepage.status, 'blocked')
const homepage = evidence.requests[evidence.homepage.requestIndex]
assert.match(homepage.finalUrl, /github\.com\/dip\/cmdk/)
const headers = Object.fromEntries(
  Object.entries(homepage.headers).map(([key, value]) => [key.toLowerCase(), value]),
)
assert.equal(headers['x-frame-options'].toLowerCase(), 'deny')
assert.match(headers['content-security-policy'], /frame-ancestors 'none'/)
const verification = await json('verification.json')
for (const kind of ['sdk', 'build', 'browser']) assert.equal(verification[kind].status, 'NOT_RUN')
console.log(
  'B18 3 goals / 5 sources / fixed1.1.1 original14036B+SHA / README candidates / homepage redirect+blocked / formal NOT_RUN PASS',
)
