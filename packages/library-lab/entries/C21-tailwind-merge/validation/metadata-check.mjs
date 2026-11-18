import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { entryCompletenessIssues } from '../../../scripts/entry-gate.mjs'
import { validateEntry } from '../../../src/lib/catalog.mjs'
import { resolveDocumentUrl } from '../../../src/lib/document-utils.mjs'

const base = new URL('../', import.meta.url)
const json = async (name) => JSON.parse(await readFile(new URL(name, base), 'utf8'))
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
const entry = await json('library.json')
assert.deepEqual(validateEntry(entry), [])
assert.deepEqual(
  entryCompletenessIssues(entry, { guide: true, agent: true, agents: true, verification: true }),
  [],
)
assert.equal(entry.demos.length, 1)
assert.equal(entry.demos[0].level, 'basic')
const runtime = entry.demos[0].sourceFiles
assert.equal(new Set(runtime).size, 5)
for (const name of runtime) {
  assert.ok((await stat(new URL(name, base))).isFile())
  assert.ok(!(await readFile(new URL(name, base), 'utf8')).includes('@/'))
}
const audit = await json('validation/sdk-source-audit.json')
assert.equal(audit.files.length, 19)
for (const file of audit.files) assert.equal(sha(await readFile(file.path)), file.sha256)
for (const [name, version] of Object.entries(audit.versions)) {
  const p = new URL('../../../node_modules/' + name + '/package.json', import.meta.url)
  assert.equal(JSON.parse(await readFile(p, 'utf8')).version, version)
}
const evidence = await json('official/source-evidence.json')
assert.equal(evidence.registry.gitHead, null)
assert.equal(evidence.commit, entry.official.readme.commit)
assert.equal(evidence.manifest.name, 'tailwind-merge')
assert.equal(evidence.manifest.version, '3.7.0')
assert.equal(evidence.manifestPath, 'packages/tailwind-merge/package.json')
assert.equal(evidence.treeTruncated, false)
assert.ok(evidence.preferredReadmeCandidates.includes('packages/tailwind-merge/README.md'))
assert.ok(!evidence.preferredReadmeCandidates.some((name) => /zh|中文|readme[._-]cn/iu.test(name)))
const original = await readFile(new URL('official/readme.md', base))
assert.equal(original.length, 2549)
assert.equal(sha(original), entry.official.readme.sha256)
assert.equal(sha(original), evidence.readme.sha256)
assert.deepEqual(
  original,
  await readFile(new URL('../../../node_modules/tailwind-merge/README.md', import.meta.url)),
)
assert.equal(evidence.requests.length, 7)
assert.ok(evidence.requests.every((item) => item.status === 200 && item.rawHeaders.length))
const homepage = evidence.requests[evidence.homepage.requestIndex]
assert.equal(homepage.bodyStatus, 'NOT_READ')
assert.equal(homepage.bytes, null)
assert.equal(evidence.homepage.frameAncestors, "'none'")
assert.equal(evidence.homepage.xFrameOptions.toLowerCase(), 'deny')
assert.equal(entry.official.homepage.status, 'blocked')
assert.equal(entry.official.homepage.kind, 'repository')
assert.equal(evidence.homepage.browserFromLabOrigin, 'NOT_RUN')
const links = []
for (const name of ['guide.md', 'agent.md']) {
  const markdown = await readFile(new URL(name, base), 'utf8')
  for (const match of markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/gu)) {
    const href = match[1]
    assert.ok(
      resolveDocumentUrl(href, 'C21', '/', entry.official.readme.snapshotPath),
      name + ': ' + href,
    )
    if (!href.startsWith('https:')) assert.ok((await stat(new URL(href, base))).isFile())
    links.push({ name, href })
  }
}
for (const value of Object.values(await json('verification.json')))
  assert.equal(value.status, 'NOT_RUN')
assert.ok(
  (await readFile(new URL('validation/browser-proposal.txt', base), 'utf8')).includes('@C21'),
)
const names = [
  ...runtime,
  'AGENTS.md',
  'guide.md',
  'agent.md',
  'library.json',
  'verification.json',
  'tests/sdk.test.mjs',
  'official/readme.md',
  'official/source-evidence.json',
  'validation/browser-proposal.txt',
]
const inputs = {}
for (const name of names) inputs[name] = sha(await readFile(new URL(name, base)))
await writeFile(
  new URL('validation/content-input-hashes.json', base),
  JSON.stringify(inputs, null, 2) + '\n',
)
console.log(
  JSON.stringify(
    {
      goals: 1,
      sourceFiles: runtime.length,
      installedSourceAndHostHashes: audit.files.length,
      contentInputs: names.length,
      rendererLinks: links.length,
      readmeBytes: original.length,
      homepage: 'blocked by CSP none; repository homepage',
      browser: 'NOT_RUN',
      formal: 'NOT_RUN',
    },
    null,
    2,
  ),
)
