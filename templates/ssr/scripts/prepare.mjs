import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

// The standalone scaffold copies setup-git.mjs into its own scripts directory.
// In this monorepo, the same script lives two directories above this template.
const projectRoot = process.cwd()
const localSetup = path.join(projectRoot, 'scripts', 'setup-git.mjs')
const workspaceSetup = path.resolve(projectRoot, '..', '..', 'scripts', 'setup-git.mjs')
const setupGit = existsSync(localSetup)
  ? localSetup
  : existsSync(workspaceSetup)
    ? workspaceSetup
    : null

if (!setupGit) {
  console.error('Cannot find scripts/setup-git.mjs in the SSR project or ReactLoom workspace.')
  process.exitCode = 1
} else {
  const result = spawnSync(process.execPath, [setupGit], {
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
