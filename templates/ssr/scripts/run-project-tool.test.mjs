import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, test } from 'node:test'
import { fileURLToPath } from 'node:url'

const runner = fileURLToPath(new URL('./run-project-tool.mjs', import.meta.url))
const roots = []

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'reactloom-ssr-tool-'))
  roots.push(root)
  const project = path.join(root, 'templates', 'ssr')
  await mkdir(path.join(project, 'scripts'), { recursive: true })
  await writeFile(path.join(project, 'package.json'), '{"name":"fake-ssr"}\n')
  return { root, project }
}

async function script(pathname, content) {
  await mkdir(path.dirname(pathname), { recursive: true })
  await writeFile(pathname, content)
}

const recorder =
  "import { writeFileSync } from 'node:fs'; writeFileSync('runner-args.json', JSON.stringify(process.argv.slice(2)))\n"

const storybookRecorder =
  "import { writeFileSync } from 'node:fs'; writeFileSync('runner-args.json', JSON.stringify({ args: process.argv.slice(2), storybook: process.env.STORYBOOK }))\\n"

async function mockStorybook(project, content = storybookRecorder) {
  const directory = path.join(project, 'node_modules', 'storybook')
  await script(
    path.join(directory, 'package.json'),
    JSON.stringify({
      name: 'storybook',
      version: '10.6.1',
      type: 'module',
      exports: { './package.json': './package.json' },
      bin: './dist/bin/dispatcher.js',
    }),
  )
  await script(path.join(directory, 'dist', 'bin', 'dispatcher.js'), content)
}

function run(project, mode, args = []) {
  return spawnSync(process.execPath, [runner, mode, ...args], { cwd: project, encoding: 'utf8' })
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

test('monorepo dev resolves the shared launcher and preserves Next open-browser args', async () => {
  const { root, project } = await fixture()
  await script(path.join(root, 'scripts', 'with-lighthouse.mjs'), recorder)
  assert.equal(run(project, 'dev').status, 0)
  const args = JSON.parse(await readFile(path.join(project, 'runner-args.json'), 'utf8'))
  assert.deepEqual(args, [
    'dev',
    '--',
    process.execPath,
    path.join(project, 'scripts', 'open-browser.mjs'),
    '--',
    'next',
    'dev',
    '--hostname',
    '0.0.0.0',
    '--port',
    '4318',
  ])
})

test('standalone preview prefers the local launcher and resolves the installed Next JS entry', async () => {
  const { root, project } = await fixture()
  await script(path.join(root, 'scripts', 'with-lighthouse.mjs'), 'process.exit(19)\n')
  await script(path.join(project, 'scripts', 'with-lighthouse.mjs'), recorder)
  await script(path.join(project, 'node_modules', 'next', 'dist', 'bin', 'next'), '')
  assert.equal(run(project, 'preview').status, 0)
  const args = JSON.parse(await readFile(path.join(project, 'runner-args.json'), 'utf8'))
  assert.deepEqual(args, [
    'preview',
    '--',
    process.execPath,
    path.join(project, 'node_modules', 'next', 'dist', 'bin', 'next'),
    'start',
    '--hostname',
    '0.0.0.0',
    '--port',
    '4318',
  ])
})

test('doctor forwards source positions and uses local editor entry', async () => {
  const { root, project } = await fixture()
  await script(path.join(root, 'scripts', 'open-in-editor.mjs'), 'process.exit(19)\n')
  await script(path.join(project, 'scripts', 'open-in-editor.mjs'), recorder)
  assert.equal(run(project, 'doctor', ['src/app/page.tsx:11:2']).status, 0)
  assert.deepEqual(
    JSON.parse(await readFile(path.join(project, 'runner-args.json'), 'utf8')),
    ['--doctor', 'src/app/page.tsx:11:2'],
  )
})

test('missing launcher is an actionable failure', async () => {
  const { project } = await fixture()
  const result = run(project, 'doctor')
  assert.equal(result.status, 1)
  assert.match(result.stderr, /Cannot find scripts\/open-in-editor\.mjs/)
})

test('launcher errors retain their exit status', async () => {
  const { project } = await fixture()
  await script(path.join(project, 'scripts', 'with-lighthouse.mjs'), 'process.exit(17)\n')
  assert.equal(run(project, 'dev').status, 17)
})

test('missing Next executable fails before spawning the preview wrapper', async () => {
  const { project } = await fixture()
  await script(path.join(project, 'scripts', 'with-lighthouse.mjs'), recorder)
  const result = run(project, 'preview')
  assert.equal(result.status, 1)
  assert.match(result.stderr, /Cannot find module 'next\/dist\/bin\/next'/)
})

test('Storybook dev invokes the installed CLI without a shell and enables the build env', async () => {
  const { project } = await fixture()
  await mockStorybook(project)
  assert.equal(run(project, 'storybook', ['--debug']).status, 0)
  assert.deepEqual(JSON.parse(await readFile(path.join(project, 'runner-args.json'), 'utf8')), {
    args: ['dev', '-p', '6007', '--no-open', '--debug'],
    storybook: 'true',
  })
})

test('Storybook static build sets STORYBOOK and forwards output arguments', async () => {
  const { project } = await fixture()
  await mockStorybook(project)
  assert.equal(run(project, 'build-storybook', ['--output-dir', 'out']).status, 0)
  assert.deepEqual(JSON.parse(await readFile(path.join(project, 'runner-args.json'), 'utf8')), {
    args: ['build', '--output-dir', 'out'],
    storybook: 'true',
  })
})

test('Storybook failures preserve the actual CLI exit status', async () => {
  const { project } = await fixture()
  await mockStorybook(project, 'process.exit(23)\\n')
  assert.equal(run(project, 'build-storybook').status, 23)
})

test('Missing Storybook dependency exits before creating a child process', async () => {
  const { project } = await fixture()
  const result = run(project, 'storybook')
  assert.equal(result.status, 1)
  assert.match(result.stderr, /storybook\\/package\\.json/)
})

test('package scripts invoke the portable tool runner and include its regression tests', async () => {
  const packagePath = fileURLToPath(new URL('../package.json', import.meta.url))
  const pkg = JSON.parse(await readFile(packagePath, 'utf8'))
  assert.equal(pkg.scripts.dev, 'node scripts/run-project-tool.mjs dev')
  assert.equal(pkg.scripts.preview, 'node scripts/run-project-tool.mjs preview')
  assert.equal(pkg.scripts.storybook, 'node scripts/run-project-tool.mjs storybook')
  assert.equal(pkg.scripts['build-storybook'], 'node scripts/run-project-tool.mjs build-storybook')
  assert.equal(pkg.scripts['doctor:editor'], 'node scripts/run-project-tool.mjs doctor')
  assert.equal(
    pkg.scripts.test,
    'vitest run && node --test scripts/prepare.test.mjs scripts/run-project-tool.test.mjs',
  )
})
