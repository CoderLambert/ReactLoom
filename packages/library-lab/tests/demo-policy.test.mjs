import assert from 'node:assert/strict'
import test from 'node:test'
import { CAPABILITY_DESCRIPTIONS, demoRunPolicy } from '../src/lib/demo-policy.mjs'

const base = { executionKind: 'react', entryPoint: 'examples/demo.tsx', capabilities: [] }
test('safe React demos still launch only through the explicit host', () => {
  assert.equal(demoRunPolicy(base).mode, 'react')
  assert.equal(
    demoRunPolicy({ ...base, capabilities: ['web-worker', 'resize-observer'] }).mode,
    'react',
  )
})
test('Service Workers and privileged scripts cannot run in the host origin', () => {
  for (const cap of [
    'service-worker',
    'persistent-network-interception',
    'global-service-worker',
    'untrusted-script',
    'cross-origin-isolation',
  ]) {
    const result = demoRunPolicy({ ...base, capabilities: [cap] })
    assert.equal(result.mode, 'isolated', cap)
    assert.match(result.reason, /独立|禁止|需要/u)
  }
})
test('Node, Worker and frame demos never turn into a fake React runtime', () => {
  for (const kind of ['node-ci', 'worker', 'browser-frame'])
    assert.notEqual(demoRunPolicy({ ...base, executionKind: kind }).mode, 'react', kind)
  assert.equal(demoRunPolicy({ ...base, executionKind: 'node-ci' }).mode, 'reproduction')
})
test('unknown or traversal entries cannot be imported', () => {
  assert.equal(demoRunPolicy({ ...base, entryPoint: '../private.tsx' }).mode, 'unavailable')
  assert.equal(demoRunPolicy({ ...base, entryPoint: undefined }).mode, 'unavailable')
  assert.equal(demoRunPolicy(null).mode, 'unavailable')
})
test('capability labels for privileged features are explicit', () =>
  assert.ok(CAPABILITY_DESCRIPTIONS['service-worker'].includes('独立')))

test('reviewed module workers can run while service workers remain isolated', () => {
  assert.equal(
    demoRunPolicy({
      ...base,
      executionKind: 'worker',
      entryPoint: 'examples/compute.worker.ts',
      capabilities: ['web-worker'],
    }).mode,
    'worker',
  )
  assert.equal(
    demoRunPolicy({ ...base, executionKind: 'worker', entryPoint: '../secrets.ts' }).mode,
    'unavailable',
  )
  assert.equal(
    demoRunPolicy({ ...base, executionKind: 'worker', capabilities: ['service-worker'] }).mode,
    'isolated',
  )
})

test('network interception never runs on the shared SPA origin', () => {
  for (const kind of ['react', 'worker', 'browser-frame']) {
    const result = demoRunPolicy({
      ...base,
      executionKind: kind,
      capabilities: ['network-interception'],
    })
    assert.equal(result.mode, 'isolated', kind)
    assert.match(result.reason, /网络拦截/u)
  }
  assert.equal(
    demoRunPolicy({ ...base, capabilities: ['persistent-network-interception'] }).mode,
    'isolated',
  )
})
test('Node process capability is CLI-only, not React or Worker execution', () => {
  for (const kind of ['react', 'worker']) {
    assert.equal(
      demoRunPolicy({ ...base, executionKind: kind, capabilities: ['node-process'] }).mode,
      'isolated',
      kind,
    )
  }
  for (const cap of ['node-process', 'network-interception']) {
    assert.equal(
      demoRunPolicy({ ...base, executionKind: 'node-ci', capabilities: [cap] }).mode,
      'reproduction',
      cap,
    )
  }
  // A forbidden global SW capability is never downgraded to a safe CLI preview.
  assert.equal(
    demoRunPolicy({ ...base, executionKind: 'node-ci', capabilities: ['global-service-worker'] })
      .mode,
    'isolated',
  )
})
