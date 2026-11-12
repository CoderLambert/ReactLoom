import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

const source = readFileSync(new URL('./run-tool.mjs', import.meta.url), 'utf8')

function fixture(t) {
  const sandbox = mkdtempSync(join(tmpdir(), 'reactloom spa tool '))
  t.after(() => rmSync(sandbox, { force: true, recursive: true }))
  const project = join(sandbox, 'workspace with spaces', 'templates', 'spa')
  const local = join(project, 'scripts')
  const shared = join(sandbox, 'workspace with spaces', 'scripts')
  mkdirSync(local, { recursive: true })
  mkdirSync(shared, { recursive: true })
  writeFileSync(join(local, 'run-tool.mjs'), source)
  const marker = join(sandbox, 'called.json')
  const stub = (sourceName) =>
    [
      "import { writeFileSync } from 'node:fs'",
      'writeFileSync(process.env.TEST_MARKER, JSON.stringify({ source: ' +
        JSON.stringify(sourceName) +
        ', cwd: process.cwd(), args: process.argv.slice(2) }))',
      'process.exit(Number(process.env.TEST_EXIT_CODE || 0))',
      '',
    ].join('\n')
  return {
    marker,
    project,
    local,
    shared,
    stub,
    run(mode, args = [], exitCode = 0) {
      return spawnSync(process.execPath, ['scripts/run-tool.mjs', mode, ...args], {
        cwd: project,
        encoding: 'utf8',
        env: { ...process.env, TEST_MARKER: marker, TEST_EXIT_CODE: String(exitCode) },
      })
    },
  }
}

test('dev selects monorepo Lighthouse script and launches Vite using Node, not a .cmd shim', (t) => {
  const f = fixture(t)
  writeFileSync(join(f.shared, 'with-lighthouse.mjs'), f.stub('shared'))
  const result = f.run('dev', ['--strictPort'])
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(readFileSync(f.marker, 'utf8')), {
    source: 'shared',
    cwd: f.project,
    args: [
      'dev',
      '--',
      process.execPath,
      join(f.project, 'node_modules', 'vite', 'bin', 'vite.js'),
      '--host',
      '0.0.0.0',
      '--port',
      '4317',
      '--strictPort',
    ],
  })
})

test('preview prefers a standalone bundled script and passes Vite preview arguments', (t) => {
  const f = fixture(t)
  writeFileSync(join(f.shared, 'with-lighthouse.mjs'), f.stub('shared'))
  writeFileSync(join(f.local, 'with-lighthouse.mjs'), f.stub('standalone'))
  const result = f.run('preview')
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(readFileSync(f.marker, 'utf8')), {
    source: 'standalone',
    cwd: f.project,
    args: [
      'preview',
      '--',
      process.execPath,
      join(f.project, 'node_modules', 'vite', 'bin', 'vite.js'),
      'preview',
      '--host',
      '0.0.0.0',
      '--port',
      '4317',
    ],
  })
})

test('editor doctor passes the location as an argument with spaces intact', (t) => {
  const f = fixture(t)
  writeFileSync(join(f.local, 'open-in-editor.mjs'), f.stub('editor'))
  const result = f.run('doctor:editor', ['src/my component.tsx:17:4'])
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(readFileSync(f.marker, 'utf8')).args, [
    '--doctor',
    'src/my component.tsx:17:4',
  ])
})

test('a nonzero child exit status is propagated to pnpm', (t) => {
  const f = fixture(t)
  writeFileSync(join(f.shared, 'with-lighthouse.mjs'), f.stub('shared'))
  assert.equal(f.run('dev', [], 19).status, 19)
})

test('missing scripts and unsupported modes never report success', (t) => {
  const f = fixture(t)
  assert.notEqual(f.run('preview').status, 0)
  assert.notEqual(f.run('something-else').status, 0)
})
