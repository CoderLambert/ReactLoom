import { spawn } from 'node:child_process'

// Windows exposes Corepack/npm's pnpm shim as pnpm.cmd. Node cannot execute a
// .cmd file directly with shell: false; use cmd.exe with a fixed command instead.
// No project name, directory or user-provided argument enters the command string.
function pnpmInvocation(action: 'install' | 'dev', platform: NodeJS.Platform, comspec = 'cmd.exe') {
  return platform === 'win32'
    ? { command: comspec, args: ['/d', '/s', '/c', `pnpm ${action}`] }
    : { command: 'pnpm', args: [action] }
}

export function installInvocation(platform: NodeJS.Platform, comspec = 'cmd.exe') {
  return pnpmInvocation('install', platform, comspec)
}

export function devInvocation(platform: NodeJS.Platform, comspec = 'cmd.exe') {
  return pnpmInvocation('dev', platform, comspec)
}

export function runInstall(
  cwd: string,
  environment: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): Promise<void> {
  const { command, args } = installInvocation(platform, environment.ComSpec)
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env: environment, stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (code === 0) resolve()
      else if (signal) reject(new Error('pnpm install terminated by ' + signal))
      else reject(new Error('pnpm install exited with code ' + (code ?? 'unknown')))
    })
  })
}
