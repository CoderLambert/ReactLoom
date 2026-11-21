import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmod, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, test } from 'node:test'
import { fileURLToPath } from 'node:url'

const analyzeScript = fileURLToPath(new URL('./analyze.mjs', import.meta.url))
const fixtures = []

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'reactloom-mobile-atlas-'))
  fixtures.push(root)
  const project = path.join(root, 'project')
  const bin = path.join(root, 'bin')
  await Promise.all([mkdir(project), mkdir(bin)])
  await writeFile(
    path.join(bin, 'mock-pnpm.cjs'),
    `const fs = require('node:fs')
fs.appendFileSync(process.env.REACTLOOM_ATLAS_TRACE, JSON.stringify({
  args: process.argv.slice(2),
  atlas: process.env.EXPO_ATLAS ?? null,
  cwd: process.cwd(),
}) + '\\n')
if (process.argv[3] === process.env.REACTLOOM_ATLAS_FAIL_STAGE) {
  process.exit(Number(process.env.REACTLOOM_ATLAS_FAIL_CODE))
}
`,
  )
  if (process.platform === 'win32') {
    await writeFile(
      path.join(bin, 'pnpm.cmd'),
      '@echo off\r\nnode "%~dp0\\mock-pnpm.cjs" %*\r\n',
    )
  } else {
    const executable = path.join(bin, 'pnpm')
    await writeFile(
      executable,
      '#!/bin/sh\nexec node "$(dirname "$0")/mock-pnpm.cjs" "$@"\n',
    )
    await chmod(executable, 0o755)
  }
  return { root, project, bin, trace: path.join(root, 'trace.jsonl') }
}

function run({ project, bin, trace }, extra = {}) {
  const env = {
    ...process.env,
    PATH: `${bin}${path.delimiter}${process.env.PATH ?? ''}`,
    REACTLOOM_ATLAS_TRACE: trace,
    ...extra,
  }
  delete env.EXPO_ATLAS
  return spawnSync(process.execPath, [analyzeScript], { cwd: project, env, encoding: 'utf8' })
}

async function traces({ trace }) {
  return (await readFile(trace, 'utf8'))
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))
}

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

test('exports with Atlas enabled and opens the report from the project root', async () => {
  const f = await fixture()
  assert.equal(run(f).status, 0)
  assert.deepEqual(await traces(f), [
    {
      args: ['exec', 'expo', 'export', '--platform', 'web', '--output-dir', 'dist'],
      atlas: 'true',
      cwd: f.project,
    },
    { args: ['exec', 'expo-atlas', '.expo/atlas.jsonl'], atlas: null, cwd: f.project },
  ])
})

test('failed export skips a stale Atlas report and propagates exit code', async () => {
  const f = await fixture()
  assert.equal(
    run(f, { REACTLOOM_ATLAS_FAIL_STAGE: 'expo', REACTLOOM_ATLAS_FAIL_CODE: '19' }).status,
    19,
  )
  assert.equal((await traces(f)).length, 1)
})

test('Atlas viewer failures propagate their exit codes', async () => {
  const f = await fixture()
  assert.equal(
    run(f, { REACTLOOM_ATLAS_FAIL_STAGE: 'expo-atlas', REACTLOOM_ATLAS_FAIL_CODE: '27' }).status,
    27,
  )
  assert.equal((await traces(f)).length, 2)
})

test('missing pnpm returns failure without running Expo or Atlas', async () => {
  const f = await fixture()
  const result = spawnSync(process.execPath, [analyzeScript], {
    cwd: f.project,
    env: { PATH: '', SystemRoot: process.env.SystemRoot },
    encoding: 'utf8',
  })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /Unable to run pnpm/)
})

test('package script and template manifest both point to the portable runner', async () => {
  const project = fileURLToPath(new URL('..', import.meta.url))
  const pkg = JSON.parse(await readFile(path.join(project, 'package.json'), 'utf8'))
  const manifest = JSON.parse(await readFile(path.join(project, 'template.json'), 'utf8'))
  assert.equal(pkg.scripts.analyze, 'node scripts/analyze.mjs')
  assert.equal(manifest.bundleAnalyze.script, pkg.scripts.analyze)
  assert.match(pkg.scripts.test, /scripts\/analyze\.test\.mjs/)
})
