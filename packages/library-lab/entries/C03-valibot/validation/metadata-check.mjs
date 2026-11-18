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
assert.equal(files.length, 6)
for (const demo of entry.demos) assert.deepEqual(demo.sourceFiles, files)
for (const path of files) {
  assert.ok(existsSync(join(root, path)), path)
  assert.doesNotMatch(read(path).toString(), /from ['"]@\//)
}
const require = createRequire(import.meta.url)
const packagePath = join(dirname(dirname(require.resolve('valibot'))), 'package.json')
const pkg = JSON.parse(readFileSync(packagePath, 'utf8'))
assert.equal(pkg.name, 'valibot')
assert.equal(pkg.version, '1.4.2')
assert.equal(entry.packages[0].version, pkg.version)
assert.equal(pkg.license, 'MIT')
assert.equal(pkg.peerDependencies.typescript, '>=5')
const source = json('official/source-evidence.json')
assert.equal(source.registry.gitHead, '0dc26ea88cf07a414653375f0da43f97e0eed607')
assert.equal(source.registry.version, pkg.version)
assert.equal(source.packageVersion, pkg.version)
assert.equal(source.commit, entry.official.readme.commit)
assert.equal(source.tag, 'v1.4.2')
assert.equal(source.treeTruncated, false)
assert.equal(source.readmeCandidates.length, 8)
assert.equal(source.chosenReadme, 'library/README.md')
assert.equal(entry.official.readme.path, source.chosenReadme)
assert.equal(entry.official.readme.language, 'en')
assert.equal(entry.official.readme.syncedAt, source.syncedAt)
assert.equal(read('official/readme.md').length, 5343)
assert.equal(hash('official/readme.md'), entry.official.readme.sha256)
const installedReadme = readFileSync(join(dirname(packagePath), 'README.md'))
assert.equal(
  createHash('sha256').update(installedReadme).digest('hex'),
  entry.official.readme.sha256,
)
assert.equal(source.requests.length, 6)
assert.ok(source.requests.every((request) => request.status === 200 && request.headers))
assert.equal(
  source.requests.find((request) => request.url.endsWith('/library/README.md')).sha256,
  entry.official.readme.sha256,
)
const home = source.requests.find((request) => request.url === entry.official.homepage.url)
const headers = Object.fromEntries(
  Object.entries(home.headers).map(([key, value]) => [key.toLowerCase(), value]),
)
assert.equal(headers['x-frame-options'], undefined)
assert.equal(headers['content-security-policy'], undefined)
assert.equal(entry.official.homepage.status, 'unknown')
assert.equal(source.browserFromLabOrigin, 'NOT_RUN')
for (const status of Object.values(json('verification.json')))
  assert.equal(status.status, 'NOT_RUN')
const inputs = [
  ...files,
  'tests/sdk.test.mjs',
  'tests/boundary-policy.test.mjs',
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
  `${JSON.stringify({ installed: { version: pkg.version, packagePath }, files: Object.fromEntries(inputs.map((path) => [path, hash(path)])) }, null, 2)}\n`,
)
console.log(
  JSON.stringify(
    {
      metadata: [],
      completeness: [],
      demos: 3,
      runtimeFiles: files.length,
      inputFiles: inputs.length,
      installed: pkg.version,
      readmeBytes: 5343,
      sha256: entry.official.readme.sha256,
      homepage: 'unknown: actual GET200 no framing headers, Lab-origin browser NOT_RUN',
      formal: 'NOT_RUN',
    },
    null,
    2,
  ),
)
