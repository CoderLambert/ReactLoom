import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, test } from 'node:test'
import { fileURLToPath } from 'node:url'

const doctorScript = fileURLToPath(new URL('./doctor-editor.mjs', import.meta.url))
const fixtures = []

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'reactloom-mobile-editor-'))
  fixtures.push(root)
  const project = path.join(root, 'templates', 'mobile')
  await mkdir(path.join(project, 'scripts'), { recursive: true })
  return { root, project }
}

function run(project, args = []) {
  return spawnSync(process.execPath, [doctorScript, ...args], {
    cwd: project,
    encoding: 'utf8',
  })
}

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

test('monorepo editor diagnosis resolves the shared launcher and forwards the source location', async () => {
  const { root, project } = await fixture()
  await mkdir(path.join(root, 'scripts'))
  await writeFile(
    path.join(root, 'scripts', 'open-in-editor.mjs'),
    "import { writeFileSync } from 'node:fs'; writeFileSync('editor-args.json', JSON.stringify(process.argv.slice(2)))\n",
  )
  assert.equal(run(project, ['src/app/tasks.tsx:12:3']).status, 0)
  assert.deepEqual(JSON.parse(await readFile(path.join(project, 'editor-args.json'), 'utf8')), [
    '--doctor',
    'src/app/tasks.tsx:12:3',
  ])
})

test('standalone editor diagnosis prefers the copied launcher', async () => {
  const { root, project } = await fixture()
  await mkdir(path.join(root, 'scripts'))
  await writeFile(path.join(root, 'scripts', 'open-in-editor.mjs'), 'process.exit(18)\n')
  await writeFile(
    path.join(project, 'scripts', 'open-in-editor.mjs'),
    "import { writeFileSync } from 'node:fs'; writeFileSync('editor-args.json', JSON.stringify(process.argv.slice(2)))\n",
  )
  assert.equal(run(project).status, 0)
  assert.deepEqual(JSON.parse(await readFile(path.join(project, 'editor-args.json'), 'utf8')), [
    '--doctor',
  ])
})

test('missing editor launcher fails visibly', async () => {
  const { project } = await fixture()
  const result = run(project)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /Cannot find scripts\/open-in-editor\.mjs/)
})

test('editor diagnosis failure propagates its exit code', async () => {
  const { project } = await fixture()
  await writeFile(path.join(project, 'scripts', 'open-in-editor.mjs'), 'process.exit(19)\n')
  assert.equal(run(project).status, 19)
})

test('package wiring runs the portable doctor entry and both Node suites', async () => {
  const packagePath = fileURLToPath(new URL('../package.json', import.meta.url))
  const pkg = JSON.parse(await readFile(packagePath, 'utf8'))
  assert.equal(pkg.scripts['doctor:editor'], 'node scripts/doctor-editor.mjs')
  assert.equal(
    pkg.scripts.test,
    'vitest run && node --test scripts/prepare.test.mjs scripts/doctor-editor.test.mjs scripts/analyze.test.mjs',
  )
})
