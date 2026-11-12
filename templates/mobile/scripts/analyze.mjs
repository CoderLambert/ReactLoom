import { spawnSync } from 'node:child_process'

// Avoid POSIX-only inline environment assignments: generated projects are
// also installed and inspected through Windows' default cmd.exe shell.
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const stages = [
  {
    args: ['exec', 'expo', 'export', '--platform', 'web', '--output-dir', 'dist'],
    env: { ...process.env, EXPO_ATLAS: 'true' },
  },
  {
    args: ['exec', 'expo-atlas', '.expo/atlas.jsonl'],
    env: process.env,
  },
]

for (const { args, env } of stages) {
  // All arguments are literals, so shell mode cannot interpolate user input.
  // Windows needs cmd.exe to resolve pnpm.cmd; POSIX can spawn pnpm directly.
  const result = spawnSync(pnpm, args, {
    cwd: process.cwd(),
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.error) {
    console.error(`Unable to run ${pnpm} ${args.join(' ')}:`, result.error)
    process.exitCode = 1
    break
  }
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1
    break
  }
}
