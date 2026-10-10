import { spawnSync } from 'node:child_process'

const inside = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { encoding: 'utf8' })
if (inside.status !== 0) process.exit(0)

const configured = spawnSync('git', ['config', '--local', 'commit.template', '.gitmessage'], {
  encoding: 'utf8',
})
if (configured.status !== 0) {
  process.stderr.write(configured.stderr || 'git config commit.template failed\n')
  process.exit(configured.status ?? 1)
}
