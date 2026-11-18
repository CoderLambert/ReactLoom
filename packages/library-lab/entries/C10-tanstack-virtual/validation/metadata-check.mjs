import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, realpath, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
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
assert.equal(runtime.size, 6)
for (const name of runtime) {
  assert.ok((await stat(new URL(name, base))).isFile())
  assert.ok(!(await readFile(new URL(name, base), 'utf8')).includes('@/'))
}
const reactPath = await realpath(
  new URL('../../../node_modules/@tanstack/react-virtual', import.meta.url),
)
const corePath = await realpath(join(dirname(reactPath), 'virtual-core'))
const react = JSON.parse(await readFile(join(reactPath, 'package.json'), 'utf8'))
const core = JSON.parse(await readFile(join(corePath, 'package.json'), 'utf8'))
assert.equal(react.version, '3.14.21')
assert.equal(react.dependencies['@tanstack/virtual-core'], '3.19.6')
assert.equal(core.version, '3.19.6')
assert.equal(react.license, 'MIT')
assert.equal(core.license, 'MIT')
const evidence = await json('official/source-evidence.json')
assert.equal(evidence.manifests.react.version, react.version)
assert.equal(evidence.manifests.core.version, core.version)
assert.equal(evidence.registry.react.gitHead ?? null, null)
assert.equal(evidence.versionBasis.commit, entry.official.readme.commit)
assert.notEqual(evidence.versionBasis.tagObject, evidence.versionBasis.commit)
assert.equal(evidence.versionBasis.exit, 0)
assert.ok(evidence.versionBasis.stdout.includes('refs/tags/@tanstack/react-virtual@3.14.21^{}'))
assert.equal(evidence.treeTruncated, false)
assert.ok(!evidence.preferredReadmeCandidates.some((name) => /zh|中文|README[._-]CN/i.test(name)))
assert.ok(!evidence.readmeCandidates.includes('packages/react-virtual/README.md'))
assert.equal(evidence.path, 'README.md')
const raw = await readFile(new URL('official/readme.md', base))
assert.equal(raw.length, 5226)
assert.equal(hash(raw), entry.official.readme.sha256)
assert.equal(hash(raw), evidence.snapshot.sha256)
assert.equal(evidence.requests.length, 7)
assert.ok(
  evidence.requests.every(
    (request) => request.status === 200 && Object.keys(request.headers).length,
  ),
)
const homepage = evidence.requests[evidence.homepage.requestIndex]
const headers = Object.fromEntries(
  Object.entries(homepage.headers).map(([key, value]) => [key.toLowerCase(), value]),
)
assert.equal(headers['x-frame-options'], 'DENY')
assert.equal(headers['content-security-policy'], undefined)
assert.equal(homepage.bodyStatus, 'NOT_READ')
assert.equal(homepage.bytes, null)
assert.equal(entry.official.homepage.status, 'blocked')
assert.equal(evidence.homepage.browserFromLabOrigin, 'NOT_RUN')
for (const value of Object.values(await json('verification.json')))
  assert.equal(value.status, 'NOT_RUN')
const files = [
  ...runtime,
  'AGENTS.md',
  'guide.md',
  'agent.md',
  'library.json',
  'verification.json',
  'tests/sdk.test.mjs',
  'tests/filter-policy.test.mjs',
  'official/readme.md',
  'official/source-evidence.json',
  'validation/browser-proposal.txt',
]
const inputs = {}
for (const name of files) inputs[name] = hash(await readFile(new URL(name, base)))
await writeFile(
  new URL('validation/input-hashes.json', base),
  `${JSON.stringify(inputs, null, 2)}\n`,
)
console.log(
  JSON.stringify(
    {
      levels: 3,
      runtimeFiles: 6,
      inputFiles: files.length,
      react: react.version,
      core: core.version,
      readmeBytes: raw.length,
      readmeSHA: hash(raw),
      homepage: 'blocked by XFO DENY; browser NOT_RUN',
      formal: 'NOT_RUN',
    },
    null,
    2,
  ),
)
