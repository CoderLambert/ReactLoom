import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

// The standalone CLI copies scripts/setup-git.mjs into this project; the
// monorepo keeps that script two levels above templates/mobile.
const projectRoot = process.cwd()
const localSetup = path.join(projectRoot, 'scripts', 'setup-git.mjs')
const workspaceRoot = path.resolve(projectRoot, '..', '..')
const workspaceSetup = path.join(workspaceRoot, 'scripts', 'setup-git.mjs')
// A generated app is independent of its grandparent. Only the in-repository
// templates/mobile package may execute the ReactLoom root's setup script.
const isMonorepoTemplate =
  path.join(workspaceRoot, 'templates', 'mobile') === projectRoot &&
  existsSync(path.join(workspaceRoot, 'pnpm-workspace.yaml')) &&
  existsSync(path.join(workspaceRoot, 'packages', 'create-reactloom', 'package.json'))
let setupGit
if (existsSync(localSetup)) setupGit = localSetup
else if (isMonorepoTemplate && existsSync(workspaceSetup)) setupGit = workspaceSetup

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
