import { mkdtemp, readFile, rm, stat, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { adaptAiText } from './ai-config.js'
import {
  invocationDirectory,
  isDirectInvocation,
  parseCliArgs,
  resolveProjectLocation,
  run,
} from './cli.js'
import { scaffold } from './scaffold.js'
import { findRepoRoot, readManifest, type TemplateId, templateIds } from './templates.js'

const created: string[] = []
const cliPackageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

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
      scripts: Record<string, string>
    }
    expect(pkg.name).toBe('studio')
    expect(pkg.dependencies['@reactloom/api-client']).toBe('workspace:*')
    expect(pkg.scripts['test:e2e:setup']).toBe('playwright install chromium')
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
    expect(workspace).not.toContain('templates/*')
    expect(workspace).toContain('lefthook')
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
    expect(config).toContain('path.join(import.meta.dirname)')
    expect(config).not.toContain('../..')
    const pkg = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>
    }
    expect(pkg.scripts['test:e2e:setup']).toBe('playwright install chromium')
  })

  it('treats a symlinked entry as a direct invocation', async () => {
    const parent = await tempParent()
    const source = path.join(cliPackageDir, 'src/cli.ts')
    const link = path.join(parent, 'cli.ts')
    await symlink(source, link)
    expect(isDirectInvocation(link, source)).toBe(true)
    expect(isDirectInvocation(undefined, source)).toBe(false)
  })

  it('resolves a project name against the invocation directory', () => {
    expect(resolveProjectLocation('studio', '/work')).toEqual({
      name: 'studio',
      directory: '/work/studio',
    })
    expect(resolveProjectLocation('../outside/web', '/work')).toEqual({
      name: 'web',
      directory: '/outside/web',
    })
    expect(resolveProjectLocation('../../outside/web', '/work/packages/create-reactloom')).toEqual({
      name: 'web',
      directory: '/work/outside/web',
    })
    expect(resolveProjectLocation('/tmp/pocket', '/work')).toEqual({
      name: 'pocket',
      directory: '/tmp/pocket',
    })
    expect(invocationDirectory({ INIT_CWD: '/work' }, '/work/packages/create-reactloom')).toBe(
      '/work',
    )
    expect(invocationDirectory({}, '/work')).toBe('/work')
  })

  it('creates the project in the current directory', async () => {
    const parent = await tempParent()
    const previousCwd = process.cwd()
    const previousInit = process.env.INIT_CWD
    delete process.env.INIT_CWD
    process.chdir(parent)
    try {
      await run(['studio', '--template', 'spa', '--yes'])
      const pkg = JSON.parse(
        await readFile(path.join(parent, 'studio', 'package.json'), 'utf8'),
      ) as { name: string }
      expect(pkg.name).toBe('studio')
    } finally {
      process.chdir(previousCwd)
      if (previousInit === undefined) delete process.env.INIT_CWD
      else process.env.INIT_CWD = previousInit
    }
  })

  it('uses INIT_CWD when the process directory is the CLI package', async () => {
    const parent = await tempParent()
    const previousCwd = process.cwd()
    const previousInit = process.env.INIT_CWD
    process.env.INIT_CWD = parent
    process.chdir(cliPackageDir)
    try {
      await run(['studio', '--template', 'spa', '--yes'])
      await expect(stat(path.join(parent, 'studio', 'package.json'))).resolves.toBeTruthy()
      await expect(stat(path.join(cliPackageDir, 'studio'))).rejects.toThrow()
    } finally {
      process.chdir(previousCwd)
      if (previousInit === undefined) delete process.env.INIT_CWD
      else process.env.INIT_CWD = previousInit
    }
  })

  it('creates the project at a path passed on the command line', async () => {
    const parent = await tempParent()
    const target = path.join(parent, 'nested', 'studio')
    const previousInit = process.env.INIT_CWD
    delete process.env.INIT_CWD
    try {
      await run([target, '--template', 'mobile', '--yes'])
      const pkg = JSON.parse(await readFile(path.join(target, 'package.json'), 'utf8')) as {
        name: string
      }
      expect(pkg.name).toBe('studio')
    } finally {
      if (previousInit === undefined) delete process.env.INIT_CWD
      else process.env.INIT_CWD = previousInit
    }
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

  it('selects a different file set for each template', async () => {
    const repoRoot = await findRepoRoot(cliPackageDir)
    const parent = await tempParent()
    const allPresets = [
      'base.json',
      'react.json',
      'vite.json',
      'next.json',
      'expo.json',
      'node.json',
    ]
    const allRules = ['general.mdc', 'spa.mdc', 'ssr.mdc', 'mobile.mdc', 'testing.mdc']
    const allAdrs = [
      'docs/adr/0001-monorepo-and-init.md',
      'docs/adr/0002-frameworks.md',
      'docs/adr/0003-sessions.md',
      'docs/adr/0004-api-client.md',
      'docs/adr/0005-tooling.md',
      'docs/adr/0006-ai-collaboration.md',
    ]
    const locked: Record<TemplateId, { presets: string[]; rules: string[]; docker: boolean }> = {
      spa: {
        presets: ['base.json', 'react.json', 'vite.json', 'node.json'],
        rules: ['general.mdc', 'spa.mdc', 'testing.mdc'],
        docker: false,
      },
      ssr: {
        presets: ['base.json', 'react.json', 'next.json', 'node.json'],
        rules: ['general.mdc', 'ssr.mdc', 'testing.mdc'],
        docker: true,
      },
      mobile: {
        presets: ['base.json', 'react.json', 'expo.json', 'node.json'],
        rules: ['general.mdc', 'mobile.mdc', 'testing.mdc'],
        docker: false,
      },
    }

    for (const template of templateIds) {
      const manifest = await readManifest(path.join(repoRoot, 'templates', template))
      expect(manifest.packages.tsconfig).toEqual(locked[template].presets)
      expect(manifest.ai.rules).toEqual(locked[template].rules)
      expect(manifest.docker).toBe(locked[template].docker)
      expect(manifest.packages['api-client']).toBe(true)
      expect(manifest.ci).toBe('.github/workflows/ci.yml')
      expect(manifest.configs).not.toContain('.github/workflows/ci.yml')
      expect(manifest.docs).not.toContain('docs/adr/0001-monorepo-and-init.md')
      expect(manifest.docs).not.toContain('docs/adr/0002-frameworks.md')

      const directory = path.join(parent, template)
      await scaffold({ name: template, template, directory })

      for (const preset of allPresets) {
        const file = path.join(directory, 'packages', 'tsconfig', preset)
        if (manifest.packages.tsconfig.includes(preset)) {
          await expect(stat(file)).resolves.toBeTruthy()
        } else {
          await expect(stat(file)).rejects.toThrow()
        }
      }
      const tsconfigPkg = JSON.parse(
        await readFile(path.join(directory, 'packages', 'tsconfig', 'package.json'), 'utf8'),
      ) as { exports: Record<string, string>; files: string[] }
      expect(Object.keys(tsconfigPkg.exports).sort()).toEqual(
        manifest.packages.tsconfig.map((preset) => `./${preset}`).sort(),
      )
      expect(tsconfigPkg.files).toEqual(manifest.packages.tsconfig)

      for (const rule of allRules) {
        const file = path.join(directory, '.cursor', 'rules', rule)
        if (manifest.ai.rules.includes(rule)) {
          await expect(stat(file)).resolves.toBeTruthy()
        } else {
          await expect(stat(file)).rejects.toThrow()
        }
      }
      for (const adr of allAdrs) {
        const file = path.join(directory, adr)
        if (manifest.docs.includes(adr)) {
          await expect(stat(file)).resolves.toBeTruthy()
        } else {
          await expect(stat(file)).rejects.toThrow()
        }
      }
      for (const config of manifest.configs) {
        await expect(stat(path.join(directory, config))).resolves.toBeTruthy()
      }
      await expect(stat(path.join(directory, 'nest-cli.json'))).rejects.toThrow()
      await expect(stat(path.join(directory, 'packages', 'create-reactloom'))).rejects.toThrow()
      await expect(stat(path.join(directory, manifest.ci))).resolves.toBeTruthy()
      const workflow = await readFile(path.join(directory, manifest.ci), 'utf8')
      expect(workflow).not.toContain('concurrency:')
      expect(workflow).not.toContain('@reactloom/template-')

      const pkg = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8')) as {
        dependencies?: Record<string, string>
        devDependencies?: Record<string, string>
        scripts?: Record<string, string>
      }
      expect(pkg.devDependencies?.['@biomejs/biome']).toBe('2.5.15')
      expect(pkg.devDependencies?.lefthook).toBe('2.2.1')
      expect(pkg.dependencies?.['@nestjs/core']).toBeUndefined()
      expect(pkg.scripts?.lint).toBe('biome check .')
      const changeset = JSON.parse(
        await readFile(path.join(directory, '.changeset', 'config.json'), 'utf8'),
      ) as { ignore: string[] }
      expect(changeset.ignore).toEqual([template])

      const workspace = await readFile(path.join(directory, 'pnpm-workspace.yaml'), 'utf8')
      expect(workspace).toContain('packages/*')
      expect(workspace).not.toContain('templates/*')
      expect(workspace).toContain('onlyBuiltDependencies')
    }
  })

  it('omits Next, Expo, Nest, and Docker from an SPA', async () => {
    const parent = await tempParent()
    const directory = path.join(parent, 'studio')
    await scaffold({ name: 'studio', template: 'spa', directory })
    const absent = [
      'packages/tsconfig/next.json',
      'packages/tsconfig/expo.json',
      'nest-cli.json',
      'next.config.ts',
      'app.json',
      'metro.config.js',
      'Dockerfile',
      'Dockerfile.standalone',
      '.cursor/rules/ssr.mdc',
      '.cursor/rules/mobile.mdc',
    ]
    for (const relative of absent) {
      await expect(stat(path.join(directory, relative))).rejects.toThrow()
    }
    await expect(stat(path.join(directory, 'vite.config.ts'))).resolves.toBeTruthy()
    const pkg = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>
      scripts: Record<string, string>
    }
    expect(pkg.dependencies.next).toBeUndefined()
    expect(pkg.dependencies.expo).toBeUndefined()
    expect(pkg.scripts.dev).toContain('vite')
    expect(pkg.scripts['test:e2e:setup']).toBe('playwright install chromium')
  })

  it('keeps the SSR Dockerfile and drops Vite and Expo presets', async () => {
    const parent = await tempParent()
    const directory = path.join(parent, 'web')
    await scaffold({ name: 'web', template: 'ssr', directory })
    await expect(stat(path.join(directory, 'Dockerfile'))).resolves.toBeTruthy()
    await expect(stat(path.join(directory, 'next.config.ts'))).resolves.toBeTruthy()
    await expect(stat(path.join(directory, 'packages/tsconfig/next.json'))).resolves.toBeTruthy()
    await expect(stat(path.join(directory, 'packages/tsconfig/vite.json'))).rejects.toThrow()
    await expect(stat(path.join(directory, 'packages/tsconfig/expo.json'))).rejects.toThrow()
    await expect(stat(path.join(directory, 'vite.config.ts'))).rejects.toThrow()
    await expect(stat(path.join(directory, 'app.json'))).rejects.toThrow()
    await expect(stat(path.join(directory, 'nest-cli.json'))).rejects.toThrow()
  })

  it('points the generated mobile workspace at the project and skips Next', async () => {
    const parent = await tempParent()
    const directory = path.join(parent, 'pocket')
    await scaffold({ name: 'pocket', template: 'mobile', directory })
    const metro = await readFile(path.join(directory, 'metro.config.js'), 'utf8')
    expect(metro).toContain('const workspaceRoot = projectRoot')
    expect(metro).not.toContain('../..')
    await expect(stat(path.join(directory, 'app.json'))).resolves.toBeTruthy()
    await expect(stat(path.join(directory, 'packages/tsconfig/expo.json'))).resolves.toBeTruthy()
    await expect(stat(path.join(directory, 'packages/tsconfig/next.json'))).rejects.toThrow()
    await expect(stat(path.join(directory, 'packages/tsconfig/vite.json'))).rejects.toThrow()
    await expect(stat(path.join(directory, 'Dockerfile'))).rejects.toThrow()
    await expect(stat(path.join(directory, 'next.config.ts'))).rejects.toThrow()
    const pkg = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>
    }
    expect(pkg.scripts['test:e2e']).toBeUndefined()
    expect(pkg.scripts['test:e2e:setup']).toBeUndefined()
    const workflow = await readFile(path.join(directory, '.github/workflows/ci.yml'), 'utf8')
    expect(workflow).not.toContain('test:e2e')
  })
})
