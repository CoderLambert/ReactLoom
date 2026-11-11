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
  const project = join(sandbox, 'workspace with spaces', 'templates', 'spa')
  const localScripts = join(project, 'scripts')
  const rootScripts = join(sandbox, 'workspace with spaces', 'scripts')
  mkdirSync(localScripts, { recursive: true })
  mkdirSync(rootScripts, { recursive: true })
  writeFileSync(join(localScripts, 'prepare-git.mjs'), source)
  const marker = join(sandbox, 'ran.txt')

  return {
    marker,
    project,
    local: join(localScripts, 'setup-git.mjs'),
    workspace: join(rootScripts, 'setup-git.mjs'),
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
