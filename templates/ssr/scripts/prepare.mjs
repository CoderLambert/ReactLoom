import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

// The standalone scaffold copies setup-git.mjs into its own scripts directory.
// In this monorepo, the same script lives two directories above this template.
const projectRoot = process.cwd()
const localSetup = path.join(projectRoot, 'scripts', 'setup-git.mjs')
const workspaceRoot = path.resolve(projectRoot, '..', '..')
const workspaceSetup = path.join(workspaceRoot, 'scripts', 'setup-git.mjs')

// Never execute a coincidentally named script from a standalone app's ancestor
// during pnpm install. Only the actual monorepo template may use this fallback.
function isMonorepoTemplate() {
  if (
    path.relative(workspaceRoot, projectRoot) !== path.join('templates', 'ssr') ||
    !existsSync(path.join(workspaceRoot, 'pnpm-workspace.yaml'))
  ) {
    return false
  }
  try {
    const manifest = JSON.parse(readFileSync(path.join(workspaceRoot, 'package.json'), 'utf8'))
    return manifest.name === 'reactloom'
  } catch {
    return false
  }
}

const setupGit = existsSync(localSetup)
  ? localSetup
  : isMonorepoTemplate() && existsSync(workspaceSetup)
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
