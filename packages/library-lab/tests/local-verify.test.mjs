import assert from 'node:assert/strict'
import test from 'node:test'
import { isSupportedNode, parseOptions, verificationSteps } from '../scripts/local-verify.mjs'

test('plan is the default and no side effects are scheduled without --execute', () => {
  const opts = parseOptions([])
  assert.equal(opts.execute, false)
  assert.equal(opts.resolveLock, false)
  assert.equal(verificationSteps(opts)[0].name, 'frozen-install')
})
test('explicit lock resolution is always followed by a frozen install', () => {
  const steps = verificationSteps(parseOptions(['--execute', '--resolve-lock']))
  assert.deepEqual(
    steps.slice(0, 2).map((s) => s.name),
    ['resolve-lock', 'frozen-install'],
  )
  assert.deepEqual(steps[0].args, ['install', '--lockfile-only', '--no-frozen-lockfile'])
  assert.deepEqual(steps[1].args, ['install', '--frozen-lockfile'])
})
test('only fixed commands and a validated entry id are supported', () => {
  const steps = verificationSteps(parseOptions(['--execute', '--sdk-entry=D03', '--browser']))
  assert.equal(steps.find((s) => s.name === 'selected-node-sdk').args.at(-1), '--entry=D03')
  assert.equal(steps.at(-1).name, 'browser-e2e')
  for (const arg of ['--sdk-entry=../bad', '--sdk-entry=D03;touch/x', '--arbitrary']) {
    assert.throws(() => parseOptions(['--execute', '--sdk-entry=D03', arg]))
  }
})
test('no ambiguous modes or implicit browser installs', () => {
  for (const args of [
    ['--execute', '--plan'],
    ['--execute', '--sdk', '--sdk-entry=D03'],
    ['--execute', '--setup-browser'],
    ['--browser'],
  ])
    assert.throws(() => parseOptions(args))
  assert.equal(
    verificationSteps(parseOptions(['--execute', '--browser'])).some(
      (s) => s.name === 'chromium-setup',
    ),
    false,
  )
})
test('Node minimum version is explicit', () => {
  for (const bad of ['18.20.5', '20.19.0', '22.16.0', '22.17.9', 'weird'])
    assert.equal(isSupportedNode(bad), false)
  for (const good of ['22.18.0', '22.20.1', '24.0.0']) assert.equal(isSupportedNode(good), true)
})
