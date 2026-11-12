import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

const projectRoot = process.cwd()
const mode = process.argv[2]
const forwarded = process.argv.slice(3)

function findScript(name) {
  const local = path.join(projectRoot, 'scripts', name)
  if (existsSync(local)) return local
  const workspace = path.resolve(projectRoot, '..', '..', 'scripts', name)
  if (existsSync(workspace)) return workspace
  throw new Error('Cannot find scripts/' + name + ' in the SSR project or ReactLoom workspace.')
}

function commandFor(mode) {
  if (mode === 'doctor') {
    return [findScript('open-in-editor.mjs'), '--doctor', ...forwarded]
  }
  if (mode === 'dev') {
    return [
      findScript('with-lighthouse.mjs'),
      'dev',
      '--',
      process.execPath,
      path.join(projectRoot, 'scripts', 'open-browser.mjs'),
      '--',
      'next',
      'dev',
      '--hostname',
      '0.0.0.0',
      '--port',
      '4318',
    ]
  }
  if (mode === 'preview') {
    // Use Next's JS entry, not the platform-specific node_modules/.bin/next(.cmd).
    const nextBin = createRequire(path.join(projectRoot, 'package.json')).resolve('next/dist/bin/next')
    return [
      findScript('with-lighthouse.mjs'),
      'preview',
      '--',
      process.execPath,
      nextBin,
      'start',
      '--hostname',
      '0.0.0.0',
      '--port',
      '4318',
    ]
  }
  throw new Error('Usage: node scripts/run-project-tool.mjs <dev|preview|doctor> [location]')
}

try {
  const [script, ...args] = commandFor(mode)
  const child = spawn(process.execPath, [script, ...args], { cwd: projectRoot, stdio: 'inherit' })
  const forwardSignal = (signal) => {
    if (!child.killed) child.kill(signal)
  }
  process.on('SIGINT', forwardSignal)
  process.on('SIGTERM', forwardSignal)
  child.on('error', (error) => {
    console.error(error)
    process.exitCode = 1
  })
  child.on('exit', (code, signal) => {
    process.off('SIGINT', forwardSignal)
    process.off('SIGTERM', forwardSignal)
    if (signal) process.kill(process.pid, signal)
    else process.exitCode = code ?? 1
  })
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
