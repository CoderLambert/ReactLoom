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
const files = [...new Set(metadata.demos.flatMap((demo) => demo.sourceFiles))]
assert.equal(files.length, 6)
for (const demo of metadata.demos) {
  assert.deepEqual(demo.sourceFiles, files)
  assert.equal(demo.executionKind, 'react')
}
for (const path of files) assert.doesNotMatch(read(path).toString(), /from ['"]@\//u)
const audit = json('validation/sdk-source-audit.json')
for (const pkg of audit.records) {
  const installed = JSON.parse(readFileSync(join(pkg.installedPath, 'package.json'), 'utf8'))
  assert.equal(installed.version, metadata.packages.find((item) => item.name === pkg.name).version)
  assert.equal(installed.license, 'MIT')
  for (const file of pkg.files)
    assert.equal(hash(readFileSync(join(pkg.installedPath, file.path))), file.sha256)
}
const source = json('official/source-evidence.json')
const official = metadata.official.readme
assert.equal(source.commit, official.commit)
assert.equal(source.tag, 'v7.1.3')
assert.equal(source.tagObject, '38e3df0e36a7197889be8c67148b8bc87c7700b4')
assert.equal(source.release.gitHead, null)
assert.equal(source.manifest.name, '@fullcalendar/react')
assert.equal(source.manifest.version, '7.1.3')
assert.equal(source.treeTruncated, false)
assert.equal(source.readme.path, 'packages/react/README.md')
assert.equal(source.readme.language, 'en')
assert.equal(source.readme.bytes, 2405)
assert.equal(read('official/readme.md').length, source.readme.bytes)
assert.equal(hash(read('official/readme.md')), source.readme.sha256)
assert.equal(official.sha256, source.readme.sha256)
assert.equal(hash(readFileSync(join(audit.records[0].installedPath, 'README.md'))), official.sha256)
assert.equal(source.requests.length, 8)
assert.ok(source.requests.every((request) => request.status === 200 && request.headers))
const home = source.requests.find((request) => request.url === metadata.official.homepage.url)
assert.equal(home.bodyStatus, 'NOT_READ')
const headers = Object.fromEntries(
  Object.entries(home.headers).map(([key, value]) => [key.toLowerCase(), value]),
)
assert.equal(headers['x-frame-options'], 'DENY')
assert.match(headers['content-security-policy'], /frame-ancestors 'none'/u)
assert.equal(metadata.official.homepage.status, 'blocked')
for (const result of Object.values(json('verification.json')))
  assert.equal(result.status, 'NOT_RUN')
assert.equal(hash(read('AGENTS.md')), json('validation/baseline.json').files['AGENTS.md'])
assert.equal(
  (
    read('validation/browser-proposal.txt')
      .toString()
      .match(/test\(['"]@C12/gu) || []
  ).length,
  3,
)
console.log(
  JSON.stringify(
    {
      metadata: [],
      demos: 3,
      sourceFiles: 6,
      installedFiles: 21,
      fixed: 'React7.1.3/Temporal1.0.4',
      readmeBytes: 2405,
      homepage: 'blocked',
      formal: 'NOT_RUN',
    },
    null,
    2,
  ),
)
