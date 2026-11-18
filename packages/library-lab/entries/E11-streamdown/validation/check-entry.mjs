import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { access, readFile } from 'node:fs/promises'
import { entryCompletenessIssues } from '../../../scripts/entry-gate.mjs'
import { validateEntry } from '../../../src/lib/catalog.mjs'

const root = 'entries/E11-streamdown/'
const entry = JSON.parse(await readFile(`${root}library.json`, 'utf8'))
console.log('cwd:', process.cwd())
console.log('command: node entries/E11-streamdown/validation/check-entry.mjs')
assert.deepEqual(validateEntry(entry), [])
const files = {}
for (const [key, path] of Object.entries({
  guide: 'guide.md',
  agent: 'agent.md',
  agents: 'AGENTS.md',
  verification: 'verification.json',
}))
  files[key] = await readFile(root + path, 'utf8')
assert.deepEqual(entryCompletenessIssues(entry, files), [])
for (const path of new Set(entry.demos.flatMap((demo) => demo.sourceFiles)))
  await access(root + path)
const digest = createHash('sha256')
  .update(await readFile(root + entry.official.readme.snapshotPath))
  .digest('hex')
assert.equal(digest, entry.official.readme.sha256)
assert.equal(entry.provenance.originalRecovery, 'SUMMARY_ONLY')
assert.equal(entry.contentState, 'recreated')
console.log('PASS: metadata, 2 scenarios, all 11 source files, README sha256', digest)
console.log('exit: 0')
