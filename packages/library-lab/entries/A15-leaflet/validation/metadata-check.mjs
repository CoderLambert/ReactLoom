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
  entryCompletenessIssues(entry, {
    guide: existsSync(join(root, 'guide.md')),
    agent: existsSync(join(root, 'agent.md')),
    agents: existsSync(join(root, 'AGENTS.md')),
    verification: existsSync(join(root, 'verification.json')),
  }),
  [],
)
const files = [...new Set(entry.demos.flatMap((demo) => demo.sourceFiles))]
assert.equal(files.length, 7)
for (const path of files) assert.ok(existsSync(join(root, path)), path)
const require = createRequire(import.meta.url)
const packagePath = require.resolve('leaflet/package.json')
const installed = JSON.parse(readFileSync(packagePath, 'utf8'))
assert.equal(installed.version, entry.packages[0].version)
assert.equal(installed.version, '1.9.4')
const types = JSON.parse(readFileSync(require.resolve('@types/leaflet/package.json'), 'utf8'))
assert.equal(types.version, '1.9.22')
const hash = (path) => createHash('sha256').update(read(path)).digest('hex')
assert.equal(hash('official/readme.md'), entry.official.readme.sha256)
assert.equal(read('official/readme.md').length, 3952)
const evidence = json('official/source-evidence.json')
assert.equal(evidence.commit, entry.official.readme.commit)
assert.equal(evidence.packageVersion, installed.version)
assert.deepEqual(evidence.readmeCandidates, ['README.md'])
const upstream = evidence.requests.find((request) => request.url.endsWith('/README.md'))
assert.equal(upstream.status, 200)
assert.equal(upstream.sha256, entry.official.readme.sha256)
const homepage = evidence.requests.filter((request) => request.url === entry.official.homepage.url)
assert.equal(homepage.length, 2)
assert.match(homepage[0].error, /UNEXPECTED_EOF/)
assert.equal(homepage[1].exitCode, 35)
assert.equal(homepage[1].headers, undefined, 'TLS failure has no HTTP headers')
assert.equal(entry.official.homepage.status, 'unknown')
assert.equal(evidence.browserFromLabOrigin, 'NOT_RUN')
for (const item of Object.values(json('verification.json'))) assert.equal(item.status, 'NOT_RUN')
const source = join(dirname(packagePath), 'src/map/Map.js')
assert.ok(existsSync(source))
const inputs = [
  ...files,
  'tests/location-policy.test.mts',
  'tests/station-factory.test.mts',
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
        name: installed.name,
        version: installed.version,
        packagePath,
        source,
        typesVersion: types.version,
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
      runtimeFiles: files.length,
      leaflet: installed.version,
      types: types.version,
      readmeBytes: 3952,
      readmeSha256: entry.official.readme.sha256,
      homepage: 'unknown: TLS failed before headers',
      formal: 'NOT_RUN',
      inputFiles: inputs.length,
    },
    null,
    2,
  ),
)
