import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
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
assert.equal(files.length, 4)
for (const demo of entry.demos) assert.deepEqual(demo.sourceFiles, files)
for (const path of files) {
  assert.ok(existsSync(join(root, path)), path)
  assert.doesNotMatch(read(path).toString(), /from ['"]@\//)
}
const require = createRequire(import.meta.url)
const packagePath = require.resolve('react-aria-components/package.json')
const pkg = JSON.parse(readFileSync(packagePath, 'utf8'))
assert.equal(pkg.version, '1.21.0')
assert.equal(pkg.version, entry.packages[0].version)
assert.equal(pkg.license, 'Apache-2.0')
assert.equal(pkg.gitHead, '0a2a7e68e4d896b3ac46c3647fe48fac9ea3ae2e')
const source = json('official/source-evidence.json')
assert.equal(source.npmRelease.gitHead, pkg.gitHead)
assert.equal(source.npmRelease.version, pkg.version)
assert.equal(source.packageVersion, pkg.version)
assert.equal(source.commit, pkg.gitHead)
assert.equal(entry.official.readme.commit, pkg.gitHead)
assert.equal(entry.official.readme.path, 'packages/react-aria-components/README.md')
assert.equal(entry.official.readme.language, 'en')
assert.equal(entry.official.readme.syncedAt, source.syncedAt)
assert.equal(source.treeTruncated, false)
assert.equal(source.readmeCandidates.length, 246)
assert.equal(read('official/readme.md').length, 1915)
assert.equal(hash('official/readme.md'), entry.official.readme.sha256)
assert.equal(source.requests.length, 5)
assert.ok(source.requests.every((request) => request.status === 200 && request.headers))
assert.equal(
  source.requests.find((request) => request.url.endsWith('/README.md')).sha256,
  entry.official.readme.sha256,
)
const home = source.requests.find((request) => request.url === entry.official.homepage.url)
const headers = Object.fromEntries(
  Object.entries(home.headers).map(([key, value]) => [key.toLowerCase(), value]),
)
assert.match(headers['content-security-policy'], /frame-ancestors 'self'/)
assert.equal(entry.official.homepage.status, 'blocked')
assert.equal(source.framingEvaluation.status, 'blocked')
assert.equal(source.browserFromLabOrigin, 'NOT_RUN')
for (const value of Object.values(json('verification.json'))) assert.equal(value.status, 'NOT_RUN')
const inputs = [
  ...files,
  'tests/sdk.test.mjs',
  'tests/channel-policy.test.mts',
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
  `${JSON.stringify({ installed: { packagePath, version: pkg.version, gitHead: pkg.gitHead }, files: Object.fromEntries(inputs.map((path) => [path, hash(path)])) }, null, 2)}\n`,
)
console.log(
  JSON.stringify(
    {
      metadata: [],
      completeness: [],
      demos: 3,
      runtimeFiles: files.length,
      inputFiles: inputs.length,
      packageVersion: pkg.version,
      gitHead: pkg.gitHead,
      readmeBytes: 1915,
      sha256: entry.official.readme.sha256,
      homepage: 'blocked: enforced frame-ancestors self',
      browser: 'NOT_RUN',
      formal: 'NOT_RUN',
    },
    null,
    2,
  ),
)
