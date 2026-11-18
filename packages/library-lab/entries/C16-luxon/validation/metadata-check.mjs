import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, realpath, stat, writeFile } from 'node:fs/promises'
import { entryCompletenessIssues } from '../../../scripts/entry-gate.mjs'
import { validateEntry } from '../../../src/lib/catalog.mjs'
import { resolveDocumentUrl } from '../../../src/lib/document-utils.mjs'

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
assert.equal(runtime.size, 9)
for (const name of runtime) {
  assert.ok((await stat(new URL(name, base))).isFile())
  assert.ok(!(await readFile(new URL(name, base), 'utf8')).includes('@/'))
}
const installed = JSON.parse(
  await readFile(
    await realpath(new URL('../../../node_modules/luxon/package.json', import.meta.url)),
    'utf8',
  ),
)
assert.equal(installed.version, '3.7.2')
assert.equal(installed.license, 'MIT')
const audit = await json('validation/sdk-source-audit.json')
assert.equal(audit.package.version, installed.version)
assert.equal(audit.typesPackage.version, '3.7.6')
assert.equal(audit.typesPackage.license, 'MIT')
const evidence = await json('official/source-evidence.json')
assert.equal(evidence.registry.version, installed.version)
assert.equal(evidence.manifest.version, installed.version)
assert.equal(evidence.registry.gitHead, entry.official.readme.commit)
assert.equal(evidence.treeTruncated, false)
assert.ok(!evidence.preferredReadmeCandidates.some((name) => /zh|中文|README[._-]CN/i.test(name)))
assert.equal(evidence.path, 'README.md')
const raw = await readFile(new URL('official/readme.md', base))
assert.equal(raw.length, 2052)
assert.equal(hash(raw), entry.official.readme.sha256)
assert.equal(hash(raw), evidence.snapshot.sha256)
const packageReadme = await readFile(
  new URL('../../../node_modules/luxon/README.md', import.meta.url),
)
assert.equal(hash(packageReadme), hash(raw))
assert.equal(evidence.requests.length, 5)
assert.ok(
  evidence.requests.every(
    (request) => request.status === 200 && Object.keys(request.headers).length,
  ),
)
const homepage = evidence.requests[evidence.homepage.requestIndex]
const headers = Object.fromEntries(
  Object.entries(homepage.headers).map(([key, value]) => [key.toLowerCase(), value]),
)
assert.equal(headers['x-frame-options'], undefined)
assert.equal(headers['content-security-policy'], undefined)
assert.equal(homepage.bodyStatus, 'NOT_READ')
assert.equal(homepage.bytes, null)
assert.equal(entry.official.homepage.status, 'unknown')
assert.equal(evidence.homepage.browserFromLabOrigin, 'NOT_RUN')
for (const value of Object.values(await json('verification.json')))
  assert.equal(value.status, 'NOT_RUN')
const checkpoint = await json('validation/checkpoint-inputs.json')
for (const name of Object.keys(checkpoint).filter(
  (name) => name.startsWith('examples/') || name.startsWith('tests/'),
)) {
  assert.equal(hash(await readFile(new URL(name, base))), checkpoint[name], name)
}
const documentLinks = []
for (const name of ['guide.md', 'agent.md']) {
  const text = await readFile(new URL(name, base), 'utf8')
  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/gu)) {
    const target = match[1]
    assert.ok(
      resolveDocumentUrl(target, 'C16', '/', entry.official.readme.snapshotPath),
      name + ': rejected link ' + target,
    )
    documentLinks.push(target)
  }
}
const files = [
  ...runtime,
  'AGENTS.md',
  'guide.md',
  'agent.md',
  'library.json',
  'verification.json',
  'tests/sdk.test.mjs',
  'tests/wall-time-policy.test.mjs',
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
      runtimeFiles: runtime.size,
      inputFiles: files.length,
      publishedDocumentLinks: documentLinks.length,
      historicalHeaderCapture: 'dictionary only; repeated raw headers unavailable',
      runtimeDifferencesFromCandidate18: 0,
      sdk: installed.version,
      types: audit.typesPackage.version,
      readmeBytes: raw.length,
      readmeSHA: hash(raw),
      homepage: 'unknown; no Lab-origin iframe confirmation',
      formal: 'NOT_RUN',
    },
    null,
    2,
  ),
)
