import assert from 'node:assert/strict'
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

const monitoringSource = fileURLToPath(new URL('../src/lib/monitoring.ts', import.meta.url))

async function loadWithSdk(t, implementation) {
  const fixture = await mkdtemp(path.join(tmpdir(), 'reactloom-monitoring-'))
  t.after(() => rm(fixture, { recursive: true, force: true }))

  const sdkDirectory = path.join(fixture, 'node_modules', '@sentry', 'react')
  await mkdir(sdkDirectory, { recursive: true })
  await writeFile(
    path.join(sdkDirectory, 'package.json'),
    JSON.stringify({ name: '@sentry/react', type: 'module', exports: './index.mjs' }),
  )
  const sdkEntry = path.join(sdkDirectory, 'index.mjs')
  await writeFile(sdkEntry, implementation)
  const modulePath = path.join(fixture, 'monitoring.ts')
  await copyFile(monitoringSource, modulePath)

  const { initMonitoring } = await import(pathToFileURL(modulePath).href)
  const sdk = await import(pathToFileURL(sdkEntry).href).catch(() => undefined)
  return { initMonitoring, sdk }
}

function assertNoop(monitor) {
  assert.doesNotThrow(() => {
    monitor.captureException(new Error('test'), { token: 'do-not-log' })
    monitor.setUser({ id: 'demo' })
    monitor.addBreadcrumb('test')
  })
}

test('missing DSN does not load the monitoring SDK', async (t) => {
  const { initMonitoring } = await loadWithSdk(t, 'throw new Error("SDK should not load")')
  assertNoop(await initMonitoring(undefined))
})

test('SDK chunk import failure cannot reject application bootstrap', async (t) => {
  const { initMonitoring } = await loadWithSdk(t, 'throw new Error("chunk failed")')
  const warnings = t.mock.method(console, 'warn', () => {})
  assertNoop(await initMonitoring('https://public@example.invalid/1'))
  assert.equal(warnings.mock.callCount(), 1)
  assert.equal(warnings.mock.calls[0].arguments[0], 'Monitoring initialization failed; continuing without telemetry.')
})

test('SDK initialization failure cannot reject application bootstrap', async (t) => {
  const { initMonitoring } = await loadWithSdk(
    t,
    'export function init() { throw new Error("init failed") }',
  )
  const warnings = t.mock.method(console, 'warn', () => {})
  assertNoop(await initMonitoring('https://public@example.invalid/1'))
  assert.equal(warnings.mock.callCount(), 1)
})

test('working SDK retains the existing monitoring adapter', async (t) => {
  const { initMonitoring, sdk } = await loadWithSdk(
    t,
    [
      "export const calls = []",
      "export function init(options) { calls.push(['init', options]) }",
      "export function captureException(...args) { calls.push(['error', ...args]) }",
      "export function setUser(...args) { calls.push(['user', ...args]) }",
      "export function addBreadcrumb(...args) { calls.push(['breadcrumb', ...args]) }",
    ].join('\n'),
  )
  const dsn = 'https://public@example.invalid/1'
  const monitor = await initMonitoring(dsn)
  const error = new Error('test')
  monitor.captureException(error, { retry: 1 })
  monitor.setUser({ id: 'user-1' })
  monitor.addBreadcrumb('loaded', { path: '/tasks' })
  assert.deepEqual(sdk.calls, [
    ['init', { dsn, tracesSampleRate: 0.1 }],
    ['error', error, { extra: { retry: 1 } }],
    ['user', { id: 'user-1' }],
    ['breadcrumb', { message: 'loaded', data: { path: '/tasks' }, category: 'reactloom' }],
  ])
})
