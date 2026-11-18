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
const entry = json('library.json')
assert.deepEqual(validateEntry(entry), [])
assert.deepEqual(
  entryCompletenessIssues(entry, { guide: true, agent: true, agents: true, verification: true }),
  [],
)
assert.deepEqual(
  entry.demos.map((demo) => demo.level),
  ['basic', 'advanced'],
)
const files = [...new Set(entry.demos.flatMap((demo) => demo.sourceFiles))]
assert.equal(files.length, 5)
for (const path of files) assert.ok(existsSync(join(root, path)), path)
const require = createRequire(import.meta.url)
const packagePath = require.resolve('gsap/package.json')
const pkg = JSON.parse(readFileSync(packagePath, 'utf8'))
assert.equal(pkg.version, '3.15.0')
assert.equal(pkg.version, entry.packages[0].version)
assert.match(pkg.license, /no charge/)
const hash = (path) => createHash('sha256').update(read(path)).digest('hex')
assert.equal(read('official/readme.md').length, 6199)
assert.equal(hash('official/readme.md'), entry.official.readme.sha256)
const evidence = json('official/source-evidence.json')
assert.equal(evidence.packageVersion, pkg.version)
assert.equal(evidence.commit, entry.official.readme.commit)
assert.deepEqual(evidence.readmeCandidates, ['README.md'])
assert.equal(evidence.requests[1].sha256, entry.official.readme.sha256)
assert.ok(evidence.requests.every((request) => request.status === 200))
const homepage = evidence.requests.find((request) => request.url === entry.official.homepage.url)
const headers = Object.fromEntries(
  Object.entries(homepage.headers).map(([key, value]) => [key.toLowerCase(), value]),
)
assert.equal(headers['x-frame-options'].toLowerCase(), 'sameorigin')
assert.equal(entry.official.homepage.status, 'blocked')
assert.equal(evidence.browserFromLabOrigin, 'NOT_RUN')
for (const item of Object.values(json('verification.json'))) assert.equal(item.status, 'NOT_RUN')
const inputs = [
  ...files,
  'tests/sdk.test.mjs',
  'tests/timeline-policy.test.mts',
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
  `${JSON.stringify(
    {
      installed: {
        version: pkg.version,
        packagePath,
        source: join(dirname(packagePath), 'gsap-core.js'),
      },
      files: Object.fromEntries(inputs.map((path) => [path, hash(path)])),
    },
    null,
    2,
  )}\n`,
)
console.log(
  JSON.stringify(
    {
      metadata: [],
      completeness: [],
      demos: 2,
      runtimeFiles: files.length,
      installed: pkg.version,
      readmeBytes: 6199,
      readmeSha256: entry.official.readme.sha256,
      homepage: 'blocked: actual XFO sameorigin',
      formal: 'NOT_RUN',
      inputFiles: inputs.length,
    },
    null,
    2,
  ),
)
