import type { TemplateManifest } from './templates.js'

/** Root configs that pull matching devDependencies into the generated package.json. */
export const TOOLING_DEV_DEPENDENCIES: Record<string, readonly string[]> = {
  'biome.json': ['@biomejs/biome'],
  'lefthook.yml': ['lefthook'],
  'commitlint.config.mjs': ['@commitlint/cli', '@commitlint/config-conventional'],
  '.changeset/config.json': ['@changesets/cli'],
}

/** Scripts removed when the config they run is not in the manifest. */
export const SCRIPTS_FOR_CONFIG: Record<string, string> = {
  lint: 'biome.json',
  changeset: '.changeset/config.json',
  'version-packages': '.changeset/config.json',
}

export const DOCKER_FILES = [
  'Dockerfile',
  'Dockerfile.monorepo',
  'Dockerfile.standalone',
  'docker-compose.yml',
] as const

export type PackageJson = {
  name?: string
  main?: string
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  exports?: Record<string, string>
  files?: string[]
}

type TsconfigPackage = {
  exports?: Record<string, string>
  files?: string[]
}

export function workspaceYaml(manifest: TemplateManifest): string {
  const lines = ['packages:', '  - "packages/*"']
  if (manifest.configs.includes('lefthook.yml')) {
    lines.push('', 'onlyBuiltDependencies:', '  - lefthook')
  }
  return `${lines.join('\n')}\n`
}

export function pruneTsconfigPackage<T extends TsconfigPackage>(
  pkg: T,
  presets: readonly string[],
): T {
  const exports: Record<string, string> = {}
  for (const preset of presets) {
    exports[`./${preset}`] = `./${preset}`
  }
  return { ...pkg, exports, files: [...presets] }
}

export function rewriteChangesetConfig<T extends { ignore?: string[] }>(
  config: T,
  projectName: string,
): T {
  return { ...config, ignore: [projectName] }
}

export function unselectedFrameworkFiles(manifest: TemplateManifest): string[] {
  const presets = new Set(manifest.packages.tsconfig)
  const files: Array<{ file: string; keep: boolean }> = [
    { file: 'nest-cli.json', keep: false },
    { file: 'next.config.ts', keep: presets.has('next.json') },
    { file: 'next.config.js', keep: presets.has('next.json') },
    { file: 'next.config.mjs', keep: presets.has('next.json') },
    { file: 'app.json', keep: presets.has('expo.json') },
    { file: 'app.config.ts', keep: presets.has('expo.json') },
    { file: 'metro.config.js', keep: presets.has('expo.json') },
    { file: 'eas.json', keep: presets.has('expo.json') },
    { file: 'vite.config.ts', keep: presets.has('vite.json') },
  ]
  return files.filter((entry) => !entry.keep).map((entry) => entry.file)
}

export function pruneProjectPackage(
  pkg: PackageJson,
  manifest: TemplateManifest,
  versions: Record<string, string>,
): PackageJson {
  const next: PackageJson = { ...pkg }
  const configs = new Set(manifest.configs)
  const dependencies = { ...(next.dependencies ?? {}) }
  const devDependencies = { ...(next.devDependencies ?? {}) }
  const scripts = { ...(next.scripts ?? {}) }

  if (!manifest.packages['api-client']) delete dependencies['@reactloom/api-client']
  if (!manifest.packages.devtools) {
    delete dependencies['@reactloom/devtools']
    delete devDependencies['@reactloom/devtools']
  }
  if (manifest.packages.tsconfig.length === 0) delete devDependencies['@reactloom/tsconfig']

  for (const [config, packages] of Object.entries(TOOLING_DEV_DEPENDENCIES)) {
    for (const name of packages) {
      if (configs.has(config)) {
        const version = versions[name]
        if (!version) throw new Error(`Root package.json has no version for ${name}.`)
        devDependencies[name] = version
      } else {
        delete devDependencies[name]
        delete dependencies[name]
      }
    }
  }

  for (const [script, config] of Object.entries(SCRIPTS_FOR_CONFIG)) {
    if (!configs.has(config)) delete scripts[script]
  }

  for (const [name, command] of Object.entries(scripts)) {
    if (commandReferencesExcludedTool(command, manifest)) delete scripts[name]
  }

  for (const group of [dependencies, devDependencies]) {
    for (const name of Object.keys(group)) {
      if (dependencyIsExcluded(name, manifest)) delete group[name]
    }
  }

  next.dependencies = dependencies
  next.devDependencies = devDependencies
  next.scripts = scripts
  return next
}

function commandReferencesExcludedTool(command: string, manifest: TemplateManifest): boolean {
  return excludedTools(manifest).some((tool) => new RegExp(`\\b${tool}\\b`).test(command))
}

function dependencyIsExcluded(name: string, manifest: TemplateManifest): boolean {
  const presets = new Set(manifest.packages.tsconfig)
  if (isNestPackage(name)) return true
  if (!presets.has('next.json') && isNextPackage(name)) return true
  if (!presets.has('expo.json') && isExpoPackage(name)) return true
  if (!presets.has('vite.json') && isVitePackage(name)) return true
  return false
}

function excludedTools(manifest: TemplateManifest): string[] {
  const presets = new Set(manifest.packages.tsconfig)
  const tools = ['nest']
  if (!presets.has('next.json')) tools.push('next')
  if (!presets.has('expo.json')) tools.push('expo')
  if (!presets.has('vite.json')) tools.push('vite')
  return tools
}

function isNestPackage(name: string): boolean {
  return name === 'nest' || name.startsWith('@nestjs/')
}

function isNextPackage(name: string): boolean {
  return (
    name === 'next' ||
    name.startsWith('@next/') ||
    name === '@sentry/nextjs' ||
    name === '@t3-oss/env-nextjs'
  )
}

function isExpoPackage(name: string): boolean {
  return (
    name === 'expo' ||
    name.startsWith('expo-') ||
    name.startsWith('@expo/') ||
    name === 'react-native' ||
    name.startsWith('react-native-') ||
    name === 'babel-preset-expo'
  )
}

function isVitePackage(name: string): boolean {
  return name === 'vite' || name.startsWith('@vitejs/') || name === '@tailwindcss/vite'
}
