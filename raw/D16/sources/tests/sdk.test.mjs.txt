import assert from 'node:assert/strict'
import { readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import workboxBuild from 'workbox-build'
import { ISOLATED_SCOPE, runWorkshop, workboxOptions } from '../examples/workshop.mjs'

async function inspect(level, assertion) {
  const result = await runWorkshop(level, { keepOutput: true })
  const site = result.outputDirectory
  try {
    assert.equal(typeof workboxBuild.generateSW, 'function')
    const worker = await readFile(path.join(site, 'sw.js'), 'utf8')
    assert.equal(result.scope, ISOLATED_SCOPE)
    assert.equal(result.registrationExecuted, false)
    assert.equal(result.precacheCount, 3)
    assert.deepEqual([...result.precacheUrls].sort(), ['app.js', 'index.html', 'offline.html'])
    assert.ok(worker.includes('precacheAndRoute'))
    assert.ok(!worker.includes('private/tokens.js'))
    assert.ok(!worker.includes('navigator.serviceWorker.register'))
    assert.ok(!worker.includes('.clientsClaim('))
    await assertion(result, worker)
  } finally {
    const scratch = path.dirname(site)
    assert.ok(path.basename(scratch).startsWith('reactloom-workbox-'))
    await rm(scratch, { recursive: true, force: true })
  }
}

test('real Workbox basic output contains only the declared precache and preserves revisions', async () => {
  await inspect('basic', (summary, worker) => {
    assert.equal(summary.fallback, null)
    assert.ok(worker.includes('revision:'))
    assert.ok(!worker.includes('NetworkFirst'))
    assert.ok(!worker.includes('NavigationRoute'))
    assert.ok(summary.generatedFiles.some((name) => name.startsWith('workbox-')))
    assert.ok(summary.swBytes > 0)
  })
})

test('real Workbox business output serializes the narrow anonymous route and bounded policy', async () => {
  const settings = workboxOptions('/tmp/isolated', 'business')
  assert.deepEqual(settings.runtimeCaching[0].options.cacheableResponse.statuses, [200])
  await inspect('business', (summary, worker) => {
    assert.equal(summary.runtimeStrategy, 'NetworkFirst-public-GET-only')
    for (const text of [
      'NetworkFirst',
      'networkTimeoutSeconds:2',
      'statuses:[200]',
      'maxEntries:12',
      'maxAgeSeconds:3600',
      'https://lab.example.test',
      '/__library_lab_workbox__/api/public/rss',
      'proxy-authorization',
      'omit',
    ]) {
      assert.ok(worker.includes(text), `generated worker is missing ${text}`)
    }
    assert.ok(!worker.includes('NavigationRoute'))
  })
})

test('real Workbox advanced output includes an unconditional navigation shell route, not private files', async () => {
  await inspect('advanced', (summary, worker) => {
    assert.equal(summary.fallback, 'offline.html')
    assert.ok(worker.includes('NavigationRoute'))
    assert.ok(worker.includes('createHandlerBoundToURL("offline.html")'))
    assert.ok(!worker.includes('tokens.js'))
    assert.equal(workboxOptions('/tmp/isolated', 'advanced').navigateFallbackDenylist, undefined)
  })
})
