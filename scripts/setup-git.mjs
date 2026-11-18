import { spawnSync } from 'node:child_process'
import { realpathSync } from 'node:fs'

const root = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' })
if (root.status !== 0) process.exit(0)
if (realpathSync(root.stdout.trim()) !== realpathSync(process.cwd())) process.exit(0)

const current = spawnSync('git', ['config', '--local', '--get', 'commit.template'], {
  encoding: 'utf8',
})
if (current.status === 0 && current.stdout.trim() === '.gitmessage') process.exit(0)

const configured = spawnSync('git', ['config', '--local', 'commit.template', '.gitmessage'], {
  encoding: 'utf8',
})
if (configured.status !== 0) {
  if (configured.stderr?.includes('could not lock config file')) {
    process.stderr.write('Warning: git config is locked; skipping commit template setup.\n')
    process.exit(0)
  }
  process.stderr.write(configured.stderr || 'git config commit.template failed\n')
  process.exit(configured.status ?? 1)
}
