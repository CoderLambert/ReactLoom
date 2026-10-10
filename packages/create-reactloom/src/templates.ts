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
   * Names the click-to-source setup that ships inside this template.
   * `config` is a template-relative file. The CLI checks that file was copied.
   */
  clickToSource?: {
    tool: string
    config: string
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

function optionalClickToSource(value: unknown): TemplateManifest['clickToSource'] {
  if (value === undefined) return undefined
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('template.json clickToSource must be an object.')
  }
  const record = value as Record<string, unknown>
  if (typeof record.tool !== 'string' || record.tool.length === 0) {
    throw new Error('template.json clickToSource.tool must name the inspector.')
  }
  if (
    typeof record.config !== 'string' ||
    record.config.length === 0 ||
    record.config.includes('..') ||
    path.isAbsolute(record.config)
  ) {
    throw new Error('template.json clickToSource.config must be a file inside the template.')
  }
  return { tool: record.tool, config: record.config }
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
