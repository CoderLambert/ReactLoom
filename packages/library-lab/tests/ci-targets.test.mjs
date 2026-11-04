import assert from 'node:assert/strict'
import test from 'node:test'
import { targetCommands } from '../scripts/ci-targets.mjs'
import { parseRecordArgs, recordVerification } from '../scripts/record-verification.mjs'

test('docs-only plan executes no SDK or browser commands', () => {
  for (const kind of ['sdk', 'browser'])
    assert.deepEqual(targetCommands({ runtime: false, all: false, entries: [] }, kind), [])
})
test('runtime changes select exact SDK IDs and exact browser tags', () => {
  const plan = { runtime: true, all: false, entries: ['D03', 'F11'] }
  assert.deepEqual(targetCommands(plan, 'sdk'), [
    ['node', 'scripts/sdk-runner.mjs', '--entries=D03,F11'],
  ])
  assert.deepEqual(targetCommands(plan, 'browser'), [
    ['pnpm', 'exec', 'playwright', 'test', '--grep', '@D03\\b'],
    ['pnpm', 'exec', 'playwright', 'test', '--grep', '@F11\\b'],
  ])
})
test('Vitest has its own real runner, not a nonexistent Node SDK suite', () => {
  assert.deepEqual(targetCommands({ runtime: true, all: false, entries: ['F12'] }, 'sdk'), [
    ['pnpm', 'test:vitest'],
  ])
})
test('full selection retains both SDK runners; empty and malformed runtime plans fail', () => {
  assert.equal(targetCommands({ runtime: true, all: true, entries: [] }, 'sdk').length, 2)
  for (const plan of [
    { all: true, entries: [] },
    { runtime: true, all: false, entries: [] },
    { runtime: true, all: false, entries: ['../x'] },
  ])
    assert.throws(() => targetCommands(plan, 'sdk'))
})
test('receipt CLI plans by default, rejects shell and arbitrary target arguments', async () => {
  const options = parseRecordArgs(['--entry=D03', '--kind=sdk'])
  assert.deepEqual(await recordVerification(options), {
    mode: 'plan',
    command: ['node', 'scripts/sdk-runner.mjs', '--entry=D03'],
  })
  for (const args of [
    ['--entry=../x', '--kind=sdk'],
    ['--entry=D03', '--kind=echo'],
    ['--entry=D03', '--kind=sdk', '--command=echo pass'],
  ])
    assert.throws(() => parseRecordArgs(args))
})
