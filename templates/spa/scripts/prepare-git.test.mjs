import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

const source = readFileSync(new URL('./prepare-git.mjs', import.meta.url), 'utf8')

function fixture(t) {
  const sandbox = mkdtempSync(join(tmpdir(), 'reactloom spa prepare '))
  t.after(() => rmSync(sandbox, { force: true, recursive: true }))
  const workspaceRoot = join(sandbox, 'workspace with spaces')
  const project = join(workspaceRoot, 'templates', 'spa')
  const localScripts = join(project, 'scripts')
  const rootScripts = join(workspaceRoot, 'scripts')
  mkdirSync(localScripts, { recursive: true })
  mkdirSync(rootScripts, { recursive: true })
  writeFileSync(join(localScripts, 'prepare-git.mjs'), source)
  const marker = join(sandbox, 'ran.txt')

  return {
    marker,
    project,
    workspaceRoot,
    local: join(localScripts, 'setup-git.mjs'),
    workspace: join(rootScripts, 'setup-git.mjs'),
    markWorkspace(name = 'reactloom') {
      writeFileSync(join(workspaceRoot, 'pnpm-workspace.yaml'), 'packages:\n  - templates/*\n')
      writeFileSync(join(workspaceRoot, 'package.json'), JSON.stringify({ name }))
    },
    run() {
      return spawnSync(process.execPath, ['scripts/prepare-git.mjs'], {
        cwd: project,
        env: { ...process.env, TEST_MARKER: marker },
        encoding: 'utf8',
      })
    },
  }
}

const successScript = (source) =>
  `import { writeFileSync } from 'node:fs'\nwriteFileSync(process.env.TEST_MARKER, JSON.stringify({ source: '${source}', cwd: process.cwd() }))\n`

test('workspace lifecycle uses the shared setup script when no local copy exists', (t) => {
  const f = fixture(t)
  f.markWorkspace()
  writeFileSync(f.workspace, successScript('workspace'))
  const result = f.run()
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(readFileSync(f.marker, 'utf8')), {
    source: 'workspace',
    cwd: f.project,
  })
})

test('standalone lifecycle prefers its bundled setup script', (t) => {
  const f = fixture(t)
  writeFileSync(f.workspace, successScript('workspace'))
  writeFileSync(f.local, successScript('standalone'))
  const result = f.run()
  assert.equal(result.status, 0, result.stderr)
  assert.equal(JSON.parse(readFileSync(f.marker, 'utf8')).source, 'standalone')
})

test('propagates nonzero git configuration failures', (t) => {
  const f = fixture(t)
  writeFileSync(f.local, 'process.exit(19)\n')
  assert.equal(f.run().status, 19)
})

test('does not report successful prepare when neither script is available', (t) => {
  const f = fixture(t)
  const result = f.run()
  assert.notEqual(result.status, 0)
  assert.equal(existsSync(f.marker), false)
})

test('detached SPA does not execute an unrelated ancestor setup script', (t) => {
  const f = fixture(t)
  writeFileSync(f.workspace, successScript('untrusted ancestor'))
  const result = f.run()
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Cannot find scripts\/setup-git.mjs/)
  assert.equal(existsSync(f.marker), false)
})

test('a different workspace must not authorize ancestor setup execution', (t) => {
  const f = fixture(t)
  f.markWorkspace('unrelated-project')
  writeFileSync(f.workspace, successScript('unrelated workspace'))
  const result = f.run()
  assert.notEqual(result.status, 0)
  assert.equal(existsSync(f.marker), false)
})

test('missing or invalid workspace manifest cannot authorize ancestor execution', (t) => {
  const f = fixture(t)
  f.markWorkspace()
  writeFileSync(join(f.workspaceRoot, 'package.json'), '{ invalid json')
  writeFileSync(f.workspace, successScript('invalid workspace'))
  const result = f.run()
  assert.notEqual(result.status, 0)
  assert.equal(existsSync(f.marker), false)
})
