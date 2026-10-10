import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { adaptAiText } from './ai-config.js'
import { parseCliArgs } from './cli.js'
import { scaffold } from './scaffold.js'

const created: string[] = []

afterEach(async () => {
  await Promise.all(created.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function tempParent(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'reactloom-'))
  created.push(dir)
  return dir
}

describe('create-reactloom', () => {
  it('parses flags and a positional name', () => {
    expect(parseCliArgs(['studio', '--template', 'ssr', '--yes', '--install'])).toMatchObject({
      name: 'studio',
      template: 'ssr',
      yes: true,
      install: true,
    })
  })

  it('scaffolds the spa template and removes template-only files', async () => {
    const parent = await tempParent()
    const directory = path.join(parent, 'studio')
    await scaffold({ name: 'studio', template: 'spa', directory })

    const pkg = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8')) as {
      name: string
      dependencies: Record<string, string>
    }
    expect(pkg.name).toBe('studio')
    expect(pkg.dependencies['@reactloom/api-client']).toBe('workspace:*')
    await expect(stat(path.join(directory, 'template.json'))).rejects.toThrow()
    await expect(stat(path.join(directory, 'src', 'main.tsx'))).resolves.toBeTruthy()
    await expect(
      stat(path.join(directory, 'packages', 'api-client', 'src', 'index.ts')),
    ).resolves.toBeTruthy()
    await expect(
      stat(path.join(directory, 'packages', 'tsconfig', 'base.json')),
    ).resolves.toBeTruthy()
    await expect(stat(path.join(directory, 'biome.json'))).resolves.toBeTruthy()
    const workspace = await readFile(path.join(directory, 'pnpm-workspace.yaml'), 'utf8')
    expect(workspace).toContain('packages/*')
    const envExample = await readFile(path.join(directory, '.env.example'), 'utf8')
    expect(envExample).toContain('VITE_API_BASE_URL')
    await expect(stat(path.join(directory, '.env'))).rejects.toThrow()
  })

  it('scaffolds ssr with a standalone Dockerfile and rewritten trace root', async () => {
    const parent = await tempParent()
    const directory = path.join(parent, 'web')
    await scaffold({ name: 'web', template: 'ssr', directory })

    await expect(stat(path.join(directory, 'Dockerfile'))).resolves.toBeTruthy()
    await expect(stat(path.join(directory, 'Dockerfile.monorepo'))).rejects.toThrow()
    await expect(stat(path.join(directory, 'Dockerfile.standalone'))).rejects.toThrow()
    const config = await readFile(path.join(directory, 'next.config.ts'), 'utf8')
    expect(config).toContain('import.meta.dirname')
    expect(config).not.toContain('../..')
  })

  it('rejects unsafe project names', async () => {
    const parent = await tempParent()
    await expect(
      scaffold({ name: 'Bad Name', template: 'mobile', directory: path.join(parent, 'app') }),
    ).rejects.toThrow(/lowercase/)
  })

  it('rewrites template names and drops other template globs', () => {
    const adapted = adaptAiText(
      [
        'Package `@reactloom/template-spa` at `templates/spa`.',
        'Code lives in `templates/spa/src/features`.',
        'globs: "templates/spa/**/*.ts,templates/ssr/**/*.ts,packages/**/*.ts"',
      ].join('\n'),
      'spa',
      'studio',
    )
    expect(adapted).toContain('Package `studio` at `.`.')
    expect(adapted).toContain('Code lives in `src/features`.')
    expect(adapted).not.toContain('templates/')
    expect(adapted).not.toContain('@reactloom/template-spa')
    expect(adapted).toContain('globs: **/*.ts,packages/**/*.ts')
  })

  it('keeps commas inside glob braces while dropping other templates', () => {
    const adapted = adaptAiText(
      'globs: "templates/spa/**/*.{test,spec}.ts,templates/ssr/**/*.ts,packages/**/*.test.ts"',
      'spa',
      'studio',
    )
    expect(adapted).toBe('globs: **/*.{test,spec}.ts,packages/**/*.test.ts')
  })

  it('copies adapted AI config for the spa template', async () => {
    const parent = await tempParent()
    const directory = path.join(parent, 'studio')
    await scaffold({ name: 'studio', template: 'spa', directory })

    const agents = await readFile(path.join(directory, 'AGENTS.md'), 'utf8')
    expect(agents).toContain('package `studio`')
    expect(agents).toContain('`src/features')
    expect(agents).not.toContain('@reactloom/template-spa')
    expect(agents).not.toContain('templates/spa')

    const claude = await readFile(path.join(directory, 'CLAUDE.md'), 'utf8')
    expect(claude).toContain('@AGENTS.md')
    const copilot = await readFile(
      path.join(directory, '.github', 'copilot-instructions.md'),
      'utf8',
    )
    expect(copilot).toContain('AGENTS.md')

    const spaRule = await readFile(path.join(directory, '.cursor', 'rules', 'spa.mdc'), 'utf8')
    expect(spaRule).toContain('globs: **/*.ts,**/*.tsx,**/*.css')
    expect(spaRule).not.toContain('templates/')
    await expect(
      stat(path.join(directory, '.cursor', 'rules', 'general.mdc')),
    ).resolves.toBeTruthy()
    await expect(
      stat(path.join(directory, '.cursor', 'rules', 'testing.mdc')),
    ).resolves.toBeTruthy()
    await expect(stat(path.join(directory, '.cursor', 'rules', 'ssr.mdc'))).rejects.toThrow()
    await expect(stat(path.join(directory, '.cursor', 'rules', 'mobile.mdc'))).rejects.toThrow()

    const mcp = await readFile(path.join(directory, '.cursor', 'mcp.json'), 'utf8')
    const parsed = JSON.parse(mcp) as { mcpServers: Record<string, { command: string }> }
    expect(parsed.mcpServers.shadcn?.command).toBe('npx')
    expect(parsed.mcpServers.context7?.command).toBe('npx')
    expect(mcp).not.toMatch(/api[_-]?key|secret|token|bearer|password/i)
  })

  it('copies SSR agent notes and the SSR rule', async () => {
    const parent = await tempParent()
    const directory = path.join(parent, 'web')
    await scaffold({ name: 'web', template: 'ssr', directory })

    const agents = await readFile(path.join(directory, 'AGENTS.md'), 'utf8')
    expect(agents).toContain('BEGIN:nextjs-agent-rules')
    expect(agents).toContain('END:nextjs-agent-rules')
    expect(agents).toContain('package `web`')
    expect(agents).not.toContain('@reactloom/template-ssr')
    expect(agents).not.toContain('templates/ssr')
    expect(agents).toContain('src/proxy.ts')

    const rule = await readFile(path.join(directory, '.cursor', 'rules', 'ssr.mdc'), 'utf8')
    expect(rule).toContain('globs: **/*.ts,**/*.tsx,**/*.css')
    expect(rule).not.toContain('templates/')
    await expect(stat(path.join(directory, '.cursor', 'rules', 'spa.mdc'))).rejects.toThrow()
  })

  it('copies mobile AI config without web-only rules', async () => {
    const parent = await tempParent()
    const directory = path.join(parent, 'pocket')
    await scaffold({ name: 'pocket', template: 'mobile', directory })

    const agents = await readFile(path.join(directory, 'AGENTS.md'), 'utf8')
    expect(agents).toContain('package `pocket`')
    expect(agents).toContain('src/lib/token-store.ts')
    expect(agents).not.toContain('@reactloom/template-mobile')
    expect(agents).not.toContain('templates/mobile')

    const rule = await readFile(path.join(directory, '.cursor', 'rules', 'mobile.mdc'), 'utf8')
    expect(rule).toContain('globs: **/*.ts,**/*.tsx')
    expect(rule).not.toContain('templates/')
    const testing = await readFile(path.join(directory, '.cursor', 'rules', 'testing.mdc'), 'utf8')
    expect(testing).toContain(
      'globs: **/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx,vitest.config.ts,.maestro/**/*.yaml,packages/**/*.test.ts',
    )
    expect(testing).not.toContain('templates/')
    await expect(stat(path.join(directory, '.cursor', 'rules', 'spa.mdc'))).rejects.toThrow()
  })
})
