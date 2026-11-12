import assert from 'node:assert/strict'
import { chmod, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, test } from 'node:test'
import { installInvocation, runInstall } from './install.ts'

const roots = []

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'reactloom-install-'))
  roots.push(root)
  const cwd = path.join(root, 'new project & space')
  const bin = path.join(root, 'bin')
  const trace = path.join(root, 'trace.txt')
  await Promise.all([mkdir(cwd), mkdir(bin)])
  const stub = path.join(bin, 'pnpm')
  await writeFile(
    stub,
    '#!/bin/sh\nprintf "%s\\n%s\\n" "$PWD" "$1" > "$TRACE"\nexit "$MOCK_EXIT"\n',
  )
  await chmod(stub, 0o755)
  return {
    cwd,
    trace,
    env: { ...process.env, PATH: bin, TRACE: trace, MOCK_EXIT: '0' },
  }
}

test('Windows uses cmd.exe to resolve pnpm.cmd without interpolating the destination', () => {
  assert.deepEqual(installInvocation('win32', 'C:\\Windows\\System32\\cmd.exe'), {
    command: 'C:\\Windows\\System32\\cmd.exe',
    args: ['/d', '/s', '/c', 'pnpm install'],
  })
  assert.deepEqual(installInvocation('win32'), {
    command: 'cmd.exe',
    args: ['/d', '/s', '/c', 'pnpm install'],
  })
})

test('POSIX invokes pnpm directly without a shell', () => {
  assert.deepEqual(installInvocation('linux'), { command: 'pnpm', args: ['install'] })
})

test('runs the actual install subprocess from a destination containing shell metacharacters', async () => {
  const f = await fixture()
  await runInstall(f.cwd, f.env, 'linux')
  assert.equal(await readFile(f.trace, 'utf8'), f.cwd + '\ninstall\n')
})

test('propagates a nonzero pnpm exit code', async () => {
  const f = await fixture()
  await assert.rejects(runInstall(f.cwd, { ...f.env, MOCK_EXIT: '23' }, 'linux'), /code 23/)
})

test('reports a missing pnpm executable rather than a successful scaffold install', async () => {
  const f = await fixture()
  await assert.rejects(runInstall(f.cwd, { ...f.env, PATH: f.cwd }, 'linux'), /ENOENT/)
})
