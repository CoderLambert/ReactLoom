import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { entryCompletenessIssues } from '../../../scripts/entry-gate.mjs'
import { validateEntry } from '../../../src/lib/catalog.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (path) => readFileSync(join(root, path))
const json = (path) => JSON.parse(read(path).toString())
const hash = (buffer) => createHash('sha256').update(buffer).digest('hex')
const metadata = json('library.json')
assert.deepEqual(validateEntry(metadata), [])
assert.deepEqual(
  entryCompletenessIssues(metadata, { guide: true, agent: true, agents: true, verification: true }),
  [],
)
assert.deepEqual(
  metadata.demos.map((demo) => demo.level),
  ['basic', 'business', 'advanced'],
)
const sources = [...new Set(metadata.demos.flatMap((demo) => demo.sourceFiles))]
assert.equal(sources.length, 7)
for (const demo of metadata.demos) assert.deepEqual(demo.sourceFiles, sources)
for (const path of sources) assert.doesNotMatch(read(path).toString(), /from ['"]@\//u)
const audit = json('validation/sdk-source-audit.json')
assert.equal(audit.package.name, 'dayjs')
assert.equal(audit.package.version, '1.11.23')
assert.equal(audit.package.license, 'MIT')
for (const file of audit.files)
  assert.equal(hash(readFileSync(join(audit.installedPath, file.path))), file.sha256)
const evidence = json('official/source-evidence.json')
const official = metadata.official.readme
assert.equal(evidence.commit, official.commit)
assert.equal(evidence.release.gitHead, evidence.commit)
assert.equal(evidence.tagCommit, evidence.commit)
assert.equal(evidence.tag, 'v1.11.23')
assert.equal(evidence.release.version, '1.11.23')
assert.equal(evidence.manifest.version, '0.0.0-development')
assert.match(official.version, /1\.11\.23.*0\.0\.0-development/u)
assert.equal(evidence.treeTruncated, false)
assert.deepEqual(evidence.chineseReadmeCandidates, ['docs/zh-cn/README.zh-CN.md'])
assert.equal(official.path, evidence.readme.path)
assert.equal(official.language, 'zh-CN')
assert.equal(read('official/readme.md').length, 3882)
assert.equal(hash(read('official/readme.md')), official.sha256)
assert.equal(evidence.readme.sha256, official.sha256)
assert.equal(hash(read('official/package-readme.md')), evidence.packageReadme.sha256)
assert.deepEqual(
  read('official/package-readme.md'),
  readFileSync(join(audit.installedPath, 'README.md')),
)
assert.equal(evidence.requests.length, 7)
assert.ok(
  evidence.requests.every((request) => request.status === 200 && request.rawHeaders.length > 0),
)
const home = evidence.requests.at(-1)
assert.equal(home.url, metadata.official.homepage.url)
assert.equal(home.bodyStatus, 'NOT_READ')
const headers = Object.fromEntries(
  home.rawHeaders.map(([key, value]) => [key.toLowerCase(), value]),
)
assert.equal(headers['x-frame-options'], undefined)
assert.equal(headers['content-security-policy'], undefined)
assert.equal(metadata.official.homepage.status, 'unknown')
for (const item of Object.values(json('verification.json'))) assert.equal(item.status, 'NOT_RUN')
assert.equal(hash(read('AGENTS.md')), json('validation/baseline.json').files['AGENTS.md'])
assert.equal(
  (
    read('validation/browser-proposal.txt')
      .toString()
      .match(/test\(['"]@C15/gu) || []
  ).length,
  3,
)
console.log(
  JSON.stringify(
    {
      metadata: [],
      sourceFiles: 7,
      demos: 3,
      installedFiles: audit.files.length,
      installedVersion: '1.11.23',
      sourceManifestVersion: '0.0.0-development',
      readme: 'Chinese3882B',
      homepage: 'unknown; actual iframe NOT_RUN',
      formal: 'NOT_RUN',
    },
    null,
    2,
  ),
)
