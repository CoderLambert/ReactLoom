import { spawnSync } from 'node:child_process'
import { mkdir, readFile, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { verifyScopedMswWorker } from './verify-msw-worker.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(import.meta.url)
const manifestPath = require.resolve('msw/package.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const bin = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin?.msw
if (typeof bin !== 'string') throw new Error('Installed MSW has no CLI entry')
const packageRoot = path.dirname(manifestPath),
  cli = path.resolve(packageRoot, bin)
if (!cli.startsWith(packageRoot + path.sep))
  throw new Error('MSW CLI path escaped its installed package')
const target = path.join(root, 'runners/msw/public')
await mkdir(target, { recursive: true })
const result = spawnSync(process.execPath, [cli, 'init', target, '--no-save'], {
  cwd: root,
  stdio: 'inherit',
  shell: false,
})
if (result.error) throw result.error
if (result.status !== 0) throw new Error('Official MSW asset generation failed')
console.log(JSON.stringify(await verifyScopedMswWorker(root)))
// Remove only the obsolete generated main-origin asset, not unrelated user files.
await rm(path.join(root, 'public/lab-runners/msw/mockServiceWorker.js'), { force: true })
