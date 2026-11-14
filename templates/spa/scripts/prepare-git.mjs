import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const standaloneSetup = join(projectRoot, 'scripts', 'setup-git.mjs')
const workspaceSetup = resolve(projectRoot, '..', '..', 'scripts', 'setup-git.mjs')
const setup = existsSync(standaloneSetup) ? standaloneSetup : workspaceSetup

// Use Node instead of POSIX shell syntax so pnpm's lifecycle works on Windows.
const result = spawnSync(process.execPath, [setup], {
  cwd: projectRoot,
  stdio: 'inherit',
})

if (result.error) {
  console.error(result.error.message)
  process.exitCode = 1
} else {
  process.exitCode = result.status ?? 1
}
