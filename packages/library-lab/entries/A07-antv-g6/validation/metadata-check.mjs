import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { entryCompletenessIssues } from '../../../scripts/entry-gate.mjs'
import { validateEntry } from '../../../src/lib/catalog.mjs'

const entryPath = fileURLToPath(new URL('..', import.meta.url))
const json = (path) => JSON.parse(readFileSync(join(entryPath, path), 'utf8'))
const entry = json('library.json')
assert.deepEqual(validateEntry(entry), [])
assert.deepEqual(
  entryCompletenessIssues(entry, {
    guide: existsSync(join(entryPath, 'guide.md')),
    agent: existsSync(join(entryPath, 'agent.md')),
    agents: existsSync(join(entryPath, 'AGENTS.md')),
    verification: existsSync(join(entryPath, 'verification.json')),
  }),
  [],
)
const files = [...new Set(entry.demos.flatMap((demo) => demo.sourceFiles))]
assert.equal(files.length, 7)
for (const path of files) assert.ok(existsSync(join(entryPath, path)), path)
const require = createRequire(import.meta.url)
const packagePath = require.resolve('@antv/g6/package.json')
const pkg = JSON.parse(readFileSync(packagePath, 'utf8'))
assert.equal(pkg.version, entry.packages[0].version)
assert.equal(pkg.version, '5.1.1')
const sourcePath = join(dirname(packagePath), 'src/runtime/graph.ts')
assert.ok(existsSync(sourcePath), 'Installed matching runtime source exists')
const hash = (path) =>
  createHash('sha256')
    .update(readFileSync(join(entryPath, path)))
    .digest('hex')
assert.equal(hash('official/readme.md'), entry.official.readme.sha256)
assert.equal(readFileSync(join(entryPath, 'official/readme.md')).byteLength, 6017)
const evidence = json('official/source-evidence.json')
assert.equal(evidence.commit, entry.official.readme.commit)
assert.equal(evidence.packageVersion, pkg.version)
assert.equal(evidence.chosenReadme, 'README.zh-CN.md')
const readme = evidence.requests.find((request) => request.url.endsWith('/README.zh-CN.md'))
assert.equal(readme.status, 200)
assert.equal(readme.sha256, entry.official.readme.sha256)
const homepage = evidence.requests.find((request) => request.url === entry.official.homepage.url)
assert.equal(homepage.status, 200)
assert.equal(homepage.finalUrl, entry.official.homepage.url)
assert.ok(Object.keys(homepage.headers).length > 20, 'Full homepage response headers retained')
assert.equal(entry.official.homepage.status, 'unknown')
assert.equal(evidence.browserFromLabOrigin, 'NOT_RUN')
for (const item of Object.values(json('verification.json'))) assert.equal(item.status, 'NOT_RUN')
const inputs = [
  ...files,
  'tests/sdk.test.mjs',
  'tests/async-owner.test.mts',
  'tests/graph-sizing.test.mts',
  'library.json',
  'guide.md',
  'agent.md',
  'verification.json',
  'official/readme.md',
  'official/source-evidence.json',
  'validation/browser-proposal.txt',
]
writeFileSync(
  join(entryPath, 'validation/input-hashes.json'),
  `${JSON.stringify(
    {
      installedPackage: { name: pkg.name, version: pkg.version, path: packagePath, sourcePath },
      files: Object.fromEntries(inputs.map((path) => [path, hash(path)])),
    },
    null,
    2,
  )}\n`,
)
console.log(
  JSON.stringify(
    {
      metadataIssues: [],
      completenessIssues: [],
      runtimeFiles: files.length,
      installedVersion: pkg.version,
      readmeBytes: readme.bytes,
      readmeSha256: readme.sha256,
      officialHomepage: 'unknown',
      formal: 'NOT_RUN',
      inputs: inputs.length,
    },
    null,
    2,
  ),
)
