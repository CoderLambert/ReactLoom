import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { entryCompletenessIssues } from '../../../scripts/entry-gate.mjs'
import { validateEntry } from '../../../src/lib/catalog.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (path) => readFileSync(join(root, path))
const json = (path) => JSON.parse(read(path).toString())
const hash = (path) => createHash('sha256').update(read(path)).digest('hex')
const entry = json('library.json')
assert.deepEqual(validateEntry(entry), [])
assert.deepEqual(
  entryCompletenessIssues(entry, { guide: true, agent: true, agents: true, verification: true }),
  [],
)
assert.deepEqual(
  entry.demos.map((demo) => demo.level),
  ['basic', 'business', 'advanced'],
)
const files = [...new Set(entry.demos.flatMap((demo) => demo.sourceFiles))]
assert.equal(files.length, 5)
for (const demo of entry.demos) assert.deepEqual(demo.sourceFiles, files)
for (const path of files) {
  assert.ok(existsSync(join(root, path)), path)
  assert.doesNotMatch(read(path).toString(), /from ['"]@\//)
}
const require = createRequire(import.meta.url)
const installed = {}
for (const expected of entry.packages) {
  let directory = dirname(require.resolve(expected.name))
  while (!existsSync(join(directory, 'package.json'))) {
    const parent = dirname(directory)
    assert.notEqual(parent, directory)
    directory = parent
  }
  const path = join(directory, 'package.json')
  const actual = JSON.parse(readFileSync(path, 'utf8'))
  assert.equal(actual.name, expected.name)
  assert.equal(actual.version, expected.version)
  assert.equal(actual.license, 'MIT')
  assert.ok(existsSync(join(directory, 'css/styles.css')))
  installed[actual.name] = { version: actual.version, packagePath: path }
}
assert.equal(installed['react-grid-layout'].version, '2.3.0')
assert.equal(installed['react-resizable'].version, '4.0.2')
const source = json('official/source-evidence.json')
assert.equal(source.npmRelease.gitHead, '9b01a614bcdd13e7e921cf3f4b1c7e77942421c1')
assert.equal(source.npmRelease.version, entry.packages[0].version)
assert.equal(source.resizableRelease.version, entry.packages[1].version)
assert.equal(source.commit, entry.official.readme.commit)
assert.equal(source.tagObject, '99f88f92470eb8a9fa51d0c1b997cc542deda270')
assert.equal(source.packageVersion, '2.3.0')
assert.equal(source.treeTruncated, false)
assert.deepEqual(source.readmeCandidates, ['README.md'])
assert.equal(read('official/readme.md').length, 42045)
assert.equal(hash('official/readme.md'), entry.official.readme.sha256)
const installedReadme = readFileSync(
  join(dirname(installed['react-grid-layout'].packagePath), 'README.md'),
)
assert.equal(
  createHash('sha256').update(installedReadme).digest('hex'),
  entry.official.readme.sha256,
)
assert.equal(entry.official.readme.language, 'en')
assert.equal(entry.official.readme.syncedAt, source.syncedAt)
assert.equal(source.requests.length, 8)
assert.ok(source.requests.every((request) => request.status === 200 && request.headers))
assert.equal(
  source.requests.find((request) => request.url.endsWith('/README.md')).sha256,
  entry.official.readme.sha256,
)
const homepage = source.requests.find((request) => request.url === entry.official.homepage.url)
const headers = Object.fromEntries(
  Object.entries(homepage.headers).map(([key, value]) => [key.toLowerCase(), value]),
)
assert.equal(headers['x-frame-options'], undefined)
assert.equal(headers['content-security-policy'], undefined)
assert.equal(entry.official.homepage.status, 'unknown')
assert.equal(source.browserFromLabOrigin, 'NOT_RUN')
for (const result of Object.values(json('verification.json')))
  assert.equal(result.status, 'NOT_RUN')
const inputs = [
  ...files,
  'tests/sdk.test.mjs',
  'tests/layout-policy.test.mts',
  'library.json',
  'guide.md',
  'agent.md',
  'verification.json',
  'official/readme.md',
  'official/source-evidence.json',
  'validation/browser-proposal.txt',
]
writeFileSync(
  join(root, 'validation/input-hashes.json'),
  `${JSON.stringify({ installed, files: Object.fromEntries(inputs.map((path) => [path, hash(path)])) }, null, 2)}\n`,
)
console.log(
  JSON.stringify(
    {
      metadata: [],
      completeness: [],
      demos: 3,
      runtimeFiles: files.length,
      inputFiles: inputs.length,
      installed,
      readmeBytes: 42045,
      sha256: entry.official.readme.sha256,
      homepage: 'unknown: actual GET200/no framing headers, Lab-origin browser NOT_RUN',
      formal: 'NOT_RUN',
    },
    null,
    2,
  ),
)
