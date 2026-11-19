import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const script = fileURLToPath(new URL('./check-bundle-budget.mjs', import.meta.url))

async function withBuild(run) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'reactloom-dist-'))
  try {
    await mkdir(path.join(directory, 'dist/assets'), { recursive: true })
    await writeFile(path.join(directory, 'dist/assets/app.js'), 'console.log("safe bundle")\\n')
    await run(directory)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

function check(directory) {
  return spawnSync(process.execPath, [script], { cwd: directory, encoding: 'utf8' })
}

test('keeps the existing gzip budget check for a clean production bundle', async () => {
  await withBuild((directory) => {
    const result = check(directory)
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /total js gzip/)
  })
})

test('rejects publicly deployable JavaScript source maps', async () => {
  await withBuild(async (directory) => {
    await writeFile(path.join(directory, 'dist/assets/app.js.map'), '{"sources":["private.ts"]}')
    const result = check(directory)
    assert.equal(result.status, 1, result.stdout)
    assert.match(result.stderr, /Source maps must not be included/)
    assert.match(result.stderr, /assets\\/app\\.js\\.map/)
  })
})

test('rejects nested source maps even if no JavaScript sourceMappingURL points to them', async () => {
  await withBuild(async (directory) => {
    await mkdir(path.join(directory, 'dist/assets/nested'), { recursive: true })
    await writeFile(path.join(directory, 'dist/assets/nested/app.css.map'), '{}')
    const result = check(directory)
    assert.equal(result.status, 1, result.stdout)
    assert.match(result.stderr, /nested\\/app\\.css\\.map/)
  })
})
