import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { entryCompletenessIssues } from '../../../scripts/entry-gate.mjs'
import { validateEntry } from '../../../src/lib/catalog.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (path) => readFileSync(join(root, path))
const json = (path) => JSON.parse(read(path).toString())
const hash = (path) => createHash('sha256').update(read(path)).digest('hex')
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
assert.equal(files.length, 5)
for (const demo of metadata.demos) assert.deepEqual(demo.sourceFiles, files)
for (const path of files) assert.doesNotMatch(read(path).toString(), /from ['"]@\//)
const require = createRequire(import.meta.url)
for (const expected of metadata.packages) {
  const packagePath = join(dirname(dirname(require.resolve(expected.name))), 'package.json')
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'))
  assert.equal(pkg.name, expected.name)
  assert.equal(pkg.version, '7.6.1')
  assert.equal(pkg.license, 'MIT')
}
const source = json('official/source-evidence.json')
assert.equal(source.commit, metadata.official.readme.commit)
assert.equal(source.tag, 'v7.6.1')
assert.equal(source.treeTruncated, false)
assert.equal(source.requests.length, 10)
assert.ok(source.requests.every((request) => request.status === 200 && request.headers))
for (const [name, readme] of Object.entries(source.readmes)) {
  assert.equal(hash(readme.snapshotPath), readme.sha256)
  assert.equal(read(readme.snapshotPath).length, readme.bytes)
  assert.equal(readme.manifest.name, name)
  assert.equal(readme.manifest.version, '7.6.1')
  const installedRoot = dirname(dirname(require.resolve(name)))
  assert.equal(
    createHash('sha256')
      .update(readFileSync(join(installedRoot, 'README.md')))
      .digest('hex'),
    readme.sha256,
  )
}
assert.equal(metadata.official.readme.sha256, source.readmes['react-imask'].sha256)
assert.equal(metadata.official.homepage.status, 'unknown')
const home = source.requests.find((request) => request.url === metadata.official.homepage.url)
const headers = Object.fromEntries(
  Object.entries(home.headers).map(([key, value]) => [key.toLowerCase(), value]),
)
assert.equal(headers['x-frame-options'], undefined)
assert.equal(headers['content-security-policy'], undefined)
for (const result of Object.values(json('verification.json')))
  assert.equal(result.status, 'NOT_RUN')
const baseline = json('validation/baseline.json')
assert.equal(hash('AGENTS.md'), baseline.files['AGENTS.md'])
const audit = json('validation/sdk-source-audit.json')
for (const pkg of audit.records)
  for (const file of pkg.files) {
    assert.equal(
      createHash('sha256')
        .update(readFileSync(join(pkg.installedPath, file.path)))
        .digest('hex'),
      file.sha256,
    )
  }
assert.equal(
  (
    read('validation/browser-proposal.txt')
      .toString()
      .match(/test\(\s*['"]@C06/g) || []
  ).length,
  3,
)
console.log(
  JSON.stringify(
    {
      metadata: [],
      demos: 3,
      runtimeFiles: 5,
      installed: '7.6.1',
      readmes: 2,
      homepage: 'unknown; actualLabOrigin NOT_RUN',
      formal: 'NOT_RUN',
    },
    null,
    2,
  ),
)
