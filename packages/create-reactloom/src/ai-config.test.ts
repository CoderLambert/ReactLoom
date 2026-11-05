import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { installAiConfig } from './ai-config.js'

const created: string[] = []

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'reactloom-ai-collision-'))
  created.push(root)
  const repoRoot = path.join(root, 'repo')
  const directory = path.join(root, 'generated')
  await mkdir(path.join(repoRoot, '.cursor', 'rules'), { recursive: true })
  await mkdir(directory)
  await writeFile(
    path.join(repoRoot, '.cursor', 'rules', 'general.mdc'),
    'See templates/mobile/app\n',
  )
  await writeFile(path.join(repoRoot, 'CLAUDE.md'), 'Open templates/mobile/app\n')
  await writeFile(path.join(directory, 'AGENTS.md'), 'Use templates/mobile/app\n')
  return { root, repoRoot, directory }
}

function options(repoRoot: string, directory: string) {
  return {
    repoRoot,
    directory,
    template: 'mobile' as const,
    projectName: 'example-mobile',
    rules: ['general.mdc'],
    pointers: ['CLAUDE.md'],
  }
}

afterEach(async () => {
  await Promise.all(
    created.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  )
})

describe('AI configuration target collisions', () => {
  it('keeps a template-supplied AI pointer instead of overwriting it', async () => {
    const { repoRoot, directory } = await fixture()
    const pointer = path.join(directory, 'CLAUDE.md')
    await writeFile(pointer, 'template-specific instructions\n')

    await expect(installAiConfig(options(repoRoot, directory))).rejects.toThrow(
      'AI configuration target already exists: CLAUDE.md',
    )
    expect(await readFile(pointer, 'utf8')).toBe('template-specific instructions\n')
  })

  it('keeps a template-supplied Cursor rule instead of overwriting it', async () => {
    const { repoRoot, directory } = await fixture()
    const rule = path.join(directory, '.cursor', 'rules', 'general.mdc')
    await mkdir(path.dirname(rule), { recursive: true })
    await writeFile(rule, 'existing rule\n')

    await expect(installAiConfig(options(repoRoot, directory))).rejects.toThrow(
      /AI configuration target already exists: .*general.mdc/,
    )
    expect(await readFile(rule, 'utf8')).toBe('existing rule\n')
  })

  it('rejects existing symlink targets without modifying their contents', async () => {
    const { root, repoRoot, directory } = await fixture()
    const external = path.join(root, 'original.md')
    await writeFile(external, 'external content\n')
    await symlink(external, path.join(directory, 'CLAUDE.md'))

    await expect(installAiConfig(options(repoRoot, directory))).rejects.toThrow(
      'AI configuration target already exists: CLAUDE.md',
    )
    expect(await readFile(external, 'utf8')).toBe('external content\n')
  })

  it('still creates and adapts non-conflicting AI files', async () => {
    const { repoRoot, directory } = await fixture()
    await installAiConfig(options(repoRoot, directory))

    expect(await readFile(path.join(directory, 'AGENTS.md'), 'utf8')).toBe('Use app\n')
    expect(await readFile(path.join(directory, '.cursor', 'rules', 'general.mdc'), 'utf8')).toBe(
      'See app\n',
    )
    expect(await readFile(path.join(directory, 'CLAUDE.md'), 'utf8')).toBe('Open app\n')
  })
})
