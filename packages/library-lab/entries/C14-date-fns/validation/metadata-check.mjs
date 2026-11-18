import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, stat, writeFile } from 'node:fs/promises'
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
assert.equal(runtime.size, 6)
for (const name of runtime) {
  assert.ok((await stat(new URL(name, base))).isFile())
  assert.ok(!(await readFile(new URL(name, base), 'utf8')).includes('@/'))
}
const source = await json('validation/sdk-source-audit.json')
assert.equal(source.files.length, 25)
for (const file of source.files) assert.equal(hash(await readFile(file.realPath)), file.sha256)
const evidence = await json('official/source-evidence.json')
assert.equal(evidence.commit, entry.official.readme.commit)
assert.equal(evidence.tag.name, 'v4.4.0')
assert.equal(evidence.tag.object.sha, evidence.commit)
assert.equal(evidence.treeTruncated, false)
assert.ok(!evidence.readmeCandidates.includes('pkgs/core/README.md'))
assert.ok(!evidence.preferredReadmeCandidates.some((name) => /zh|中文|readme[._-]cn/iu.test(name)))
for (const [name, version] of [
  ['date-fns', '4.4.0'],
  ['@date-fns/tz', '1.5.0'],
]) {
  assert.equal(source.packages[name].version, version)
  assert.equal(source.packages[name].license, 'MIT')
  assert.equal(source.packages[name].installedReadmeSameAsFixedSnapshot, true)
  assert.equal(evidence.manifests[name].version, version)
  assert.equal(evidence.registry[name].gitHead, null)
  const original = await readFile(new URL(evidence.readmes[name].snapshotPath, base))
  assert.equal(original.length, evidence.readmes[name].bytes)
  assert.equal(hash(original), evidence.readmes[name].sha256)
  assert.equal(hash(original), source.packages[name].installedReadmeSHA)
}
assert.equal(evidence.readmes['date-fns'].sha256, entry.official.readme.sha256)
assert.equal(evidence.requests.length, 9)
assert.ok(evidence.requests.every((request) => request.status === 200 && request.rawHeaders.length))
const homepage = evidence.requests[evidence.homepage.requestIndex]
assert.equal(homepage.bodyStatus, 'NOT_READ')
assert.equal(homepage.bytes, null)
assert.equal(evidence.homepage.xFrameOptions, null)
assert.equal(evidence.homepage.contentSecurityPolicy, null)
assert.equal(evidence.homepage.browserFromLabOrigin, 'NOT_RUN')
assert.equal(entry.official.homepage.status, 'unknown')
const links = []
for (const name of ['guide.md', 'agent.md']) {
  const text = await readFile(new URL(name, base), 'utf8')
  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/gu)) {
    const target = match[1]
    assert.ok(resolveDocumentUrl(target, 'C14'), name + ': rejected link ' + target)
    if (!target.startsWith('https:')) assert.ok((await stat(new URL(target, base))).isFile())
    links.push({ document: name, target })
  }
}
for (const value of Object.values(await json('verification.json')))
  assert.equal(value.status, 'NOT_RUN')

const candidate = new URL(
  '../../../../../docs/library-lab/evidence/quality-upgrade/candidate-18/',
  import.meta.url,
)
const receipts = JSON.parse(await readFile(new URL('results.json', candidate), 'utf8'))
const captured = JSON.parse(await readFile(new URL('inputs.json', candidate), 'utf8'))
const inputMap = captured.files ?? captured.inputs ?? captured
const binding = {}
for (const name of runtime) {
  const key = 'packages/library-lab/entries/C14-date-fns/' + name
  const current = hash(await readFile(new URL(name, base)))
  assert.equal(current, inputMap[key])
  assert.equal(current, source.candidate18Runtime[name])
  binding[name] = current
}
const publicTest = new URL('../../../e2e/quality-remediation-date-fns.spec.ts', import.meta.url)
const proposal = await readFile(new URL('validation/browser-proposal.txt', base))
assert.deepEqual(proposal, await readFile(publicTest))
assert.equal(
  hash(proposal),
  inputMap['packages/library-lab/e2e/quality-remediation-date-fns.spec.ts'],
)
const browser = JSON.parse(await readFile(new URL('browser.json', candidate), 'utf8'))
const browserText = await readFile(new URL('browser.txt', candidate), 'utf8')
assert.equal(browser.exitCode, 0)
assert.equal(browser.implicitBuild, false)
const cases = browserText.split('\n').filter((line) => line.includes('✓') && line.includes('@C14'))
assert.equal(cases.length, 4)
const stability = JSON.parse(await readFile(new URL('input-stability.json', candidate), 'utf8'))
assert.deepEqual(stability.changed, [])
const shared = {
  reusedNotRerun: true,
  runtimeFilesUnchangedFromCandidate18: binding,
  proposalSHA: hash(proposal),
  candidateInputsSHA: hash(await readFile(new URL('inputs.json', candidate))),
  results: receipts.filter((receipt) =>
    ['new-e2e-lint', 'typecheck', 'build', 'catalog'].includes(receipt.name),
  ),
  browser,
  browserLogSHA: hash(Buffer.from(browserText)),
  observedC14Cases: cases,
  limitation:
    'Four actual C14 cases on fixed candidate18 dist; guide maintenance-link edits and audit receipts followed build. Official iframe remained unknown. Formal verification NOT_RUN.',
}
await writeFile(
  new URL('validation/shared-evidence.json', base),
  JSON.stringify(shared, null, 2) + '\n',
)
console.log(
  JSON.stringify(
    {
      levels: 3,
      runtimeFiles: 6,
      auditedInstalledFiles: source.files.length,
      readmeBytes: Object.fromEntries(
        Object.entries(evidence.readmes).map(([key, value]) => [key, value.bytes]),
      ),
      renderedDocumentLinks: links.length,
      homepage: 'unknown',
      reusedBrowserC14Cases: cases.length,
      publicProposalExact: true,
      runtimeMatchesCandidate18: true,
      formal: 'NOT_RUN',
    },
    null,
    2,
  ),
)
