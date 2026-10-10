import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const templateIds = ['spa', 'ssr', 'mobile'] as const

export type TemplateId = (typeof templateIds)[number]

export type TemplateManifest = {
  id: TemplateId
  description: string
  strip?: string[]
  rename?: Record<string, string>
  replacements?: Array<{ file: string; from: string; to: string }>
  packages: {
    'api-client': boolean
    tsconfig: string[]
  }
  configs: string[]
  /** Template-relative CI workflow. The monorepo workflow is never copied over it. */
  ci: string
  docker: boolean
  ai: {
    pointers: string[]
    rules: string[]
  }
  docs: string[]
  /**
   * React Scan package and the file that wires it. SPA and SSR set `enabled`.
   * Mobile sets `enabled` to false and `reason` explains the missing native entry.
   * The CLI checks that file, and that package.json matches.
   */
  reactScan?: {
    package: string
    version: string
    enabled: boolean
    config: string
    reason?: string
  }
  /**
   * Inspector package, the committed env file, and the editor launcher.
   * `config` is the bundler file. `launchEditor` is the env file that leaves
   * the editor unset. `launcher` is `scripts/open-in-editor.mjs`. The CLI checks
   * those files, plus `scripts/code` and `scripts/code.cmd`, were copied and
   * that package.json pins `plugin` at `version`.
   */
  clickToSource?: {
    plugin: string
    version: string
    config: string
    launchEditor: string
    launcher: string
  }
}

export function isTemplateId(value: string): value is TemplateId {
  return templateIds.some((id) => id === value)
}

export async function findRepoRoot(start: string): Promise<string> {
  let dir = start
  for (let depth = 0; depth < 8; depth += 1) {
    try {
      await access(path.join(dir, 'templates', 'spa', 'template.json'))
      await access(path.join(dir, 'pnpm-workspace.yaml'))
      return dir
    } catch {
      const parent = path.dirname(dir)
      if (parent === dir) break
      dir = parent
    }
  }
  throw new Error(
    'Could not find the ReactLoom templates. Run create-reactloom from this repository.',
  )
}

export async function resolveTemplatesRoot(): Promise<string> {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const root = await findRepoRoot(here)
  return path.join(root, 'templates')
}

export function parseManifest(value: unknown): TemplateManifest {
  if (!value || typeof value !== 'object') {
    throw new Error('template.json must be an object.')
  }
  const record = value as Record<string, unknown>
  const id = record.id
  if (typeof id !== 'string' || !isTemplateId(id)) {
    throw new Error('template.json id must be spa, ssr, or mobile.')
  }
  const packages = record.packages
  if (!packages || typeof packages !== 'object') {
    throw new Error('template.json packages must list api-client and tsconfig presets.')
  }
  const packageRecord = packages as Record<string, unknown>
  if (typeof packageRecord['api-client'] !== 'boolean' || !Array.isArray(packageRecord.tsconfig)) {
    throw new Error('template.json packages.api-client and packages.tsconfig are required.')
  }
  const tsconfig = stringList(packageRecord.tsconfig, 'packages.tsconfig')
  for (const preset of tsconfig) {
    if (!/^[a-z0-9.-]+\.json$/.test(preset) || preset === 'package.json') {
      throw new Error(`Invalid tsconfig preset "${preset}".`)
    }
  }
  const ai = record.ai
  if (!ai || typeof ai !== 'object') throw new Error('template.json ai is required.')
  const aiRecord = ai as Record<string, unknown>
  if (typeof record.ci !== 'string' || record.ci.length === 0) {
    throw new Error('template.json ci must be the template workflow path.')
  }
  if (typeof record.docker !== 'boolean') throw new Error('template.json docker must be a boolean.')
  return {
    id,
    description: typeof record.description === 'string' ? record.description : id,
    strip: optionalStringList(record.strip, 'strip'),
    rename: optionalRename(record.rename),
    replacements: optionalReplacements(record.replacements),
    packages: { 'api-client': packageRecord['api-client'], tsconfig },
    configs: stringList(record.configs, 'configs'),
    ci: record.ci,
    docker: record.docker,
    ai: {
      pointers: stringList(aiRecord.pointers, 'ai.pointers'),
      rules: stringList(aiRecord.rules, 'ai.rules'),
    },
    docs: stringList(record.docs, 'docs'),
    reactScan: optionalReactScan(record.reactScan),
    clickToSource: optionalClickToSource(record.clickToSource),
  }
}

function stringList(value: unknown, label: string): string[] {
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== 'string' || entry.length === 0)
  ) {
    throw new Error(`template.json ${label} must be an array of paths.`)
  }
  return value
}

function optionalReactScan(value: unknown): TemplateManifest['reactScan'] {
  if (value === undefined) return undefined
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('template.json reactScan must be an object.')
  }
  const record = value as Record<string, unknown>
  if (record.package !== 'react-scan') {
    throw new Error('template.json reactScan.package must be react-scan.')
  }
  if (typeof record.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(record.version)) {
    throw new Error('template.json reactScan.version must be an exact version.')
  }
  if (typeof record.enabled !== 'boolean') {
    throw new Error('template.json reactScan.enabled must be a boolean.')
  }
  let reason: string | undefined
  if (record.enabled) {
    if (record.reason !== undefined) {
      throw new Error('template.json reactScan.reason is only used when React Scan is off.')
    }
  } else if (typeof record.reason !== 'string' || record.reason.trim().length === 0) {
    throw new Error('template.json reactScan.reason must explain why React Scan is off.')
  } else {
    reason = record.reason
  }
  return {
    package: 'react-scan',
    version: record.version,
    enabled: record.enabled,
    config: templateFile(record.config, 'reactScan.config'),
    ...(reason === undefined ? {} : { reason }),
  }
}

function optionalClickToSource(value: unknown): TemplateManifest['clickToSource'] {
  if (value === undefined) return undefined
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('template.json clickToSource must be an object.')
  }
  const record = value as Record<string, unknown>
  if (
    typeof record.plugin !== 'string' ||
    !/^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(record.plugin)
  ) {
    throw new Error('template.json clickToSource.plugin must name the inspector package.')
  }
  if (typeof record.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(record.version)) {
    throw new Error('template.json clickToSource.version must be an exact version.')
  }
  return {
    plugin: record.plugin,
    version: record.version,
    config: templateFile(record.config, 'clickToSource.config'),
    launchEditor: templateFile(record.launchEditor, 'clickToSource.launchEditor'),
    launcher: templateFile(record.launcher, 'clickToSource.launcher'),
  }
}

function templateFile(value: unknown, label: string): string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.includes('..') ||
    path.isAbsolute(value)
  ) {
    throw new Error(`template.json ${label} must be a file inside the template.`)
  }
  return value
}

function optionalStringList(value: unknown, label: string): string[] | undefined {
  if (value === undefined) return undefined
  return stringList(value, label)
}

function optionalRename(value: unknown): Record<string, string> | undefined {
  if (value === undefined) return undefined
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('template.json rename must be an object.')
  }
  const rename: Record<string, string> = {}
  for (const [from, to] of Object.entries(value)) {
    if (typeof to !== 'string') throw new Error('template.json rename values must be strings.')
    rename[from] = to
  }
  return rename
}

function optionalReplacements(
  value: unknown,
): Array<{ file: string; from: string; to: string }> | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) throw new Error('template.json replacements must be an array.')
  return value.map((entry) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error('template.json replacements must be objects.')
    }
    const replacement = entry as Record<string, unknown>
    if (
      typeof replacement.file !== 'string' ||
      typeof replacement.from !== 'string' ||
      typeof replacement.to !== 'string'
    ) {
      throw new Error('template.json replacements need file, from, and to strings.')
    }
    return { file: replacement.file, from: replacement.from, to: replacement.to }
  })
}

export async function readManifest(templateDir: string): Promise<TemplateManifest> {
  const raw = await readFile(path.join(templateDir, 'template.json'), 'utf8')
  return parseManifest(JSON.parse(raw) as unknown)
}
