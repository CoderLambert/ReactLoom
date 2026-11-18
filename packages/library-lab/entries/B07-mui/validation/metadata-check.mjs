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
assert.equal(files.length, 6)
for (const demo of entry.demos) assert.deepEqual(demo.sourceFiles, files)
for (const path of files) {
  assert.ok(existsSync(join(root, path)), path)
  assert.doesNotMatch(read(path).toString(), /from ['"]@\//)
}
const require = createRequire(import.meta.url)
const installed = Object.fromEntries(
  entry.packages.map((pkg) => {
    const path = require.resolve(`${pkg.name}/package.json`)
    const actual = JSON.parse(readFileSync(path, 'utf8'))
    assert.equal(actual.version, pkg.version)
    assert.equal(actual.license, 'MIT')
    return [pkg.name, { version: actual.version, packagePath: path }]
  }),
)
assert.equal(installed['@mui/material'].version, '9.5.0')
assert.equal(installed['@emotion/react'].version, '11.14.0')
assert.equal(installed['@emotion/styled'].version, '11.14.1')
assert.equal(read('official/readme.md').length, 2284)
assert.equal(hash('official/readme.md'), entry.official.readme.sha256)
assert.equal(entry.official.readme.commit, '1c3f8b4903f21cfad12c102edb3db4ceba2e8c8c')
assert.equal(entry.official.readme.path, 'packages/mui-material/README.md')
assert.equal(entry.official.readme.language, 'en')
const evidence = json('official/source-evidence.json')
assert.equal(evidence.packageVersion, installed['@mui/material'].version)
assert.equal(evidence.commit, entry.official.readme.commit)
assert.equal(evidence.checkedAt, entry.official.readme.syncedAt)
assert.deepEqual(evidence.readmeCandidates, ['README.md', 'packages/mui-material/README.md'])
assert.equal(evidence.requests.length, 5)
assert.ok(evidence.requests.every((request) => request.status === 200))
const raw = evidence.requests.find((request) => request.url.endsWith('/README.md'))
assert.equal(raw.sha256, entry.official.readme.sha256)
assert.equal(raw.bytes, 2284)
const homepage = evidence.requests.find((request) => request.url === entry.official.homepage.url)
const headers = Object.fromEntries(
  Object.entries(homepage.headers).map(([key, value]) => [key.toLowerCase(), value]),
)
assert.equal(headers['x-frame-options'].toLowerCase(), 'sameorigin')
assert.match(headers['content-security-policy'], /(?:^|;)\s*frame-ancestors \*\s*;/)
assert.equal(entry.official.homepage.status, 'unknown')
assert.equal(evidence.framingEvaluation.status, 'unknown')
assert.equal(
  evidence.framingEvaluation.specification,
  'https://w3c.github.io/webappsec-csp/#frame-ancestors-and-frame-options',
)
assert.equal(evidence.browserFromLabOrigin, 'NOT_RUN')
for (const item of Object.values(json('verification.json'))) assert.equal(item.status, 'NOT_RUN')
const inputs = [
  ...files,
  'tests/sdk.test.mjs',
  'tests/feed-history.test.mts',
  'tests/draft-policy.test.mts',
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
      installed,
      readmeBytes: 2284,
      readmeSha256: entry.official.readme.sha256,
      homepage:
        'unknown: enforced frame-ancestors takes precedence; actual Lab-origin browser NOT_RUN',
      formal: 'NOT_RUN',
      inputFiles: inputs.length,
    },
    null,
    2,
  ),
)
