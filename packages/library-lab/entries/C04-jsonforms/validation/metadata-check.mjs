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
assert.equal(evidence.commit, entry.official.readme.commit)
assert.equal(evidence.tag, 'v3.8.0')
assert.equal(evidence.manifest.version, '3.8.0')
assert.ok(
  Object.values(evidence.packages).every((pkg) => pkg.version === '3.8.0' && pkg.gitHead === null),
)
assert.equal(evidence.treeTruncated, false)
const bytes = await readFile(new URL(entry.official.readme.snapshotPath, root))
assert.equal(bytes.length, 4592)
assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.official.readme.sha256)
assert.equal(entry.official.homepage.status, 'blocked')
assert.equal(evidence.homepage.xFrameOptions, 'SAMEORIGIN')
assert.match(evidence.homepage.contentSecurityPolicy, /frame-ancestors 'self'/)
assert.equal(evidence.requests[evidence.homepage.requestIndex].bodyStatus, 'NOT_READ')
for (const kind of ['sdk', 'build', 'browser'])
  assert.equal((await json('verification.json'))[kind].status, 'NOT_RUN')
console.log(
  'C04 3 goals / 5 sources / JSONForms3.8.0 tag+manifest / npm gitHead absent preserved / original4592B+SHA / evidenced homepage blocked / formal NOT_RUN PASS',
)
