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
assert.deepEqual(entry.packages, [{ name: 'motion', version: '14.6.0' }])
assert.deepEqual(
  entry.demos.map((demo) => demo.level),
  ['basic', 'business', 'advanced'],
)
const sources = new Set(entry.demos.flatMap((demo) => demo.sourceFiles))
assert.equal(sources.size, 6)
for (const name of sources) {
  assert.ok((await stat(new URL(name, root))).isFile())
  assert.ok(!name.startsWith('tests/'))
}
const evidence = await json('official/source-evidence.json')
assert.equal(evidence.modern.registry.gitHead, entry.official.readme.commit)
assert.equal(evidence.modern.manifest.version, '14.6.0')
assert.equal(evidence.legacy.registry.version, '0.5.2')
assert.equal(evidence.legacy.runtimeStatus, 'NOT_RUN')
assert.equal(evidence.legacy.registry.peerDependencies.react, '^0.14.9 || ^15.3.0 || ^16.0.0')
for (const source of [evidence.modern, evidence.legacy]) {
  assert.equal(source.treeTruncated, false)
  const bytes = await readFile(new URL(source.snapshotPath, root))
  assert.equal(bytes.length, source.bytes)
  assert.equal(createHash('sha256').update(bytes).digest('hex'), source.sha256)
  assert.ok(!source.readmeCandidates.some((name) => /zh|中文/i.test(name)))
}
assert.equal(entry.official.homepage.status, 'unknown')
assert.equal(evidence.homepage.xFrameOptions, null)
assert.equal(evidence.homepage.contentSecurityPolicy, null)
const audit = await json('validation/sdk-source-audit.json')
assert.ok(audit.packages.every((pkg) => pkg.version === '14.6.0'))
for (const kind of ['sdk', 'build', 'browser'])
  assert.equal((await json('verification.json'))[kind].status, 'NOT_RUN')
console.log(
  'B21 three migration goals / six production sources / modern14.6.0 only / two original README byte+SHA checks / old SDK NOT_RUN / homepage unknown / formal NOT_RUN PASS',
)
