/** Select work from actual Git changes. An unreadable base is never an empty diff. */
import { execFileSync } from 'node:child_process'
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const full = (reason) => ({ runtime: true, all: true, entries: [], reason })
export function classifyChanges(files) {
  if (!Array.isArray(files) || files.some((file) => typeof file !== 'string'))
    throw new TypeError('Expected changed file paths')
  const entries = new Set()
  for (const file of files) {
    if (
      file.startsWith('docs/') ||
      file === 'README.md' ||
      file === 'AGENTS.md' ||
      file === 'LIBRARY_CATALOG.md' ||
      file === 'library-catalog.json'
    )
      continue
    const entry = file.match(/^packages\/library-lab\/entries\/([A-F]\d{2})-[a-z0-9-]+\/(.+)$/u)
    if (entry) {
      if (/^(?:guide\.md|agent\.md|AGENTS\.md|verification\.json)$/u.test(entry[2])) continue
      entries.add(entry[1])
      continue
    }
    if (file.startsWith('packages/library-lab/') && /\/(?:README|AGENTS)\.md$/u.test(file)) continue
    if (
      file.startsWith('packages/library-lab/') ||
      file.startsWith('packages/tsconfig/') ||
      file.startsWith('.github/workflows/') ||
      [
        'pnpm-lock.yaml',
        'package.json',
        'pnpm-workspace.yaml',
        '.npmrc',
        'turbo.json',
        'biome.json',
        '.node-version',
        '.nvmrc',
      ].includes(file)
    )
      return full('Shared execution input changed: ' + file)
  }
  return {
    runtime: entries.size > 0,
    all: false,
    entries: [...entries].sort(),
    reason: entries.size ? 'Entry runtime changes' : 'Documentation/metadata only',
  }
}
export function planFromGit(base, root = ROOT) {
  if (!/^[a-f0-9]{7,40}$/u.test(base ?? '') || /^0+$/u.test(base))
    return full('No trustworthy comparison base')
  try {
    const output = execFileSync(
      'git',
      ['diff', '--no-renames', '--name-only', '-z', `${base}..HEAD`, '--'],
      { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    )
    return classifyChanges(output.split('\0').filter(Boolean))
  } catch {
    return full('Git comparison failed')
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const plan =
    process.env.GITHUB_EVENT_NAME === 'workflow_dispatch'
      ? full('Explicit validation')
      : planFromGit(process.env.POLICY_COMPARE_BASE, ROOT)
  let lockReady = false
  try {
    lockReady = /^ {2}packages\/library-lab:\s*$/mu.test(
      readFileSync(path.join(ROOT, 'pnpm-lock.yaml'), 'utf8'),
    )
  } catch {}
  writeFileSync('ci-scope.json', JSON.stringify(plan, null, 2) + '\n')
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `runtime=${plan.runtime}\nall=${plan.all}\nentries=${plan.entries.join(',')}\nlock_ready=${lockReady}\n`,
    )
  console.log(JSON.stringify({ ...plan, lockReady }))
}
