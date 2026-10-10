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
  resolveStartup,
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
      dev: false,
    })
    expect(parseCliArgs(['studio', '--template', 'spa', '--dev'])).toMatchObject({
      yes: false,
      install: true,
      dev: true,
    })
  })

  it('starts the dev server only when asked', () => {
    expect(resolveStartup({ yes: true, install: false, dev: false })).toEqual({
      install: false,
      dev: false,
    })
    expect(resolveStartup({ yes: true, install: true, dev: false })).toEqual({
      install: true,
      dev: false,
    })
    expect(resolveStartup({ yes: true, install: true, dev: true })).toEqual({
      install: true,
      dev: true,
    })
    expect(resolveStartup({ yes: false, install: true, dev: false })).toEqual({
      install: true,
      dev: false,
    })
    expect(resolveStartup({ yes: false, install: false, dev: false }, 'dev')).toEqual({
      install: true,
      dev: true,
    })
    expect(resolveStartup({ yes: false, install: false, dev: false }, 'skip')).toEqual({
      install: false,
      dev: false,
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
      expect(manifest.clickToSource?.launcher).toBe('scripts/open-in-editor.mjs')
      expect(manifest.reactScan?.package).toBe('react-scan')
      expect(manifest.reactScan?.version).toBe('0.5.7')
      expect(manifest.reactScan?.enabled).toBe(template !== 'mobile')
      expect(manifest.packages.devtools).toBe(true)
      expect(manifest.whyDidYouRender?.version).toBe('10.0.1')
      expect(manifest.whyDidYouRender?.enabled).toBe(template === 'mobile')
      expect(manifest.bundleAnalyze?.script).toBeTruthy()
      expect(manifest.propsDiff?.hook).toBe('@reactloom/devtools')
      expect(manifest.storybook?.package).toBe('storybook')
      expect(manifest.storybook?.enabled).toBe(template !== 'mobile')
      expect(manifest.browserMocks?.flag).toBeTruthy()
      expect(manifest.devA11y?.package).toBe('@axe-core/react')
      expect(manifest.devA11y?.enabled).toBe(template !== 'mobile')
      expect(manifest.e2e?.tool).toBe(template === 'mobile' ? 'maestro' : 'playwright')
      expect(manifest.configs).toEqual(
        expect.arrayContaining(['scripts/open-in-editor.mjs', 'scripts/code', 'scripts/code.cmd']),
      )

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
      await expect(stat(path.join(directory, 'docs/getting-started.md'))).resolves.toBeTruthy()
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
      expect(pkg.scripts?.analyze).toBe(manifest.bundleAnalyze?.script)
      expect(pkg.devDependencies?.['@reactloom/devtools']).toBe('workspace:*')
      const analyzer = manifest.bundleAnalyze
      if (!analyzer || !manifest.whyDidYouRender || !manifest.propsDiff) {
        throw new Error('template manifest is missing a productivity tool')
      }
      const analyzerConfig = await readFile(path.join(directory, analyzer.config), 'utf8')
      expect(analyzerConfig).toContain(analyzer.marker)
      const analyzerVersion =
        pkg.devDependencies?.[analyzer.package] ?? pkg.dependencies?.[analyzer.package]
      expect(analyzerVersion).toBe(analyzer.version)
      const hook = await readFile(
        path.join(directory, 'packages/devtools/src/use-why-did-you-update.ts'),
        'utf8',
      )
      expect(hook).toContain('export function useWhyDidYouUpdate')
      const wdyrVersion =
        pkg.devDependencies?.['@welldone-software/why-did-you-render'] ??
        pkg.dependencies?.['@welldone-software/why-did-you-render']
      if (manifest.whyDidYouRender.enabled) {
        expect(wdyrVersion).toBe('10.0.1')
      } else {
        expect(wdyrVersion).toBeUndefined()
        const reasonFile = await readFile(
          path.join(directory, manifest.whyDidYouRender.config),
          'utf8',
        )
        expect(reasonFile).toContain(manifest.whyDidYouRender.reason)
      }
      const storybook = manifest.storybook
      const mocks = manifest.browserMocks
      const a11y = manifest.devA11y
      const e2e = manifest.e2e
      if (!storybook || !mocks || !a11y || !e2e) {
        throw new Error('template manifest is missing a workflow tool')
      }
      if (storybook.enabled) {
        expect(pkg.devDependencies?.storybook).toBe(storybook.version)
        expect(pkg.devDependencies?.[storybook.framework]).toBe(storybook.version)
        expect(pkg.scripts?.storybook).toContain('storybook dev')
        expect(pkg.scripts?.['build-storybook']).toContain('STORYBOOK=true')
        expect(pkg.scripts?.['build-storybook']).toContain('storybook build')
      } else {
        expect(pkg.devDependencies?.storybook).toBeUndefined()
        expect(pkg.scripts?.storybook).toBeUndefined()
      }
      if (mocks.mode === 'msw') {
        expect(pkg.devDependencies?.msw).toBe(mocks.version)
      } else {
        expect(pkg.devDependencies?.msw).toBeUndefined()
        expect(pkg.dependencies?.msw).toBeUndefined()
      }
      if (a11y.enabled) {
        expect(pkg.devDependencies?.['@axe-core/react']).toBe(a11y.version)
      } else {
        expect(pkg.devDependencies?.['@axe-core/react']).toBeUndefined()
      }
      if (e2e.tool === 'playwright') {
        expect(pkg.devDependencies?.['@playwright/test']).toBe(e2e.version)
        expect(pkg.scripts?.['test:e2e']).toBe('playwright test')
      } else {
        expect(pkg.devDependencies?.['@playwright/test']).toBeUndefined()
        expect(pkg.scripts?.['test:e2e']).toBeUndefined()
        const flow = await readFile(path.join(directory, e2e.config), 'utf8')
        expect(flow).toContain('appId:')
        expect(flow).toContain('launchApp')
      }
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

  it('copies each template editor setup and keeps other frameworks out', async () => {
    const parent = await tempParent()
    const spa = path.join(parent, 'studio')
    const ssr = path.join(parent, 'web')
    const mobile = path.join(parent, 'pocket')
    await scaffold({ name: 'studio', template: 'spa', directory: spa })
    await scaffold({ name: 'web', template: 'ssr', directory: ssr })
    await scaffold({ name: 'pocket', template: 'mobile', directory: mobile })

    const spaExtensions = await readFile(path.join(spa, '.vscode/extensions.json'), 'utf8')
    expect(spaExtensions).toContain('biomejs.biome')
    expect(spaExtensions).toContain('bradlc.vscode-tailwindcss')
    expect(spaExtensions).toContain('ms-playwright.playwright')
    expect(spaExtensions).not.toContain('expo.vscode-expo-tools')
    const spaSettings = await readFile(path.join(spa, '.vscode/settings.json'), 'utf8')
    expect(spaSettings).toContain('biomejs.biome')
    expect(spaSettings).toContain('tailwindCSS.experimental.classRegex')
    expect(spaSettings).toContain('node_modules/typescript/lib')
    const spaPkg = JSON.parse(await readFile(path.join(spa, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
      scripts: Record<string, string>
    }
    expect(spaPkg.devDependencies['vite-plugin-checker']).toBe('0.14.5')
    expect(spaPkg.devDependencies['code-inspector-plugin']).toBe('2.0.9')
    const spaVite = await readFile(path.join(spa, 'vite.config.ts'), 'utf8')
    expect(spaVite).toContain("bundler: 'vite'")
    expect(spaVite).toContain('open-in-editor.mjs')
    expect(spaVite).toContain('activateLauncher')
    expect(spaVite).not.toContain('LAUNCH_EDITOR')
    expect(spaVite).toContain('REACTLOOM_OPEN')
    expect(spaVite).toContain('http://127.0.0.1:4317')
    const spaPlaywright = await readFile(path.join(spa, 'playwright.config.ts'), 'utf8')
    expect(spaPlaywright).toContain("REACTLOOM_OPEN: 'false'")
    expect(spaVite).not.toContain("bundler: 'turbopack'")
    const spaEnv = await readFile(path.join(spa, '.env.development'), 'utf8')
    expect(spaEnv).toContain('VITE_DEVTOOLS=true')
    expect(spaEnv).toContain('# CODE_EDITOR=cursor')
    expect(spaEnv).not.toMatch(/^CODE_EDITOR=/m)
    expect(spaPkg.devDependencies['@tanstack/react-router-devtools']).toBe('1.167.2')
    expect(spaPkg.devDependencies['react-scan']).toBe('0.5.7')
    expect(spaPkg.devDependencies['@vitest/coverage-v8']).toBe('5.0.3')
    expect(spaPkg.scripts['test:coverage']).toBe('vitest run --coverage')
    expect(spaPkg.scripts['typecheck:affected']).toContain('...[HEAD]')
    const spaMain = await readFile(path.join(spa, 'src/main.tsx'), 'utf8')
    expect(spaMain).toContain("import { scan } from 'react-scan'")
    expect(spaMain).toContain('scan({ enabled: true })')
    expect(spaMain).not.toContain("import('react-scan')")
    expect(spaVite).toContain("'react-scan': devtoolsStub")
    expect(spaMain).toContain('TanStackRouterDevtools')
    const lefthook = await readFile(path.join(spa, 'lefthook.yml'), 'utf8')
    expect(lefthook).toContain('typecheck:affected')
    expect(lefthook).toContain('{staged_files}')

    const ssrExtensions = await readFile(path.join(ssr, '.vscode/extensions.json'), 'utf8')
    expect(ssrExtensions).toContain('ms-playwright.playwright')
    expect(ssrExtensions).not.toContain('expo.vscode-expo-tools')
    const ssrPkg = JSON.parse(await readFile(path.join(ssr, 'package.json'), 'utf8')) as {
      devDependencies: Record<string, string>
      scripts: Record<string, string>
    }
    expect(ssrPkg.devDependencies['@tanstack/react-query-devtools']).toBe('5.104.1')
    expect(ssrPkg.devDependencies['react-scan']).toBe('0.5.7')
    expect(ssrPkg.devDependencies['vite-plugin-checker']).toBeUndefined()
    expect(ssrPkg.devDependencies['code-inspector-plugin']).toBe('2.0.9')
    const ssrNext = await readFile(path.join(ssr, 'next.config.ts'), 'utf8')
    expect(ssrNext).toContain("bundler: 'turbopack'")
    expect(ssrNext).toContain('open-in-editor.mjs')
    expect(ssrNext).toContain('activateLauncher')
    expect(ssrNext).toContain('path.join(import.meta.dirname)')
    expect(ssrNext).toContain("alias['react-scan'] = reactScanStub")
    expect(ssrNext).toContain('resolveAlias: aliases')
    expect(ssrNext).not.toContain('../..')
    const ssrScan = await readFile(path.join(ssr, 'src/app/react-scan.tsx'), 'utf8')
    expect(ssrScan).toContain("import { scan } from 'react-scan'")
    expect(ssrScan).toContain('scan({')
    expect(ssrScan).toContain('enabled: true')
    expect(ssrScan).not.toContain("import('react-scan')")
    const ssrLayout = await readFile(path.join(ssr, 'src/app/layout.tsx'), 'utf8')
    expect(ssrLayout.indexOf("from '@/app/react-scan'")).toBeLessThan(
      ssrLayout.indexOf("from '@/app/providers'"),
    )
    const ssrEnv = await readFile(path.join(ssr, '.env.development'), 'utf8')
    expect(ssrEnv).toContain('NEXT_PUBLIC_DEVTOOLS=true')
    expect(ssrEnv).not.toMatch(/^REACT_EDITOR=/m)
    expect(ssrPkg.scripts.dev).toContain('next dev')
    const ssrOpener = await readFile(path.join(ssr, 'scripts/open-browser.mjs'), 'utf8')
    expect(ssrOpener).toContain('REACTLOOM_OPEN')
    const ssrPlaywright = await readFile(path.join(ssr, 'playwright.config.ts'), 'utf8')
    expect(ssrPlaywright).toContain("REACTLOOM_OPEN: 'false'")
    expect(ssrPkg.devDependencies['@tanstack/react-router-devtools']).toBeUndefined()
    await expect(stat(path.join(ssr, 'src/app/react-scan.tsx'))).resolves.toBeTruthy()

    const mobileExtensions = await readFile(path.join(mobile, '.vscode/extensions.json'), 'utf8')
    expect(mobileExtensions).toContain('expo.vscode-expo-tools')
    expect(mobileExtensions).not.toContain('playwright')
    expect(mobileExtensions).not.toContain('tailwindcss')
    const mobileSettings = await readFile(path.join(mobile, '.vscode/settings.json'), 'utf8')
    expect(mobileSettings).not.toContain('tailwindCSS')
    const mobilePkg = JSON.parse(await readFile(path.join(mobile, 'package.json'), 'utf8')) as {
      main: string
      dependencies?: Record<string, string>
      devDependencies: Record<string, string>
      scripts: Record<string, string>
    }
    expect(mobilePkg.devDependencies['@vitest/ui']).toBe('5.0.3')
    expect(mobilePkg.devDependencies['react-scan']).toBeUndefined()
    expect(mobilePkg.dependencies?.['react-scan']).toBeUndefined()
    expect(mobilePkg.devDependencies['vite-plugin-checker']).toBeUndefined()
    expect(mobilePkg.devDependencies['code-inspector-plugin']).toBeUndefined()
    expect(mobilePkg.devDependencies['react-native-dev-inspector']).toBe('1.1.0')
    const mobileMetro = await readFile(path.join(mobile, 'metro.config.js'), 'utf8')
    expect(mobileMetro).toContain('withInspector(config, { editor: launcher })')
    expect(mobileMetro).toContain('activateLauncher')
    expect(mobileMetro).not.toContain("editor: 'code'")
    for (const directory of [spa, ssr, mobile]) {
      await expect(stat(path.join(directory, 'scripts/open-in-editor.mjs'))).resolves.toBeTruthy()
      await expect(stat(path.join(directory, 'scripts/code'))).resolves.toBeTruthy()
      await expect(stat(path.join(directory, 'scripts/code.cmd'))).resolves.toBeTruthy()
    }
    const mobileBabel = await readFile(path.join(mobile, 'babel.config.js'), 'utf8')
    expect(mobileBabel).toContain('inspectorBabelPlugin')
    expect(mobileBabel).toContain('jsxImportSource')
    expect(mobileBabel).toContain('@welldone-software/why-did-you-render')
    expect(mobileBabel).toContain("NODE_ENV !== 'production'")
    const mobileEntry = await readFile(path.join(mobile, 'index.js'), 'utf8')
    expect(mobileEntry.indexOf('./src/lib/wdyr')).toBeLessThan(
      mobileEntry.indexOf('expo-router/entry'),
    )
    const mobileWdyr = await readFile(path.join(mobile, 'src/lib/wdyr.js'), 'utf8')
    expect(mobileWdyr).toContain('trackAllPureComponents')
    expect(mobileWdyr).toContain('__DEV__')
    expect(mobilePkg.main).toBe('index.js')
    expect(mobilePkg.devDependencies['@welldone-software/why-did-you-render']).toBe('10.0.1')
    expect(mobilePkg.devDependencies['expo-atlas']).toBe('0.4.3')
    expect(mobilePkg.scripts.analyze).toContain('EXPO_ATLAS=true')
    expect(spaPkg.devDependencies['@welldone-software/why-did-you-render']).toBeUndefined()
    expect(ssrPkg.devDependencies['@welldone-software/why-did-you-render']).toBeUndefined()
    expect(spaPkg.scripts.analyze).toBe('ANALYZE=true vite build')
    expect(ssrPkg.scripts.analyze).toBe('next analyze --output')
    const mobileEnv = await readFile(path.join(mobile, '.env.development'), 'utf8')
    expect(mobileEnv).toContain('EXPO_PUBLIC_DEVTOOLS=true')
    expect(mobileEnv).not.toMatch(/^LAUNCH_EDITOR=/m)
    const mobileAgents = await readFile(path.join(mobile, 'AGENTS.md'), 'utf8')
    expect(mobileAgents).toContain('react-native-dev-inspector')
    expect(mobileAgents).toContain(
      'react-scan 0.5.7 has no React Native export. The native preview at aidenybai/react-scan#23 is unmerged, so this template does not load React Scan.',
    )
    expect(mobilePkg.scripts['test:e2e']).toBeUndefined()
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
