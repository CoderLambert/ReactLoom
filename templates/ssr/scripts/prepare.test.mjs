import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, test } from 'node:test'
import { fileURLToPath } from 'node:url'

const prepareScript = fileURLToPath(new URL('./prepare.mjs', import.meta.url))
const roots = []

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'reactloom-ssr-prepare-'))
  roots.push(root)
  const project = path.join(root, 'templates', 'ssr')
  await mkdir(path.join(project, 'scripts'), { recursive: true })
  return { root, project }
}

function run(project) {
  return spawnSync(process.execPath, [prepareScript], { cwd: project, encoding: 'utf8' })
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

test('monorepo install uses the shared Git setup script', async () => {
  const { root, project } = await fixture()
  await mkdir(path.join(root, 'scripts'))
  await writeFile(
    path.join(root, 'scripts', 'setup-git.mjs'),
    "import { writeFileSync } from 'node:fs'; writeFileSync('prepare-result.txt', 'workspace')\n",
  )
  assert.equal(run(project).status, 0)
  assert.equal(await readFile(path.join(project, 'prepare-result.txt'), 'utf8'), 'workspace')
})

test('standalone install prefers the copied local setup script', async () => {
  const { root, project } = await fixture()
  await mkdir(path.join(root, 'scripts'))
  await writeFile(path.join(root, 'scripts', 'setup-git.mjs'), 'process.exit(19)\n')
  await writeFile(
    path.join(project, 'scripts', 'setup-git.mjs'),
    "import { writeFileSync } from 'node:fs'; writeFileSync('prepare-result.txt', 'standalone')\n",
  )
  assert.equal(run(project).status, 0)
  assert.equal(await readFile(path.join(project, 'prepare-result.txt'), 'utf8'), 'standalone')
})

test('missing setup script fails with an actionable error', async () => {
  const { project } = await fixture()
  const result = run(project)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /Cannot find scripts\/setup-git\.mjs/)
})

test('Git setup failure propagates its exit code to the install lifecycle', async () => {
  const { project } = await fixture()
  await writeFile(path.join(project, 'scripts', 'setup-git.mjs'), 'process.exit(17)\n')
  assert.equal(run(project).status, 17)
})

test('package scripts use the portable prepare entry and execute these tests', async () => {
  const packagePath = fileURLToPath(new URL('../package.json', import.meta.url))
  const pkg = JSON.parse(await readFile(packagePath, 'utf8'))
  assert.equal(pkg.scripts.prepare, 'node scripts/prepare.mjs')
  assert.equal(pkg.scripts.test, 'vitest run && node --test scripts/prepare.test.mjs')
})
