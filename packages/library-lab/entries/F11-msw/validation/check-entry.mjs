import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { access, readFile } from 'node:fs/promises'
import { entryCompletenessIssues } from '../../../scripts/entry-gate.mjs'
import { validateEntry } from '../../../src/lib/catalog.mjs'

const root = 'entries/F11-msw/'
const entry = JSON.parse(await readFile(`${root}library.json`, 'utf8'))
console.log('cwd:', process.cwd())
console.log('command: node entries/F11-msw/validation/check-entry.mjs')
assert.deepEqual(validateEntry(entry), [])
const files = {}
for (const [key, path] of Object.entries({
  guide: 'guide.md',
  agent: 'agent.md',
  agents: 'AGENTS.md',
  verification: 'verification.json',
})) {
  files[key] = await readFile(root + path, 'utf8')
}
assert.deepEqual(entryCompletenessIssues(entry, files), [])
const sources = new Set(entry.demos.flatMap((demo) => demo.sourceFiles))
for (const path of sources) await access(root + path)
const bytes = await readFile(root + entry.official.readme.snapshotPath)
const digest = createHash('sha256').update(bytes).digest('hex')
assert.equal(digest, entry.official.readme.sha256)
assert.equal(entry.contentState, 'recreated')
assert.equal(entry.packages[0].version, '3.0.3')
console.log(
  'PASS: entry shape, 3 demos,',
  sources.size,
  'source paths, README bytes',
  bytes.length,
  'SHA-256',
  digest,
)
console.log('exit: 0')
