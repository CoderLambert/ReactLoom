import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync, chmodSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const dockerfile = readFileSync(path.join(projectRoot, 'Dockerfile.standalone'), 'utf8')

// Evaluate the actual Docker RUN shell body, not an independently retyped condition.
function installCommand() {
  const lines = dockerfile.split(/\r?\n/)
  const start = lines.findIndex((line) => line.startsWith('RUN if [ -f pnpm-lock.yaml ]; then'))
  assert.notEqual(start, -1, 'Docker install must branch on lockfile presence')
  let index = start
  let part = lines[index].slice(4)
  let command = ''
  while (true) {
    const continued = part.trimEnd().endsWith('\\')
    command += `${part.replace(/\\\s*$/, '').trim()} `
    if (!continued) break
    part = lines[++index]
    assert.ok(part, 'Docker RUN continuation is incomplete')
  }
  return command
}

function runInstall({ lockfile, exitStatus }) {
  const cwd = mkdtempSync(path.join(os.tmpdir(), 'reactloom-ssr-docker-lock-'))
  try {
    const bin = path.join(cwd, 'bin')
    mkdirSync(bin)
    const fakePnpm = path.join(bin, 'pnpm')
    writeFileSync(
      fakePnpm,
      '#!/bin/sh\nprintf "%s\\n" "$*" >> "$PNPM_CALLS"\nexit "$PNPM_EXIT_STATUS"\n',
    )
    chmodSync(fakePnpm, 0o755)
    if (lockfile) writeFileSync(path.join(cwd, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\n')
    const callsFile = path.join(cwd, 'calls.txt')
    const run = spawnSync('sh', ['-ec', installCommand()], {
      cwd,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${bin}${path.delimiter}${process.env.PATH ?? ''}`,
        PNPM_CALLS: callsFile,
        PNPM_EXIT_STATUS: String(exitStatus),
      },
    })
    const calls = readFileSync(callsFile, 'utf8').trim().split('\n')
    return { status: run.status, calls, stderr: run.stderr }
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
}

test('a generated project with a lockfile uses only a frozen install', () => {
  const result = runInstall({ lockfile: true, exitStatus: 0 })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(result.calls, ['install --frozen-lockfile'])
})

test('an install failure with a lockfile must fail instead of re-resolving dependencies', () => {
  const result = runInstall({ lockfile: true, exitStatus: 37 })
  assert.equal(result.status, 37)
  assert.deepEqual(result.calls, ['install --frozen-lockfile'])
})

test('a generated project without a lockfile permits first dependency resolution', () => {
  const result = runInstall({ lockfile: false, exitStatus: 0 })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(result.calls, ['install --no-frozen-lockfile'])
})

test('failure without a lockfile propagates the installer exit status', () => {
  const result = runInstall({ lockfile: false, exitStatus: 29 })
  assert.equal(result.status, 29)
  assert.deepEqual(result.calls, ['install --no-frozen-lockfile'])
})

test('package test lifecycle includes the Docker lockfile contract', () => {
  const manifest = JSON.parse(readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))
  assert.match(manifest.scripts.test, /node --test .*scripts\/docker-lockfile\.test\.mjs/)
})
