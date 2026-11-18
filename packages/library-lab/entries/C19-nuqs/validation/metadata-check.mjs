import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
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
assert.equal(runtime.size, 8)
for (const name of runtime) {
  assert.ok((await stat(new URL(name, base))).isFile())
  assert.ok(!(await readFile(new URL(name, base), 'utf8')).includes('@/'))
}
const audit = await json('validation/sdk-source-audit.json')
const installed = JSON.parse(await readFile(join(audit.packagePath, 'package.json'), 'utf8'))
assert.equal(installed.version, '2.10.1')
assert.equal(installed.license, 'MIT')
for (const [name, record] of Object.entries(audit.files))
  assert.equal(hash(await readFile(join(audit.packagePath, name))), record.sha256)
assert.equal(audit.router.reactRouter, '1.170.42')
assert.equal(audit.router.routerCore, '1.171.35')
for (const [name, record] of Object.entries(audit.router.files))
  assert.equal(hash(await readFile(join(audit.router.routerCorePackagePath, name))), record.sha256)
const evidence = await json('official/source-evidence.json')
assert.equal(evidence.registry.version, '2.10.1')
assert.equal(evidence.registry.gitHead, entry.official.readme.commit)
assert.equal(evidence.manifest.version, '0.0.0-semantically-released')
assert.equal(evidence.manifest.name, 'nuqs')
assert.equal(evidence.treeTruncated, false)
assert.ok(!evidence.readmeCandidates.includes('packages/nuqs/README.md'))
assert.ok(!evidence.preferredReadmeCandidates.some((name) => /zh|中文|readme[._-]cn/iu.test(name)))
assert.equal(evidence.path, 'README.md')
const raw = await readFile(new URL('official/readme.md', base))
assert.equal(raw.length, 31845)
assert.equal(hash(raw), entry.official.readme.sha256)
assert.equal(hash(raw), evidence.snapshot.sha256)
assert.equal(hash(await readFile(join(audit.packagePath, 'README.md'))), hash(raw))
assert.equal(evidence.requests.length, 5)
assert.ok(evidence.requests.every((request) => request.status === 200 && request.rawHeaders.length))
const home = evidence.requests[evidence.homepage.requestIndex]
const headers = Object.fromEntries(
  home.rawHeaders.map(([key, value]) => [key.toLowerCase(), value]),
)
assert.equal(headers['x-frame-options'], undefined)
assert.equal(headers['content-security-policy'], undefined)
assert.equal(home.bodyStatus, 'NOT_READ')
assert.equal(home.bytes, null)
assert.equal(evidence.homepage.browserFromLabOrigin, 'NOT_RUN')
assert.equal(entry.official.homepage.status, 'unknown')
let links = 0
for (const name of ['guide.md', 'agent.md']) {
  for (const match of (await readFile(new URL(name, base), 'utf8')).matchAll(/\]\(([^)]+)\)/gu)) {
    assert.ok(
      resolveDocumentUrl(match[1], 'C19', '/', entry.official.readme.snapshotPath),
      match[1],
    )
    links++
  }
}
for (const value of Object.values(await json('verification.json')))
  assert.equal(value.status, 'NOT_RUN')
const checkpoint = await json('validation/checkpoint21-inputs.json')
for (const name of runtime)
  assert.equal(hash(await readFile(new URL(name, base))), checkpoint[name], name)
const root = new URL('../../../../', base)
const candidate = new URL('docs/library-lab/evidence/quality-upgrade/candidate-21/', root)
const candidateJson = async (name) => JSON.parse(await readFile(new URL(name, candidate), 'utf8'))
const candidateInputs = await candidateJson('inputs.json')
assert.equal(
  candidateInputs.sha256,
  '11b1313558ef9191b68ceb7e749b4a7fca8733d3883262871ce1d0e5a1f3368a',
)
assert.deepEqual((await candidateJson('input-stability.json')).changed, [])
for (const name of runtime)
  assert.equal(
    hash(await readFile(new URL(name, base))),
    candidateInputs.files[`packages/library-lab/entries/C19-nuqs/${name}`],
    name,
  )
const browser = await candidateJson('browser.json')
assert.equal(browser.exitCode, 0)
assert.equal(browser.implicitBuild, false)
assert.equal(browser.cwd, new URL('packages/library-lab', root).pathname)
const browserLog = await readFile(new URL('browser.txt', candidate), 'utf8')
const browserCases = browserLog
  .split('\n')
  .filter((line) => line.includes('✓') && line.includes('@C19 '))
assert.equal(browserCases.length, 4)
assert.ok(browserLog.includes('6 passed'))
const browserBinding = await candidateJson('browser-binding.json')
assert.equal(
  browserBinding.testSources['e2e/quality-remediation-nuqs.spec.ts'],
  hash(await readFile(new URL('validation/browser-proposal.txt', base))),
)
for (const result of await candidateJson('results.json'))
  if (['new-e2e-lint', 'typecheck', 'build', 'catalog'].includes(result.name))
    assert.equal(result.exitCode, 0, result.name)
const old = await json('validation/checkpoint-inputs.json')
let unchanged = 0
for (const [name, digest] of Object.entries(old)) {
  if (['examples/example.tsx', 'library.json', 'validation/browser-proposal.txt'].includes(name))
    continue
  assert.equal(hash(await readFile(new URL(name, base))), digest, name)
  unchanged++
}
const files = [
  ...runtime,
  'AGENTS.md',
  'guide.md',
  'agent.md',
  'library.json',
  'verification.json',
  'local-validation.md',
  'tests/sdk.test.mjs',
  'tests/url-policy.test.mjs',
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
      sourceFiles: runtime.size,
      inputs: files.length,
      publisherLinks: links,
      installedNuqsFiles: Object.keys(audit.files).length,
      coreFiles: Object.keys(audit.router.files).length,
      unchangedSdkPolicyAndHistoricalSources: unchanged,
      runtimeMatchesCandidate21: true,
      readmeBytes: raw.length,
      homepage: 'unknown',
      localBrowser: `${browserCases.length} C19 cases PASS; reused candidate21 mixed command 6 PASS/exit0`,
      formal: 'NOT_RUN',
    },
    null,
    2,
  ),
)
