import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, test } from 'node:test'
import { fileURLToPath } from 'node:url'

const prepareScript = fileURLToPath(new URL('./prepare.mjs', import.meta.url))
const fixtures = []

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'reactloom-mobile-prepare-'))
  fixtures.push(root)
  const project = path.join(root, 'templates', 'mobile')
  await mkdir(path.join(project, 'scripts'), { recursive: true })
  return { root, project }
}

function run(project) {
  return spawnSync(process.execPath, [prepareScript], { cwd: project, encoding: 'utf8' })
}

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

test(
  'monorepo install executes the shared Git setup script from the template directory',
  async () => {
    const { root, project } = await fixture()
    await mkdir(path.join(root, 'scripts'))
    await mkdir(path.join(root, 'packages', 'create-reactloom'), { recursive: true })
    await writeFile(path.join(root, 'pnpm-workspace.yaml'), 'packages: []\n')
    await writeFile(path.join(root, 'packages', 'create-reactloom', 'package.json'), '{}\n')
    await writeFile(
      path.join(root, 'scripts', 'setup-git.mjs'),
      "import { writeFileSync } from 'node:fs'; writeFileSync('prepare-result.txt', 'workspace')\n",
    )
    assert.equal(run(project).status, 0)
    assert.equal(await readFile(path.join(project, 'prepare-result.txt'), 'utf8'), 'workspace')
  },
)

test('standalone install prefers its copied local Git setup script', async () => {
  const { root, project } = await fixture()
  await mkdir(path.join(root, 'scripts'))
  await writeFile(path.join(root, 'scripts', 'setup-git.mjs'), "process.exit(19)\n")
  await writeFile(
    path.join(project, 'scripts', 'setup-git.mjs'),
    "import { writeFileSync } from 'node:fs'; writeFileSync('prepare-result.txt', 'standalone')\n",
  )
  assert.equal(run(project).status, 0)
  assert.equal(await readFile(path.join(project, 'prepare-result.txt'), 'utf8'), 'standalone')
})

test('detached generated app does not execute an unrelated grandparent setup script', async () => {
  const { root } = await fixture()
  const project = path.join(root, 'generated', 'app')
  await mkdir(path.join(project, 'scripts'), { recursive: true })
  await mkdir(path.join(root, 'scripts'))
  await writeFile(
    path.join(root, 'scripts', 'setup-git.mjs'),
    "import { writeFileSync } from 'node:fs'; writeFileSync('unexpected-execution', 'yes')\n",
  )

  const result = run(project)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /Cannot find scripts\/setup-git\.mjs/)
  await assert.rejects(access(path.join(project, 'unexpected-execution')))
})

test('lookalike template without workspace markers cannot execute its ancestor setup', async () => {
  const { root, project } = await fixture()
  await mkdir(path.join(root, 'scripts'))
  await writeFile(path.join(root, 'scripts', 'setup-git.mjs'), 'process.exit(23)\n')
  const result = run(project)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /Cannot find scripts\/setup-git\.mjs/)
})

test('missing setup script fails rather than silently skipping project configuration', async () => {
  const { project } = await fixture()
  const result = run(project)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /Cannot find scripts\/setup-git\.mjs/)
})

test('Git setup nonzero status is propagated to the install lifecycle', async () => {
  const { project } = await fixture()
  await writeFile(path.join(project, 'scripts', 'setup-git.mjs'), 'process.exit(17)\n')
  assert.equal(run(project).status, 17)
})

test(
  'package scripts invoke the shell-independent entry point and its regression tests',
  async () => {
    const packagePath = fileURLToPath(new URL('../package.json', import.meta.url))
    const pkg = JSON.parse(await readFile(packagePath, 'utf8'))
    assert.equal(pkg.scripts.prepare, 'node scripts/prepare.mjs')
    assert.match(pkg.scripts.test, /(?:^|&& )node --test scripts\/prepare\.test\.mjs(?: |$)/)
  },
)
