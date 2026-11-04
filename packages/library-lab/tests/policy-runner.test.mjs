import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  discoverPolicyTests,
  planChangedPolicyTests,
  selectPolicyTests,
} from '../scripts/policy-runner.mjs'
import { discoverSdkTests, selectSdkTests } from '../scripts/sdk-runner.mjs'

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'lab-policy-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  for (const dir of [
    'tests',
    'entries/A04-uplot/tests',
    'entries/C07-table/tests',
    'entries/F11-msw/tests',
    'entries/F11-msw/examples',
  ]) {
    await mkdir(path.join(root, dir), { recursive: true })
  }
  for (const name of [
    'tests/sdk.test.mjs',
    'entries/A04-uplot/tests/stream-policy.test.mts',
    'entries/C07-table/tests/page-policy.test.mjs',
    'entries/F11-msw/tests/node-scenarios.test.mjs',
    'entries/F11-msw/tests/routes.test.mjs',
    'entries/F11-msw/examples/registration-policy.test.mjs',
  ])
    await writeFile(path.join(root, name), "import test from 'node:test';test('fixture',()=>{});")
  return root
}
test('policy discovery includes TS type-stripping suites and excludes real SDK suites', async (t) => {
  const root = await fixture(t)
  const files = await discoverPolicyTests(root)
  assert.deepEqual(files, [
    'entries/A04-uplot/tests/stream-policy.test.mts',
    'entries/C07-table/tests/page-policy.test.mjs',
    'entries/F11-msw/examples/registration-policy.test.mjs',
    'entries/F11-msw/tests/routes.test.mjs',
  ])
  assert.deepEqual(selectPolicyTests(files, { group: 'F' }), files.slice(2))
  assert.throws(() => selectPolicyTests(files, { entries: ['D03'] }), /No policy suite/)
})
test('SDK selection cannot silently count a pure policy-only entry as SDK PASS', async (t) => {
  const root = await fixture(t)
  const sdk = await discoverSdkTests(root)
  assert.deepEqual(sdk, ['tests/sdk.test.mjs', 'entries/F11-msw/tests/node-scenarios.test.mjs'])
  assert.throws(
    () =>
      selectSdkTests([...sdk, 'entries/C07-table/tests/page-policy.test.mjs'], {
        entries: ['C07'],
      }),
    /No SDK test suite/,
  )
})
test('malformed entry names and injected selectors are rejected', () => {
  assert.throws(
    () => selectPolicyTests(['entries/../../secret/tests/run.test.mjs']),
    /No matching policy/,
  )
  assert.throws(
    () => selectPolicyTests(['entries/F11-msw/tests/routes.test.mjs'], { entries: ['Z99'] }),
    /Invalid/,
  )
})

test('entry-level CI policy plan selects changed source IDs but not other libraries', () => {
  const files = [
    'entries/A04-uplot/tests/stream-policy.test.mts',
    'entries/C07-table/tests/page-policy.test.mjs',
    'entries/F11-msw/tests/routes.test.mjs',
    'entries/F11-msw/tests/sdk.test.mjs',
  ]
  const plan = planChangedPolicyTests(
    [
      'packages/library-lab/entries/F11-msw/examples/example.tsx',
      'packages/library-lab/entries/A04-uplot/library.json',
      'docs/library-lab/progress/AB.md',
    ],
    files,
  )
  assert.deepEqual(plan, {
    mode: 'affected',
    entries: ['A04', 'F11'],
    files: files.slice(0, 1).concat(files.slice(2, 3)),
  })
})
test('guide-only and entries lacking policy suites are SKIP, never an SDK PASS', () => {
  const suites = ['entries/C07-table/tests/page-policy.test.mjs']
  const documentation = planChangedPolicyTests(
    ['packages/library-lab/entries/C07-table/guide.md', 'docs/library-lab/COORDINATION.md'],
    suites,
  )
  assert.deepEqual(documentation, { mode: 'skip', entries: [], files: [] })
  const uncovered = planChangedPolicyTests(
    ['packages/library-lab/entries/E05-monaco-editor/examples/example.tsx'],
    suites,
  )
  assert.deepEqual(uncovered, { mode: 'skip', entries: ['E05'], files: [] })
})
test('shared runtime and dependency changes require all pure policies, excluding SDK suites', () => {
  const suites = [
    'entries/A04-uplot/tests/stream-policy.test.mts',
    'entries/C07-table/tests/page-policy.test.mjs',
    'entries/F11-msw/tests/node-scenarios.test.mjs',
  ]
  for (const path of [
    'packages/library-lab/src/components/demo-host.tsx',
    'packages/library-lab/scripts/policy-runner.mjs',
    'packages/library-lab/tests/catalog.test.mjs',
    'pnpm-lock.yaml',
    '.github/workflows/library-lab.yml',
  ]) {
    const plan = planChangedPolicyTests([path], suites)
    assert.equal(plan.mode, 'all', path)
    assert.deepEqual(plan.files, suites.slice(0, 2))
  }
})
