import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

// The standalone CLI copies scripts/setup-git.mjs into this project; the
// monorepo keeps that script two levels above templates/mobile.
const projectRoot = process.cwd()
const localSetup = path.join(projectRoot, 'scripts', 'setup-git.mjs')
const workspaceSetup = path.resolve(projectRoot, '..', '..', 'scripts', 'setup-git.mjs')
let setupGit
if (existsSync(localSetup)) setupGit = localSetup
else if (existsSync(workspaceSetup)) setupGit = workspaceSetup

if (!setupGit) {
  console.error('Cannot find scripts/setup-git.mjs in the project or ReactLoom workspace.')
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
