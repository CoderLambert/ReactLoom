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
  entryCompletenessIssues(entry, {
    guide: true,
    agent: true,
    agents: true,
    verification: true,
  }),
  [],
)
assert.deepEqual(
  entry.demos.map((demo) => demo.level),
  ['basic', 'business', 'advanced'],
)
const runtime = [...new Set(entry.demos.flatMap((demo) => demo.sourceFiles))]
assert.equal(runtime.length, 9)
for (const name of runtime) {
  assert.ok((await stat(new URL(name, base))).isFile())
  const text = await readFile(new URL(name, base), 'utf8')
  assert.ok(!text.includes('@/') && !text.includes('../C17'))
}
const evidence = await json('official/source-evidence.json')
const audit = await json('validation/sdk-source-audit.json')
assert.equal(audit.files.length, 15)
for (const file of audit.files) assert.equal(hash(await readFile(file.path)), file.sha256)
for (const [name, version] of [
  ['react-i18next', '17.0.16'],
  ['i18next', '26.4.3'],
]) {
  const manifest = JSON.parse(
    await readFile(new URL('../../../node_modules/' + name + '/package.json', import.meta.url)),
  )
  assert.equal(manifest.version, version)
  assert.equal(manifest.license, 'MIT')
  assert.equal(audit.versions[name], version)
}
assert.equal(evidence.registry.gitHead, entry.official.readme.commit)
assert.equal(evidence.manifest.version, '17.0.16')
assert.equal(evidence.coreRegistry.version, '26.4.3')
assert.equal(evidence.manifest.peerDependencies.i18next, '>= 26.2.0')
assert.equal(evidence.treeTruncated, false)
assert.ok(!evidence.preferredReadmeCandidates.some((name) => /zh|中文|readme[._-]cn/iu.test(name)))
const original = await readFile(new URL('official/readme.md', base))
assert.equal(original.length, 12793)
assert.equal(hash(original), entry.official.readme.sha256)
assert.equal(hash(original), evidence.snapshot.sha256)
assert.deepEqual(
  original,
  await readFile(new URL('../../../node_modules/react-i18next/README.md', import.meta.url)),
)
assert.equal(evidence.requests.length, 6)
assert.ok(evidence.requests.every((request) => request.status === 200 && request.rawHeaders.length))
assert.equal(evidence.requests[evidence.homepage.requestIndex].bodyStatus, 'NOT_READ')
assert.equal(evidence.homepage.frameAncestors, 'https: ionic: capacitor:')
assert.equal(evidence.homepage.xFrameOptions, null)
assert.equal(evidence.homepage.status, 'blocked')
assert.equal(entry.official.homepage.status, 'blocked')
const before = await json('validation/source-evidence-before-csp-review.json')
assert.deepEqual(evidence.requests, before.requests)
assert.deepEqual(evidence.snapshot, before.snapshot)
assert.equal(before.homepage.status, 'unknown')
const links = []
for (const name of ['guide.md', 'agent.md']) {
  const text = await readFile(new URL(name, base), 'utf8')
  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/gu)) {
    const url = match[1]
    assert.ok(
      resolveDocumentUrl(url, 'C18', '/', entry.official.readme.snapshotPath),
      name + ': ' + url,
    )
    if (!url.startsWith('https:')) assert.ok((await stat(new URL(url, base))).isFile())
    links.push({ name, url })
  }
}
for (const state of Object.values(await json('verification.json')))
  assert.equal(state.status, 'NOT_RUN')
const candidate = new URL(
  '../../../../../docs/library-lab/evidence/quality-upgrade/candidate-19/',
  import.meta.url,
)
const inputs = JSON.parse(await readFile(new URL('inputs.json', candidate), 'utf8'))
const runtimeBinding = {}
for (const name of runtime) {
  const sha = hash(await readFile(new URL(name, base)))
  assert.equal(sha, inputs.files['packages/library-lab/entries/C18-react-i18next/' + name])
  runtimeBinding[name] = sha
}
const proposal = await readFile(new URL('validation/browser-proposal.txt', base))
const publicTest = await readFile(
  new URL('../../../e2e/quality-remediation-react-i18next.spec.ts', import.meta.url),
)
assert.deepEqual(proposal, publicTest)
assert.equal(
  hash(proposal),
  inputs.files['packages/library-lab/e2e/quality-remediation-react-i18next.spec.ts'],
)
const browser = JSON.parse(await readFile(new URL('browser.json', candidate), 'utf8'))
const browserLog = await readFile(new URL('browser.txt', candidate), 'utf8')
const cases = browserLog.split('\n').filter((line) => line.includes('✓') && line.includes('@C18'))
assert.equal(cases.length, 4)
assert.equal(browser.exitCode, 1) // Whole batch: 11 passed, only unrelated B15 source transport failed.
assert.ok(browserLog.includes('11 passed') && browserLog.includes('text/html'))
const shared = {
  reusedNotRerun: true,
  candidate: 'candidate19',
  candidateSHA: inputs.sha256,
  runtimeBinding,
  proposalSHA: hash(proposal),
  browser,
  cases,
  browserLogSHA: hash(Buffer.from(browserLog)),
  scope:
    'C18 four cases PASS. Whole batch exit1/11PASS1FAIL retained; B15 public source URL tracked separately.',
}
await writeFile(
  new URL('validation/shared-evidence.json', base),
  JSON.stringify(shared, null, 2) + '\n',
)
console.log(
  JSON.stringify(
    {
      levels: 3,
      runtimeFiles: runtime.length,
      installedSourceHashes: audit.files.length,
      readmeBytes: original.length,
      renderedLinks: links.length,
      rawHeaderRequests: evidence.requests.length,
      homepage: 'blocked for HTTP Lab CSP ancestor',
      runtimeMatchesCandidate19: true,
      publicProposalExact: true,
      realBrowserC18Cases: cases.length,
      wholeBrowserExit: browser.exitCode,
      formal: 'NOT_RUN',
    },
    null,
    2,
  ),
)
