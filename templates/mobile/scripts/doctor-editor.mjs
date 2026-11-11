import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

// Standalone projects receive the editor launcher from the scaffold manifest;
// the monorepo keeps it two directories above templates/mobile.
const projectRoot = process.cwd()
const localLauncher = path.join(projectRoot, 'scripts', 'open-in-editor.mjs')
const workspaceLauncher = path.resolve(projectRoot, '..', '..', 'scripts', 'open-in-editor.mjs')
const launcher = existsSync(localLauncher)
  ? localLauncher
  : existsSync(workspaceLauncher)
    ? workspaceLauncher
    : null

if (!launcher) {
  console.error('Cannot find scripts/open-in-editor.mjs in the project or ReactLoom workspace.')
  process.exitCode = 1
} else {
  const result = spawnSync(process.execPath, [launcher, '--doctor', ...process.argv.slice(2)], {
    cwd: projectRoot,
    stdio: 'inherit',
  })
  if (result.error) {
    console.error(result.error)
    process.exitCode = 1
  } else {
    process.exitCode = result.status ?? 1
  }
}
