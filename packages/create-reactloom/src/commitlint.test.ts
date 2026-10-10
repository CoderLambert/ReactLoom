import { execFile } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

async function judge(message: string): Promise<boolean> {
  const directory = await mkdtemp(path.join(tmpdir(), 'reactloom-commit-'))
  const file = path.join(directory, 'message')
  await writeFile(file, message)
  try {
    await execFileAsync('pnpm', ['exec', 'commitlint', '--edit', file], { cwd: repoRoot })
    return true
  } catch {
    return false
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

const good = `feat(spa-auth): restore the session before the router guard

What changed: beforeLoad reads the Zustand snapshot synchronously.
Why: a hydration effect redirected users who were already logged in.
Impact scope: SPA login and authenticated routes.
`

describe('commitlint', () => {
  it('accepts a scoped message that says why and names the impact', async () => {
    await expect(judge(good)).resolves.toBe(true)
  })

  it('rejects a missing scope, a vague subject, and a feat without a body', async () => {
    await expect(judge('feat: update files\n')).resolves.toBe(false)
    await expect(judge('fix(spa): fix stuff\n\nWhy: no. Impact: spa.\n')).resolves.toBe(false)
    await expect(judge('feat(ci): cache the playwright browsers\n')).resolves.toBe(false)
  })
})
