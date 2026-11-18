import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const result = spawnSync(process.execPath, ['--test', 'tests/sdk.test.mjs'], {
  cwd: fileURLToPath(new URL('../', import.meta.url)),
  stdio: 'inherit',
  shell: false,
  timeout: 30_000,
})
if (result.error) throw result.error
process.exitCode = result.status ?? 1
