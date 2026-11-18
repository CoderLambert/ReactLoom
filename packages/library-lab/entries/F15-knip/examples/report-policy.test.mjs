import assert from 'node:assert/strict'
import test from 'node:test'
import { checkFixtureFindings, checkKnipReport } from './report-policy.mjs'

const report = (issues) => JSON.stringify({ issues })
const orphan = { file: 'src/unused.ts', files: [{ name: 'src/unused.ts' }] }
const dep = { file: 'package.json', dependencies: [{ name: 'clsx' }] }
test('basic requires a structural unused-file finding', () => {
  assert.deepEqual(checkKnipReport('basic', 1, report([orphan, dep])), { count: 2, orphan: true })
})
test('business suppression is checked without ignoring unrelated findings', () => {
  assert.deepEqual(checkKnipReport('business', 1, report([dep])), { count: 1, orphan: false })
  assert.throws(() => checkKnipReport('business', 1, report([orphan])))
})
test('Knip tool errors, malformed JSON and mismatched exit reject', () => {
  for (const [exit, out] of [
    [2, report([orphan])],
    [0, report([orphan])],
    [1, '{}'],
    [1, 'garbage'],
  ])
    assert.throws(() => checkKnipReport('basic', exit, out))
})
test('advanced may legitimately have no production issues', () => {
  assert.deepEqual(checkKnipReport('advanced', 0, report([])), { count: 0, orphan: false })
})

test('fixture expectations retain independent dependencies and production entry exports', () => {
  const shared = [dep, { file: 'src/tasks.ts', exports: [{ name: 'unreachableHelper' }] }]
  assert.doesNotThrow(() => checkFixtureFindings('basic', report(shared)))
  assert.throws(() => checkFixtureFindings('advanced', report(shared)))
  assert.doesNotThrow(() =>
    checkFixtureFindings(
      'advanced',
      report([
        ...shared,
        { file: 'src/index.ts', exports: [{ name: 'report' }, { name: 'unusedPublic' }] },
      ]),
    ),
  )
  assert.throws(() => checkFixtureFindings('business', report(shared)))
  assert.doesNotThrow(() =>
    checkFixtureFindings(
      'business',
      report([
        ...shared,
        { file: 'tests/tasks.test.ts', files: [{ name: 'tests/tasks.test.ts' }] },
      ]),
    ),
  )
})
