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
  entry.demos.map((d) => d.level),
  ['basic', 'business', 'advanced'],
)
const sources = new Set(entry.demos.flatMap((d) => d.sourceFiles))
assert.equal(sources.size, 6)
for (const demo of entry.demos) {
  assert.equal(demo.executionKind, 'browser-frame')
  assert.equal(demo.demoId, demo.level)
}
for (const path of sources) assert.ok((await stat(new URL(path, root))).isFile())
const e = await json('official/source-evidence.json')
assert.equal(e.commit, entry.official.readme.commit)
assert.equal(e.package.gitHead, e.commit)
assert.equal(e.manifest.version, '1.2.2')
assert.equal(e.treeTruncated, false)
assert.deepEqual(e.readmeCandidates, ['README.md'])
const data = await readFile(new URL('official/readme.md', root))
assert.equal(data.length, 15874)
assert.equal(createHash('sha256').update(data).digest('hex'), entry.official.readme.sha256)
assert.equal(e.homepage.xFrameOptions, 'SAMEORIGIN')
assert.equal(entry.official.homepage.status, 'blocked')
assert.equal(e.requests[e.homepage.requestIndex].bodyStatus, 'NOT_READ')
const audit = await json('validation/sdk-source-audit.json')
assert.equal(audit.version, '1.2.2')
for (const file of audit.files)
  assert.equal(
    createHash('sha256')
      .update(await readFile(file.path))
      .digest('hex'),
    file.sha256,
  )
for (const key of ['sdk', 'build', 'browser'])
  assert.equal((await json('verification.json'))[key].status, 'NOT_RUN')
assert.equal(
  (await readFile(new URL('validation/browser-proposal.txt', root), 'utf8')).match(/test\('@C13/gu)
    ?.length,
  5,
)
console.log(
  'C13 3 goals / 6 sources / browser-frame contract / SDK1.2.2 installed hashes / original15874B+SHA / blocked headers / 5 actual-browser proposals / formal NOT_RUN',
)
