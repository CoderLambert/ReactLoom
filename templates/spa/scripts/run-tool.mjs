import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const [mode, ...extra] = process.argv.slice(2)
const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js')

function storybookBin() {
  const packageDir = join(root, 'node_modules', 'storybook')
  const manifest = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'))
  const entry = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin?.storybook
  if (typeof entry !== 'string' || !entry) {
    throw new Error('Installed Storybook package has no storybook CLI entry')
  }
  return resolve(packageDir, entry)
}

const commands = {
  dev: {
    script: 'with-lighthouse.mjs',
    args: ['dev', '--', process.execPath, viteBin, '--host', '0.0.0.0', '--port', '4317', ...extra],
  },
  preview: {
    script: 'with-lighthouse.mjs',
    args: [
      'preview',
      '--',
      process.execPath,
      viteBin,
      'preview',
      '--host',
      '0.0.0.0',
      '--port',
      '4317',
      ...extra,
    ],
  },
  analyze: {
    binary: viteBin,
    args: ['build', ...extra],
    env: { ANALYZE: 'true' },
  },
  storybook: {
    storybook: true,
    args: ['dev', '-p', '6006', '--no-open', ...extra],
    env: { STORYBOOK: 'true' },
  },
  'build-storybook': {
    storybook: true,
    args: ['build', ...extra],
    env: { STORYBOOK: 'true' },
  },
  'doctor:editor': { script: 'open-in-editor.mjs', args: ['--doctor', ...extra] },
}

const command = commands[mode]
if (!command) {
  console.error('Usage: node scripts/run-tool.mjs <dev|preview|analyze|storybook|build-storybook|doctor:editor> [args...]')
  process.exitCode = 1
} else {
  const local = command.script && join(root, 'scripts', command.script)
  const shared = command.script && resolve(root, '..', '..', 'scripts', command.script)
  const target = command.storybook
    ? storybookBin()
    : (command.binary ?? (local && existsSync(local) ? local : shared))
  const child = spawn(process.execPath, [target, ...command.args], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...command.env },
  })
  const stop = (signal) => child.kill(signal)
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
  child.on('error', (error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  child.on('exit', (code, signal) => {
    process.off('SIGINT', stop)
    process.off('SIGTERM', stop)
    process.exitCode = signal ? 1 : (code ?? 1)
  })
}
