import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { entryCompletenessIssues } from '../../../scripts/entry-gate.mjs'
import { validateEntry } from '../../../src/lib/catalog.mjs'

const base = new URL('../', import.meta.url)
const json = async (name) => JSON.parse(await readFile(new URL(name, base), 'utf8'))
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
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
const runtime = new Set(entry.demos.flatMap((demo) => demo.sourceFiles))
assert.equal(runtime.size, 7)
for (const file of runtime) {
  assert.ok((await stat(new URL(file, base))).isFile())
  assert.ok(!(await readFile(new URL(file, base), 'utf8')).includes('@/'))
}
const evidence = await json('official/source-evidence.json')
for (const name of ['react', 'community']) {
  const installed = JSON.parse(
    await readFile(
      new URL(`../../../node_modules/ag-grid-${name}/package.json`, import.meta.url),
      'utf8',
    ),
  )
  assert.equal(installed.version, '36.2.0')
  assert.equal(installed.license, 'MIT')
  assert.equal(evidence.manifests[name].version, installed.version)
  assert.equal(evidence.registry[name].version, installed.version)
}
assert.equal(evidence.treeTruncated, false)
assert.ok(!evidence.readmeCandidates.some((name) => /zh|中文/i.test(name)))
assert.equal(evidence.path, 'packages/ag-grid-react/README.md')
assert.equal(evidence.registry.react.gitHead, entry.official.readme.commit)
const raw = await readFile(new URL('official/readme.md', base))
assert.equal(raw.length, 45598)
assert.equal(hash(raw), entry.official.readme.sha256)
assert.equal(hash(raw), evidence.snapshot.sha256)
assert.deepEqual(
  raw,
  await readFile(new URL('../../../node_modules/ag-grid-react/README.md', import.meta.url)),
)
assert.equal(evidence.requests.length, 7)
assert.ok(
  evidence.requests.every(
    (request) => request.status === 200 && Object.keys(request.headers).length,
  ),
)
assert.equal(evidence.homepage.frameAncestors, "'self' https://*.ag-grid.com")
assert.equal(evidence.homepage.status, 'blocked')
assert.equal(entry.official.homepage.status, 'blocked')
assert.equal(evidence.homepage.browserFromLabOrigin, 'NOT_RUN')
for (const item of Object.values(await json('verification.json')))
  assert.equal(item.status, 'NOT_RUN')
const files = [
  ...runtime,
  'AGENTS.md',
  'guide.md',
  'agent.md',
  'library.json',
  'verification.json',
  'tests/sdk.test.mjs',
  'tests/edit-policy.test.mjs',
  'tests/edit-session.test.mts',
  'official/readme.md',
  'official/source-evidence.json',
  'validation/browser-proposal.txt',
]
const inputs = {}
for (const file of files) inputs[file] = hash(await readFile(new URL(file, base)))
await writeFile(
  new URL('validation/input-hashes.json', base),
  `${JSON.stringify(inputs, null, 2)}\n`,
)
console.log(
  JSON.stringify(
    {
      levels: 3,
      runtimeFiles: 7,
      inputFiles: files.length,
      installed: '36.2.0',
      readmeBytes: raw.length,
      readmeSHA: hash(raw),
      homepage: 'blocked by actual frame-ancestors; browser NOT_RUN',
      formal: 'NOT_RUN',
    },
    null,
    2,
  ),
)
