import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateEntry } from '../../../src/lib/catalog.mjs'
import { resolveDocumentUrl } from '../../../src/lib/document-utils.mjs'

const entry = fileURLToPath(new URL('../', import.meta.url))
const json = (path) => JSON.parse(readFileSync(resolve(entry, path), 'utf8'))
const sha = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
const metadata = json('library.json')
const evidence = json('official/source-evidence.json')
const audit = json('validation/sdk-source-audit.json')
const verification = json('verification.json')
assert.deepEqual(validateEntry(metadata), [])
assert.equal(metadata.packages[0].version, '26.4.3')
assert.equal(metadata.demos.length, 3)
const expected = [
  'examples/example.tsx',
  'examples/i18n-client.mjs',
  'examples/i18n-client.d.mts',
  'examples/language-switch.mjs',
  'examples/language-switch.d.mts',
  'examples/styles.css',
  'examples/demo.tsx',
]
for (const demo of metadata.demos) assert.deepEqual(demo.sourceFiles, expected)
const runtime = JSON.parse(
  readFileSync(
    resolve(
      entry,
      '../../../../docs/library-lab/evidence/quality-upgrade/candidate-19/c17-runtime-reuse.json',
    ),
    'utf8',
  ),
)
for (const source of expected) {
  const key = `packages/library-lab/entries/C17-i18next/${source}`
  assert.equal(sha(resolve(entry, source)), runtime.runtimeFiles[key], source)
}
const installed = dirname(createRequire(import.meta.url).resolve('i18next/package.json'))
assert.equal(JSON.parse(readFileSync(resolve(installed, 'package.json'))).version, '26.4.3')
assert.equal(audit.installedVersion, '26.4.3')
assert.equal(Object.keys(audit.files).length, 9)
for (const [path, record] of Object.entries(audit.files))
  assert.equal(sha(resolve(installed, path)), record.sha256, path)
const readme = metadata.official.readme
assert.equal(evidence.commit, readme.commit)
assert.equal(evidence.tagCommit, readme.commit)
assert.equal(evidence.release.gitHead, readme.commit)
assert.equal(evidence.manifest.version, '26.4.3')
assert.equal(evidence.treeTruncated, false)
assert.deepEqual(evidence.readmeCandidates, ['README.md'])
assert.deepEqual(evidence.chineseReadmeCandidates, [])
assert.equal(readme.path, 'README.md')
assert.equal(readme.language, 'en')
assert.equal(sha(resolve(entry, readme.snapshotPath)), readme.sha256)
assert.equal(sha(resolve(installed, 'README.md')), readme.sha256)
assert.equal(readFileSync(resolve(entry, readme.snapshotPath)).length, 5593)
assert.equal(evidence.requests.length, 7)
for (const request of evidence.requests) {
  assert.equal(request.status, 200)
  assert(Array.isArray(request.rawHeaders) && request.rawHeaders.length > 0)
}
const homepage = evidence.requests.at(-1)
assert.equal(homepage.bodyStatus, 'NOT_READ')
assert.equal(metadata.official.homepage.status, 'blocked')
assert.equal(evidence.homepage.status, 'blocked')
assert.deepEqual(evidence.homepage.frameAncestors, ['https: ionic: capacitor:'])
const correction = json('validation/homepage-policy-correction.json')
assert.equal(correction.from, 'unknown')
assert.equal(correction.to, 'blocked')
assert.equal(correction.rawHeadersSha256Before, correction.rawHeadersSha256After)
for (const item of Object.values(verification)) assert.equal(item.status, 'NOT_RUN')
const links = []
for (const filename of ['guide.md', 'agent.md']) {
  const text = readFileSync(resolve(entry, filename), 'utf8')
  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/gu)) {
    const target = match[1]
    assert(resolveDocumentUrl(target, 'C17', '/', readme.snapshotPath), `${filename}: ${target}`)
    if (target.startsWith('examples/')) assert(expected.includes(target), target)
    links.push({ filename, target })
  }
}
const proposal = readFileSync(resolve(entry, 'validation/browser-proposal.txt'), 'utf8')
assert.equal((proposal.match(/^test\('@C17 /gmu) || []).length, 3)
console.log(
  JSON.stringify(
    {
      result: 'PASS',
      scope:
        'Single-entry schema/published links/installed source hashes/official bytes and recorded raw headers. No SDK/HTTP/browser execution.',
      sourcesUnchangedFromCandidate19: expected.length,
      installedFiles: Object.keys(audit.files).length,
      publishedLinks: links,
      formalStatuses: Object.fromEntries(
        Object.entries(verification).map(([key, item]) => [key, item.status]),
      ),
    },
    null,
    2,
  ),
)
