import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const standaloneSetup = join(projectRoot, 'scripts', 'setup-git.mjs')
const workspaceRoot = resolve(projectRoot, '..', '..')
const workspaceSetup = join(workspaceRoot, 'scripts', 'setup-git.mjs')

// A scaffolded SPA must never execute an unrelated ancestor's install script.
// Only the in-repository template can fall back to the ReactLoom root script.
function isMonorepoTemplate() {
  if (
    relative(workspaceRoot, projectRoot) !== join('templates', 'spa') ||
    !existsSync(join(workspaceRoot, 'pnpm-workspace.yaml'))
  ) {
    return false
  }
  try {
    const manifest = JSON.parse(readFileSync(join(workspaceRoot, 'package.json'), 'utf8'))
    return manifest.name === 'reactloom'
  } catch {
    return false
  }
}

const setup = existsSync(standaloneSetup)
  ? standaloneSetup
  : isMonorepoTemplate() && existsSync(workspaceSetup)
    ? workspaceSetup
    : null

if (!setup) {
  console.error('Cannot find scripts/setup-git.mjs in the SPA project or ReactLoom workspace.')
  process.exitCode = 1
} else {
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
}
