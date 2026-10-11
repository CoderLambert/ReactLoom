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
    /** Shared dev-only helpers. Copied when true. */
    devtools: boolean
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
   * why-did-you-render. Expo sets `enabled` and points `config` at babel.config.js.
   * SPA and SSR set `enabled` to false. `reason` is the sentence in `config`.
   */
  whyDidYouRender?: {
    package: string
    version: string
    enabled: boolean
    config: string
    reason?: string
  }
  /**
   * `pnpm analyze`. `script` is the package.json command. `config` is the file
   * that wires the analyzer and must contain `marker`.
   */
  bundleAnalyze?: {
    package: string
    version: string
    config: string
    script: string
    marker: string
  }
  /**
   * Where a props diff comes from. `hook` is `@reactloom/devtools`.
   * `primary` is the tool that shows the diff without an extra overlay.
   */
  propsDiff?: {
    primary: string
    hook: string
    config: string
  }
  /**
   * Storybook. Web templates set `enabled` and name the framework package.
   * Mobile sets `enabled` to false. `reason` is the sentence in `config`.
   */
  storybook?: {
    enabled: boolean
    package: string
    version: string
    framework: string
    config: string
    stories?: string[]
    reason?: string
  }
  /**
   * Browser or device mocks. `msw` reuses `src/mocks/handlers.ts`.
   * `fixtures` is the Expo in-process stand-in. `flag` is the env variable.
   */
  browserMocks?: {
    mode: 'msw' | 'fixtures'
    flag: string
    config: string
    package?: string
    version?: string
    reason?: string
  }
  /**
   * Dev-time accessibility feedback. Web templates load `@axe-core/react`.
   * Mobile sets `enabled` to false and explains the missing DOM.
   */
  devA11y?: {
    enabled: boolean
    package: string
    version: string
    config: string
    reason?: string
  }
  /**
   * End-to-end runner. Web templates use Playwright. Mobile uses the Maestro flow.
   */
  e2e?: {
    tool: 'playwright' | 'maestro'
    config: string
    package?: string
    version?: string
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
  const devtools = packageRecord.devtools === undefined ? false : packageRecord.devtools
  if (typeof devtools !== 'boolean') {
    throw new Error('template.json packages.devtools must be a boolean.')
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
    packages: { 'api-client': packageRecord['api-client'], devtools, tsconfig },
    configs: stringList(record.configs, 'configs'),
    ci: record.ci,
    docker: record.docker,
    ai: {
      pointers: stringList(aiRecord.pointers, 'ai.pointers'),
      rules: stringList(aiRecord.rules, 'ai.rules'),
    },
    docs: stringList(record.docs, 'docs'),
    reactScan: optionalReactScan(record.reactScan),
    whyDidYouRender: optionalWhyDidYouRender(record.whyDidYouRender),
    bundleAnalyze: optionalBundleAnalyze(record.bundleAnalyze),
    propsDiff: optionalPropsDiff(record.propsDiff),
    storybook: optionalStorybook(record.storybook),
    browserMocks: optionalBrowserMocks(record.browserMocks),
    devA11y: optionalDevA11y(record.devA11y),
    e2e: optionalE2e(record.e2e),
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

function optionalWhyDidYouRender(value: unknown): TemplateManifest['whyDidYouRender'] {
  if (value === undefined) return undefined
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('template.json whyDidYouRender must be an object.')
  }
  const record = value as Record<string, unknown>
  if (record.package !== '@welldone-software/why-did-you-render') {
    throw new Error(
      'template.json whyDidYouRender.package must be @welldone-software/why-did-you-render.',
    )
  }
  const version = exactVersion(record.version, 'whyDidYouRender.version')
  if (typeof record.enabled !== 'boolean') {
    throw new Error('template.json whyDidYouRender.enabled must be a boolean.')
  }
  let reason: string | undefined
  if (record.enabled) {
    if (record.reason !== undefined) {
      throw new Error('template.json whyDidYouRender.reason is only used when the tool is off.')
    }
  } else if (typeof record.reason !== 'string' || record.reason.trim().length === 0) {
    throw new Error('template.json whyDidYouRender.reason must explain why the tool is off.')
  } else {
    reason = record.reason
  }
  return {
    package: '@welldone-software/why-did-you-render',
    version,
    enabled: record.enabled,
    config: templateFile(record.config, 'whyDidYouRender.config'),
    ...(reason === undefined ? {} : { reason }),
  }
}

function optionalBundleAnalyze(value: unknown): TemplateManifest['bundleAnalyze'] {
  if (value === undefined) return undefined
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('template.json bundleAnalyze must be an object.')
  }
  const record = value as Record<string, unknown>
  if (
    typeof record.package !== 'string' ||
    !/^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(record.package)
  ) {
    throw new Error('template.json bundleAnalyze.package must name the analyzer package.')
  }
  if (typeof record.script !== 'string' || record.script.trim().length === 0) {
    throw new Error('template.json bundleAnalyze.script must be the analyze command.')
  }
  if (typeof record.marker !== 'string' || record.marker.trim().length === 0) {
    throw new Error('template.json bundleAnalyze.marker must appear in the config file.')
  }
  return {
    package: record.package,
    version: exactVersion(record.version, 'bundleAnalyze.version'),
    config: templateFile(record.config, 'bundleAnalyze.config'),
    script: record.script,
    marker: record.marker,
  }
}

function optionalPropsDiff(value: unknown): TemplateManifest['propsDiff'] {
  if (value === undefined) return undefined
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('template.json propsDiff must be an object.')
  }
  const record = value as Record<string, unknown>
  if (record.hook !== '@reactloom/devtools') {
    throw new Error('template.json propsDiff.hook must be @reactloom/devtools.')
  }
  if (
    record.primary !== 'react-scan' &&
    record.primary !== '@welldone-software/why-did-you-render'
  ) {
    throw new Error(
      'template.json propsDiff.primary must be react-scan or @welldone-software/why-did-you-render.',
    )
  }
  return {
    primary: record.primary,
    hook: '@reactloom/devtools',
    config: templateFile(record.config, 'propsDiff.config'),
  }
}

function optionalStorybook(value: unknown): TemplateManifest['storybook'] {
  if (value === undefined) return undefined
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('template.json storybook must be an object.')
  }
  const record = value as Record<string, unknown>
  if (record.package !== 'storybook') {
    throw new Error('template.json storybook.package must be storybook.')
  }
  if (record.framework !== '@storybook/react-vite' && record.framework !== '@storybook/nextjs') {
    throw new Error(
      'template.json storybook.framework must be @storybook/react-vite or @storybook/nextjs.',
    )
  }
  if (typeof record.enabled !== 'boolean') {
    throw new Error('template.json storybook.enabled must be a boolean.')
  }
  let reason: string | undefined
  let stories: string[] | undefined
  if (record.enabled) {
    if (record.reason !== undefined) {
      throw new Error('template.json storybook.reason is only used when Storybook is off.')
    }
    if (!Array.isArray(record.stories) || record.stories.length === 0) {
      throw new Error('template.json storybook.stories must list the story files.')
    }
    stories = record.stories.map((entry) => templateFile(entry, 'storybook.stories'))
  } else if (typeof record.reason !== 'string' || record.reason.trim().length === 0) {
    throw new Error('template.json storybook.reason must explain why Storybook is off.')
  } else {
    reason = record.reason
    if (record.stories !== undefined) {
      throw new Error('template.json storybook.stories is only used when Storybook is on.')
    }
  }
  return {
    enabled: record.enabled,
    package: 'storybook',
    version: exactVersion(record.version, 'storybook.version'),
    framework: record.framework,
    config: templateFile(record.config, 'storybook.config'),
    ...(stories === undefined ? {} : { stories }),
    ...(reason === undefined ? {} : { reason }),
  }
}

function optionalBrowserMocks(value: unknown): TemplateManifest['browserMocks'] {
  if (value === undefined) return undefined
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('template.json browserMocks must be an object.')
  }
  const record = value as Record<string, unknown>
  if (record.mode !== 'msw' && record.mode !== 'fixtures') {
    throw new Error('template.json browserMocks.mode must be msw or fixtures.')
  }
  if (typeof record.flag !== 'string' || !/^[A-Z][A-Z0-9_]+$/.test(record.flag)) {
    throw new Error('template.json browserMocks.flag must be an env variable name.')
  }
  if (record.mode === 'msw') {
    if (record.package !== 'msw') {
      throw new Error('template.json browserMocks.package must be msw.')
    }
    if (record.reason !== undefined) {
      throw new Error('template.json browserMocks.reason is only used for fixture mode.')
    }
    return {
      mode: 'msw',
      flag: record.flag,
      config: templateFile(record.config, 'browserMocks.config'),
      package: 'msw',
      version: exactVersion(record.version, 'browserMocks.version'),
    }
  }
  if (typeof record.reason !== 'string' || record.reason.trim().length === 0) {
    throw new Error('template.json browserMocks.reason must explain why MSW is off.')
  }
  return {
    mode: 'fixtures',
    flag: record.flag,
    config: templateFile(record.config, 'browserMocks.config'),
    reason: record.reason,
  }
}

function optionalDevA11y(value: unknown): TemplateManifest['devA11y'] {
  if (value === undefined) return undefined
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('template.json devA11y must be an object.')
  }
  const record = value as Record<string, unknown>
  if (record.package !== '@axe-core/react') {
    throw new Error('template.json devA11y.package must be @axe-core/react.')
  }
  if (typeof record.enabled !== 'boolean') {
    throw new Error('template.json devA11y.enabled must be a boolean.')
  }
  let reason: string | undefined
  if (record.enabled) {
    if (record.reason !== undefined) {
      throw new Error('template.json devA11y.reason is only used when the tool is off.')
    }
  } else if (typeof record.reason !== 'string' || record.reason.trim().length === 0) {
    throw new Error('template.json devA11y.reason must explain why the tool is off.')
  } else {
    reason = record.reason
  }
  return {
    enabled: record.enabled,
    package: '@axe-core/react',
    version: exactVersion(record.version, 'devA11y.version'),
    config: templateFile(record.config, 'devA11y.config'),
    ...(reason === undefined ? {} : { reason }),
  }
}

function optionalE2e(value: unknown): TemplateManifest['e2e'] {
  if (value === undefined) return undefined
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('template.json e2e must be an object.')
  }
  const record = value as Record<string, unknown>
  if (record.tool !== 'playwright' && record.tool !== 'maestro') {
    throw new Error('template.json e2e.tool must be playwright or maestro.')
  }
  if (record.tool === 'playwright') {
    if (record.package !== '@playwright/test') {
      throw new Error('template.json e2e.package must be @playwright/test.')
    }
    return {
      tool: 'playwright',
      config: templateFile(record.config, 'e2e.config'),
      package: '@playwright/test',
      version: exactVersion(record.version, 'e2e.version'),
    }
  }
  return { tool: 'maestro', config: templateFile(record.config, 'e2e.config') }
}

function exactVersion(value: unknown, label: string): string {
  if (typeof value !== 'string' || !/^\d+\.\d+\.\d+$/.test(value)) {
    throw new Error(`template.json ${label} must be an exact version.`)
  }
  return value
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
