import assert from 'node:assert/strict'
import test from 'node:test'
import { entryCompletenessIssues } from '../scripts/entry-gate.mjs'

const complete = {
  contentState: 'recreated',
  demos: ['basic', 'business', 'advanced'].map((level) => ({
    demoId: level,
    level,
    entryPoint: 'examples/demo.tsx',
    sourceFiles: ['examples/demo.tsx'],
  })),
}
const docs = { guide: true, agent: true, agents: true, verification: true }
test('pending catalogue entries must not expose fake runnable demos', () => {
  assert.deepEqual(entryCompletenessIssues({ contentState: 'missing', demos: [] }), [])
  assert.match(
    entryCompletenessIssues({ ...complete, contentState: 'missing' })[0],
    /must not declare/,
  )
})
test('one to three source-backed levels are complete when basic is present', () => {
  for (const length of [1, 2, 3])
    assert.deepEqual(
      entryCompletenessIssues({ ...complete, demos: complete.demos.slice(0, length) }, docs),
      [],
    )
})
test('reviewed entries fail when guide, scoped Agent rules or evidence are absent', () => {
  const failures = entryCompletenessIssues(complete, { guide: true })
  assert.ok(failures.some((e) => e.includes('agent file')))
  assert.ok(failures.some((e) => e.includes('verification file')))
})
test('rejects duplicate, missing or orphaned entryPoints and avoids a false complete status', () => {
  for (const demos of [[], [...complete.demos, complete.demos[0]]])
    assert.ok(
      entryCompletenessIssues({ ...complete, demos }, docs).some((e) => e.includes('one to three')),
    )
  assert.ok(
    entryCompletenessIssues({ ...complete, demos: complete.demos.slice(1) }, docs).some((e) =>
      e.includes('basic'),
    ),
  )
  const orphaned = entryCompletenessIssues(
    { ...complete, demos: complete.demos.map((d) => ({ ...d, sourceFiles: [] })) },
    docs,
  )
  assert.equal(orphaned.filter((e) => e.includes('sourceFiles')).length, 3)
  const dup = entryCompletenessIssues(
    { ...complete, demos: complete.demos.map((d) => ({ ...d, level: 'basic' })) },
    docs,
  )
  assert.ok(dup.some((e) => e.includes('duplicate demo level')))
})
