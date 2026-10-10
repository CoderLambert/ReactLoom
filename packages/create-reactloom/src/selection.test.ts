import { describe, expect, it } from 'vitest'
import {
  type PackageJson,
  pruneProjectPackage,
  pruneTsconfigPackage,
  rewriteChangesetConfig,
  unselectedFrameworkFiles,
  workspaceYaml,
} from './selection.js'
import { parseManifest, type TemplateManifest } from './templates.js'

const versions: Record<string, string> = {
  '@biomejs/biome': '2.5.15',
  lefthook: '2.2.1',
  '@commitlint/cli': '21.2.3',
  '@commitlint/config-conventional': '21.2.3',
  '@changesets/cli': '3.0.3',
}

function spaManifest(): TemplateManifest {
  return parseManifest({
    id: 'spa',
    description: 'SPA',
    packages: {
      'api-client': true,
      tsconfig: ['base.json', 'react.json', 'vite.json', 'node.json'],
    },
    configs: ['biome.json', 'lefthook.yml', 'commitlint.config.mjs', '.changeset/config.json'],
    ci: '.github/workflows/ci.yml',
    docker: false,
    ai: { pointers: ['CLAUDE.md'], rules: ['general.mdc', 'spa.mdc', 'testing.mdc'] },
    docs: ['docs/adr/0004-api-client.md'],
  })
}

describe('template selection', () => {
  it('rejects a manifest that does not list packages', () => {
    expect(() => parseManifest({ id: 'spa', description: 'SPA' })).toThrow(/packages/)
  })

  it('rejects a click-to-source path that leaves the template', () => {
    expect(() =>
      parseManifest({
        ...spaManifest(),
        clickToSource: {
          plugin: 'code-inspector-plugin',
          version: '2.0.9',
          config: '../vite.config.ts',
          launchEditor: '.env.development',
        },
      }),
    ).toThrow(/clickToSource.config/)
  })

  it('rejects a launch-editor path that leaves the template', () => {
    expect(() =>
      parseManifest({
        ...spaManifest(),
        clickToSource: {
          plugin: 'code-inspector-plugin',
          version: '2.0.9',
          config: 'vite.config.ts',
          launchEditor: '../.env.development',
        },
      }),
    ).toThrow(/clickToSource.launchEditor/)
  })

  it('rejects a React Scan path that leaves the template', () => {
    expect(() =>
      parseManifest({
        ...spaManifest(),
        reactScan: {
          package: 'react-scan',
          version: '0.5.7',
          enabled: true,
          config: '../src/main.tsx',
        },
      }),
    ).toThrow(/reactScan.config/)
  })

  it('rejects a why-did-you-render path that leaves the template', () => {
    expect(() =>
      parseManifest({
        ...spaManifest(),
        whyDidYouRender: {
          package: '@welldone-software/why-did-you-render',
          version: '10.0.1',
          enabled: true,
          config: '../babel.config.js',
        },
      }),
    ).toThrow(/whyDidYouRender.config/)
  })

  it('rejects a disabled why-did-you-render entry that has no reason', () => {
    expect(() =>
      parseManifest({
        ...spaManifest(),
        whyDidYouRender: {
          package: '@welldone-software/why-did-you-render',
          version: '10.0.1',
          enabled: false,
          config: 'AGENTS.md',
        },
      }),
    ).toThrow(/whyDidYouRender.reason/)
  })

  it('rejects a storybook framework that is not Vite or Next', () => {
    expect(() =>
      parseManifest({
        ...spaManifest(),
        storybook: {
          enabled: true,
          package: 'storybook',
          version: '10.6.1',
          framework: '@storybook/react',
          config: '.storybook/main.ts',
          stories: ['src/components/ui/button.stories.tsx'],
        },
      }),
    ).toThrow(/storybook.framework/)
  })

  it('rejects a disabled storybook entry that has no reason', () => {
    expect(() =>
      parseManifest({
        ...spaManifest(),
        storybook: {
          enabled: false,
          package: 'storybook',
          version: '10.6.1',
          framework: '@storybook/react-vite',
          config: 'AGENTS.md',
        },
      }),
    ).toThrow(/storybook.reason/)
  })

  it('rejects a browser mock mode that is not msw or fixtures', () => {
    expect(() =>
      parseManifest({
        ...spaManifest(),
        browserMocks: {
          mode: 'fetch',
          flag: 'VITE_ENABLE_MSW',
          config: 'src/main.tsx',
        },
      }),
    ).toThrow(/browserMocks.mode/)
  })

  it('rejects an end-to-end tool that is not playwright or maestro', () => {
    expect(() =>
      parseManifest({
        ...spaManifest(),
        e2e: {
          tool: 'cypress',
          config: 'playwright.config.ts',
        },
      }),
    ).toThrow(/e2e.tool/)
  })

  it('rejects a props diff whose primary tool is unknown', () => {
    expect(() =>
      parseManifest({
        ...spaManifest(),
        propsDiff: {
          primary: 'why-did-you-update',
          hook: '@reactloom/devtools',
          config: 'src/main.tsx',
        },
      }),
    ).toThrow(/propsDiff.primary/)
  })

  it('rejects a disabled React Scan entry that has no reason', () => {
    expect(() =>
      parseManifest({
        ...spaManifest(),
        reactScan: {
          package: 'react-scan',
          version: '0.5.7',
          enabled: false,
          config: 'AGENTS.md',
        },
      }),
    ).toThrow(/reactScan.reason/)
  })

  it('rejects a launcher path that leaves the template', () => {
    expect(() =>
      parseManifest({
        ...spaManifest(),
        clickToSource: {
          plugin: 'code-inspector-plugin',
          version: '2.0.9',
          config: 'vite.config.ts',
          launchEditor: '.env.development',
          launcher: '../scripts/open-in-editor.mjs',
        },
      }),
    ).toThrow(/clickToSource.launcher/)
  })

  it('rejects a tsconfig preset that is not a filename', () => {
    expect(() =>
      parseManifest({
        ...spaManifest(),
        packages: { 'api-client': true, tsconfig: ['../next.json'] },
      }),
    ).toThrow(/Invalid tsconfig preset/)
  })

  it('exports only the presets the template listed', () => {
    const pruned = pruneTsconfigPackage(
      {
        name: '@reactloom/tsconfig',
        exports: {
          './base.json': './base.json',
          './next.json': './next.json',
          './expo.json': './expo.json',
        },
        files: ['base.json', 'next.json', 'expo.json'],
      },
      ['base.json', 'react.json', 'vite.json', 'node.json'],
    )
    expect(pruned.exports).toEqual({
      './base.json': './base.json',
      './react.json': './react.json',
      './vite.json': './vite.json',
      './node.json': './node.json',
    })
    expect(pruned.files).toEqual(['base.json', 'react.json', 'vite.json', 'node.json'])
    expect(pruned.name).toBe('@reactloom/tsconfig')
  })

  it('drops Next, Expo, and Nest from an SPA package and keeps Vite', () => {
    const pruned = pruneProjectPackage(
      {
        name: 'studio',
        scripts: {
          dev: 'vite',
          start: 'next start',
          mobile: 'expo start',
          api: 'nest start',
          lint: 'biome check .',
          changeset: 'changeset',
        },
        dependencies: {
          '@reactloom/api-client': 'workspace:*',
          next: '16.4.0',
          expo: '57.0.0',
          'expo-router': '57.0.0',
          '@nestjs/core': '11.0.0',
          react: '19.3.0',
        },
        devDependencies: {
          vite: '8.3.4',
          '@vitejs/plugin-react': '6.1.2',
          '@nestjs/config': '4.0.0',
          '@sentry/nextjs': '11.6.0',
        },
      },
      spaManifest(),
      versions,
    )
    expect(pruned.dependencies).toEqual({
      '@reactloom/api-client': 'workspace:*',
      react: '19.3.0',
    })
    expect(pruned.devDependencies?.vite).toBe('8.3.4')
    expect(pruned.devDependencies?.['@vitejs/plugin-react']).toBe('6.1.2')
    expect(pruned.devDependencies?.['@biomejs/biome']).toBe('2.5.15')
    expect(pruned.devDependencies?.lefthook).toBe('2.2.1')
    expect(pruned.devDependencies?.['@changesets/cli']).toBe('3.0.3')
    expect(pruned.devDependencies?.['@nestjs/config']).toBeUndefined()
    expect(pruned.scripts).toEqual({
      dev: 'vite',
      lint: 'biome check .',
      changeset: 'changeset',
    })
  })

  it('removes the lint script when Biome is not selected', () => {
    const manifest = spaManifest()
    manifest.configs = manifest.configs.filter((config) => config !== 'biome.json')
    const pruned = pruneProjectPackage(
      { scripts: { lint: 'biome check .', dev: 'vite' }, devDependencies: {} },
      manifest,
      versions,
    )
    expect(pruned.scripts).toEqual({ dev: 'vite' })
    expect(pruned.devDependencies?.['@biomejs/biome']).toBeUndefined()
  })

  it('writes lefthook into the workspace only when its config is selected', () => {
    const withHooks = workspaceYaml(spaManifest())
    expect(withHooks).toContain('packages/*')
    expect(withHooks).not.toContain('templates/*')
    expect(withHooks).toContain('lefthook')

    const manifest = spaManifest()
    manifest.configs = manifest.configs.filter((config) => config !== 'lefthook.yml')
    const withoutHooks = workspaceYaml(manifest)
    expect(withoutHooks).not.toContain('lefthook')
    expect(withoutHooks).not.toContain('onlyBuiltDependencies')
  })

  it('keeps an SPA free of Next, Expo, and Nest root files', () => {
    const excluded = unselectedFrameworkFiles(spaManifest())
    expect(excluded).toEqual(
      expect.arrayContaining(['nest-cli.json', 'next.config.ts', 'app.json', 'metro.config.js']),
    )
    expect(excluded).not.toContain('vite.config.ts')
  })

  it('rewrites the Changesets ignore list to the generated project', () => {
    expect(
      rewriteChangesetConfig(
        { ignore: ['reactloom', '@reactloom/template-spa', '@reactloom/template-ssr'] },
        'studio',
      ).ignore,
    ).toEqual(['studio'])
  })

  it('drops the devtools package when the template does not list it', () => {
    const pruned = pruneProjectPackage(
      {
        dependencies: { '@reactloom/devtools': 'workspace:*' },
        devDependencies: { '@reactloom/devtools': 'workspace:*' },
      },
      spaManifest(),
      versions,
    )
    expect(pruned.dependencies?.['@reactloom/devtools']).toBeUndefined()
    expect(pruned.devDependencies?.['@reactloom/devtools']).toBeUndefined()
  })

  it('keeps the devtools package when the template lists it', () => {
    const manifest = spaManifest()
    manifest.packages.devtools = true
    const pruned = pruneProjectPackage(
      { devDependencies: { '@reactloom/devtools': 'workspace:*' } },
      manifest,
      versions,
    )
    expect(pruned.devDependencies?.['@reactloom/devtools']).toBe('workspace:*')
  })

  it('requires a version for every selected tool', () => {
    const pkg: PackageJson = { scripts: { lint: 'biome check .' }, devDependencies: {} }
    expect(() => pruneProjectPackage(pkg, spaManifest(), {})).toThrow(/@biomejs\/biome/)
  })
})
