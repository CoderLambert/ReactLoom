import { spawn } from 'node:child_process'
import { cp, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { adaptBestPractices, installAiConfig } from './ai-config.js'
import { type DeployTarget, writeDeployFiles } from './deploy.js'
import {
  DOCKER_FILES,
  type PackageJson,
  pruneProjectPackage,
  pruneTsconfigPackage,
  rewriteChangesetConfig,
  unselectedFrameworkFiles,
  workspaceYaml,
} from './selection.js'
import { findRepoRoot, readManifest, type TemplateId, type TemplateManifest } from './templates.js'

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.next',
  '.expo',
  'coverage',
  'playwright-report',
  'test-results',
  '.turbo',
  'storybook-static',
])

export type ScaffoldOptions = {
  name: string
  template: TemplateId
  directory: string
  install?: boolean
  deploy?: DeployTarget
}

const NAME_PATTERN = /^[a-z][a-z0-9-]*$/

export function assertProjectName(name: string): void {
  if (!NAME_PATTERN.test(name)) {
    throw new Error('Project name must be lowercase and start with a letter (a-z, 0-9, hyphen).')
  }
}

async function assertDestination(directory: string): Promise<void> {
  try {
    const info = await stat(directory)
    if (!info.isDirectory()) {
      throw new Error(`Destination exists and is not a directory: ${directory}`)
    }
    throw new Error(`Destination already exists: ${directory}`)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return
    throw error
  }
}

async function copyFiltered(source: string, destination: string): Promise<void> {
  await cp(source, destination, {
    recursive: true,
    filter: (entry) => {
      const base = path.basename(entry)
      return !SKIP_DIRS.has(base) && !base.endsWith('.tsbuildinfo')
    },
  })
}

async function copyRepoPath(repoRoot: string, relative: string, directory: string): Promise<void> {
  const source = path.join(repoRoot, relative)
  try {
    await stat(source)
  } catch {
    throw new Error(`Manifest path does not exist: ${relative}`)
  }
  const destination = path.join(directory, relative)
  await mkdir(path.dirname(destination), { recursive: true })
  await copyFiltered(source, destination)
}

async function copySharedPackages(
  repoRoot: string,
  directory: string,
  manifest: TemplateManifest,
): Promise<void> {
  await mkdir(path.join(directory, 'packages'), { recursive: true })
  if (manifest.packages['api-client']) {
    await copyFiltered(
      path.join(repoRoot, 'packages', 'api-client'),
      path.join(directory, 'packages', 'api-client'),
    )
  }
  if (manifest.packages.devtools) {
    await copyFiltered(
      path.join(repoRoot, 'packages', 'devtools'),
      path.join(directory, 'packages', 'devtools'),
    )
  }
  if (manifest.packages.tsconfig.length === 0) return

  const sourceDir = path.join(repoRoot, 'packages', 'tsconfig')
  const destDir = path.join(directory, 'packages', 'tsconfig')
  await mkdir(destDir, { recursive: true })
  await copyFiltered(path.join(sourceDir, 'package.json'), path.join(destDir, 'package.json'))
  for (const preset of manifest.packages.tsconfig) {
    const relative = path.posix.join('packages/tsconfig', preset)
    try {
      await stat(path.join(sourceDir, preset))
    } catch {
      throw new Error(`Manifest path does not exist: ${relative}`)
    }
    await copyFiltered(path.join(sourceDir, preset), path.join(destDir, preset))
  }
  const packagePath = path.join(destDir, 'package.json')
  const pkg = JSON.parse(await readFile(packagePath, 'utf8')) as PackageJson
  const pruned = pruneTsconfigPackage(pkg, manifest.packages.tsconfig)
  await writeFile(packagePath, `${JSON.stringify(pruned, null, 2)}\n`)
}

async function copyManifestFiles(
  repoRoot: string,
  directory: string,
  relativePaths: readonly string[],
  adapt?: { template: TemplateId; projectName: string },
): Promise<void> {
  for (const relative of relativePaths) {
    if (relative === '.github/workflows/ci.yml') {
      throw new Error(
        'List the template CI workflow in template.json "ci". Do not copy the monorepo workflow.',
      )
    }
    if (adapt && relative.startsWith('docs/best-practices/')) {
      const source = path.join(repoRoot, relative)
      let contents: string
      try {
        contents = await readFile(source, 'utf8')
      } catch {
        throw new Error(`Manifest path does not exist: ${relative}`)
      }
      const destination = path.join(directory, relative)
      await mkdir(path.dirname(destination), { recursive: true })
      await writeFile(destination, adaptBestPractices(contents, adapt.template, adapt.projectName))
      continue
    }
    await copyRepoPath(repoRoot, relative, directory)
  }
}

async function writeProjectPackage(
  directory: string,
  name: string,
  manifest: TemplateManifest,
  repoRoot: string,
): Promise<void> {
  const packagePath = path.join(directory, 'package.json')
  const pkg = JSON.parse(await readFile(packagePath, 'utf8')) as PackageJson
  const rootPkg = JSON.parse(
    await readFile(path.join(repoRoot, 'package.json'), 'utf8'),
  ) as PackageJson
  const versions = { ...(rootPkg.dependencies ?? {}), ...(rootPkg.devDependencies ?? {}) }
  const pruned = pruneProjectPackage({ ...pkg, name }, manifest, versions)
  await writeFile(packagePath, `${JSON.stringify(pruned, null, 2)}\n`)
}

async function assertClickToSource(directory: string, manifest: TemplateManifest): Promise<void> {
  const click = manifest.clickToSource
  if (!click) {
    throw new Error(
      'template.json clickToSource must name the inspector plugin and the launch-editor file.',
    )
  }
  const launcherDir = path.posix.dirname(click.launcher)
  const relatives = [
    click.config,
    click.launchEditor,
    click.launcher,
    path.posix.join(launcherDir, 'code'),
    path.posix.join(launcherDir, 'code.cmd'),
  ]
  for (const relative of relatives) {
    try {
      await stat(path.join(directory, relative))
    } catch {
      throw new Error(`Template is missing its click-to-source file: ${relative}`)
    }
  }
  const envText = await readFile(path.join(directory, click.launchEditor), 'utf8')
  for (const line of envText.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.length === 0 || trimmed.startsWith('#')) continue
    if (/^(CODE_EDITOR|LAUNCH_EDITOR|REACT_EDITOR)=/.test(trimmed)) {
      throw new Error(
        `${click.launchEditor} must leave the editor unset so scripts/open-in-editor.mjs can detect it.`,
      )
    }
  }
  const pkg = JSON.parse(
    await readFile(path.join(directory, 'package.json'), 'utf8'),
  ) as PackageJson
  const installed = pkg.devDependencies?.[click.plugin] ?? pkg.dependencies?.[click.plugin]
  if (installed !== click.version) {
    throw new Error(
      `template.json clickToSource expects ${click.plugin}@${click.version}, found ${installed ?? 'nothing'}.`,
    )
  }
}

async function assertReactScan(directory: string, manifest: TemplateManifest): Promise<void> {
  const scan = manifest.reactScan
  if (!scan) {
    throw new Error('template.json reactScan must name the react-scan package and its config file.')
  }
  const configPath = path.join(directory, scan.config)
  let configText: string
  try {
    configText = await readFile(configPath, 'utf8')
  } catch {
    throw new Error(`Template is missing its React Scan file: ${scan.config}`)
  }
  const pkg = JSON.parse(
    await readFile(path.join(directory, 'package.json'), 'utf8'),
  ) as PackageJson
  const installed = pkg.devDependencies?.[scan.package] ?? pkg.dependencies?.[scan.package]
  if (scan.enabled) {
    if (installed !== scan.version) {
      throw new Error(
        `template.json reactScan expects ${scan.package}@${scan.version}, found ${installed ?? 'nothing'}.`,
      )
    }
    const imported =
      configText.includes(`from '${scan.package}'`) || configText.includes(`from "${scan.package}"`)
    if (!imported) {
      throw new Error(`template.json reactScan.config must import ${scan.package}.`)
    }
    return
  }
  if (installed !== undefined) {
    throw new Error(
      `template.json reactScan is disabled, but ${scan.package} is still a dependency.`,
    )
  }
  if (!scan.reason || !configText.includes(scan.reason)) {
    throw new Error('template.json reactScan.config must include the reason React Scan is off.')
  }
}

async function readTemplateText(
  directory: string,
  relative: string,
  label: string,
): Promise<string> {
  try {
    return await readFile(path.join(directory, relative), 'utf8')
  } catch {
    throw new Error(`Template is missing its ${label} file: ${relative}`)
  }
}

function dependencyVersion(pkg: PackageJson, name: string): string | undefined {
  return pkg.devDependencies?.[name] ?? pkg.dependencies?.[name]
}

async function assertWhyDidYouRender(directory: string, manifest: TemplateManifest): Promise<void> {
  const wdyr = manifest.whyDidYouRender
  if (!wdyr) {
    throw new Error('template.json whyDidYouRender must name the package and its config file.')
  }
  const configText = await readTemplateText(directory, wdyr.config, 'why-did-you-render')
  const pkg = JSON.parse(
    await readFile(path.join(directory, 'package.json'), 'utf8'),
  ) as PackageJson
  const installed = dependencyVersion(pkg, wdyr.package)
  if (wdyr.enabled) {
    if (installed !== wdyr.version) {
      throw new Error(
        `template.json whyDidYouRender expects ${wdyr.package}@${wdyr.version}, found ${installed ?? 'nothing'}.`,
      )
    }
    if (
      !configText.includes('jsxImportSource') ||
      !configText.includes(wdyr.package) ||
      !configText.includes("NODE_ENV !== 'production'")
    ) {
      throw new Error(
        'template.json whyDidYouRender.config must set jsxImportSource outside production.',
      )
    }
    // Expo is the template that enables this. The entry has to load the tracker
    // before React. babel.config.js cannot do that on its own.
    const entry = await readTemplateText(directory, 'index.js', 'why-did-you-render entry')
    if (!entry.includes('./src/lib/wdyr') || !entry.includes('expo-router/entry')) {
      throw new Error('index.js must import src/lib/wdyr before expo-router/entry.')
    }
    const init = await readTemplateText(directory, 'src/lib/wdyr.js', 'why-did-you-render init')
    if (
      !init.includes('whyDidYouRender') ||
      !init.includes('trackAllPureComponents') ||
      !init.includes('__DEV__')
    ) {
      throw new Error('src/lib/wdyr.js must call whyDidYouRender in development.')
    }
    if (pkg.main !== 'index.js') {
      throw new Error('package.json main must be index.js so why-did-you-render loads first.')
    }
    return
  }
  if (installed !== undefined) {
    throw new Error(
      `template.json whyDidYouRender is disabled, but ${wdyr.package} is still a dependency.`,
    )
  }
  if (!wdyr.reason || !configText.includes(wdyr.reason)) {
    throw new Error('template.json whyDidYouRender.config must include the reason the tool is off.')
  }
}

async function assertBundleAnalyze(directory: string, manifest: TemplateManifest): Promise<void> {
  const analyze = manifest.bundleAnalyze
  if (!analyze) {
    throw new Error(
      'template.json bundleAnalyze must name the analyzer, its script, and its config.',
    )
  }
  const configText = await readTemplateText(directory, analyze.config, 'bundle analyzer')
  if (!configText.includes(analyze.marker)) {
    throw new Error(`template.json bundleAnalyze.config must contain ${analyze.marker}.`)
  }
  const pkg = JSON.parse(
    await readFile(path.join(directory, 'package.json'), 'utf8'),
  ) as PackageJson
  if (pkg.scripts?.analyze !== analyze.script) {
    throw new Error(
      `package.json analyze must be "${analyze.script}", found "${pkg.scripts?.analyze ?? ''}".`,
    )
  }
  const installed = dependencyVersion(pkg, analyze.package)
  if (installed !== analyze.version) {
    throw new Error(
      `template.json bundleAnalyze expects ${analyze.package}@${analyze.version}, found ${installed ?? 'nothing'}.`,
    )
  }
}

async function assertPropsDiff(directory: string, manifest: TemplateManifest): Promise<void> {
  const diff = manifest.propsDiff
  if (!diff) {
    throw new Error('template.json propsDiff must name the primary tool and the hook package.')
  }
  if (!manifest.packages.devtools) {
    throw new Error('template.json packages.devtools must be true when propsDiff is set.')
  }
  const hookText = await readTemplateText(
    directory,
    'packages/devtools/src/use-why-did-you-update.ts',
    'props diff hook',
  )
  if (!hookText.includes('export function useWhyDidYouUpdate')) {
    throw new Error('packages/devtools must export useWhyDidYouUpdate.')
  }
  const pkg = JSON.parse(
    await readFile(path.join(directory, 'package.json'), 'utf8'),
  ) as PackageJson
  if (dependencyVersion(pkg, diff.hook) !== 'workspace:*') {
    throw new Error(`template.json propsDiff.hook must depend on ${diff.hook}@workspace:*.`)
  }
  const configText = await readTemplateText(directory, diff.config, 'props diff')
  if (diff.primary === 'react-scan') {
    const imported =
      configText.includes("from 'react-scan'") || configText.includes('from "react-scan"')
    if (!imported) throw new Error('template.json propsDiff.config must import react-scan.')
    return
  }
  if (!configText.includes('whyDidYouRender')) {
    throw new Error('template.json propsDiff.config must call whyDidYouRender.')
  }
}

function devGate(text: string): boolean {
  return text.includes('import.meta.env.DEV') || text.includes('NODE_ENV')
}

async function assertStorybook(directory: string, manifest: TemplateManifest): Promise<void> {
  const storybook = manifest.storybook
  if (!storybook) {
    throw new Error('template.json storybook must name the package, version, and config.')
  }
  const configText = await readTemplateText(directory, storybook.config, 'storybook')
  const pkg = JSON.parse(
    await readFile(path.join(directory, 'package.json'), 'utf8'),
  ) as PackageJson
  if (storybook.enabled) {
    if (dependencyVersion(pkg, storybook.package) !== storybook.version) {
      throw new Error(
        `template.json storybook expects ${storybook.package}@${storybook.version}, found ${dependencyVersion(pkg, storybook.package) ?? 'nothing'}.`,
      )
    }
    if (dependencyVersion(pkg, storybook.framework) !== storybook.version) {
      throw new Error(
        `template.json storybook expects ${storybook.framework}@${storybook.version}, found ${dependencyVersion(pkg, storybook.framework) ?? 'nothing'}.`,
      )
    }
    if (!dependencyVersion(pkg, '@storybook/addon-a11y')) {
      throw new Error('template.json storybook is on, but @storybook/addon-a11y is not installed.')
    }
    if (!dependencyVersion(pkg, 'msw-storybook-addon')) {
      throw new Error('template.json storybook is on, but msw-storybook-addon is not installed.')
    }
    if (
      !configText.includes(storybook.framework) ||
      !configText.includes('@storybook/addon-a11y') ||
      !configText.includes('msw-storybook-addon')
    ) {
      throw new Error(
        'template.json storybook.config must load the framework, the a11y addon, and msw-storybook-addon.',
      )
    }
    if (!pkg.scripts?.storybook?.includes('storybook dev')) {
      throw new Error('package.json storybook must run storybook dev.')
    }
    const built = pkg.scripts?.['build-storybook'] ?? ''
    if (!built.includes('STORYBOOK=true') || !built.includes('storybook build')) {
      throw new Error(
        'package.json build-storybook must set STORYBOOK=true and run storybook build.',
      )
    }
    for (const relative of storybook.stories ?? []) {
      await readTemplateText(directory, relative, 'story')
    }
    const preview = storybook.config.replace(/main\.ts$/, 'preview.ts')
    const previewText = await readTemplateText(directory, preview, 'storybook preview')
    if (!previewText.includes('msw')) {
      throw new Error('Storybook preview must start MSW with the template handlers.')
    }
    return
  }
  for (const name of [
    'storybook',
    storybook.framework,
    '@storybook/addon-a11y',
    'msw-storybook-addon',
  ]) {
    if (dependencyVersion(pkg, name) !== undefined) {
      throw new Error(`template.json storybook is disabled, but ${name} is still a dependency.`)
    }
  }
  if (pkg.scripts?.storybook !== undefined || pkg.scripts?.['build-storybook'] !== undefined) {
    throw new Error('template.json storybook is disabled, but a storybook script is still present.')
  }
  if (!storybook.reason || !configText.includes(storybook.reason)) {
    throw new Error('template.json storybook.config must include the reason Storybook is off.')
  }
}

async function assertBrowserMocks(directory: string, manifest: TemplateManifest): Promise<void> {
  const mocks = manifest.browserMocks
  if (!mocks) {
    throw new Error('template.json browserMocks must name the mode, the flag, and the config.')
  }
  const configText = await readTemplateText(directory, mocks.config, 'browser mocks')
  const pkg = JSON.parse(
    await readFile(path.join(directory, 'package.json'), 'utf8'),
  ) as PackageJson
  if (mocks.mode === 'msw') {
    const installed = dependencyVersion(pkg, 'msw')
    if (installed !== mocks.version) {
      throw new Error(
        `template.json browserMocks expects msw@${mocks.version ?? ''}, found ${installed ?? 'nothing'}.`,
      )
    }
    if (!configText.includes(mocks.flag) || !devGate(configText)) {
      throw new Error(
        'template.json browserMocks.config must read the flag and start the worker only in development.',
      )
    }
    const handlers = await readTemplateText(directory, 'src/mocks/handlers.ts', 'msw handlers')
    if (!handlers.includes('http.')) {
      throw new Error('src/mocks/handlers.ts must define the shared MSW handlers.')
    }
    return
  }
  if (dependencyVersion(pkg, 'msw') !== undefined) {
    throw new Error('template.json browserMocks is fixtures, but msw is still a dependency.')
  }
  if (!mocks.reason || !configText.includes(mocks.flag) || !configText.includes(mocks.reason)) {
    throw new Error(
      'template.json browserMocks.config must include the flag and the reason MSW is off.',
    )
  }
}

async function assertDevA11y(directory: string, manifest: TemplateManifest): Promise<void> {
  const a11y = manifest.devA11y
  if (!a11y) {
    throw new Error('template.json devA11y must name @axe-core/react and its config file.')
  }
  const configText = await readTemplateText(directory, a11y.config, 'dev accessibility')
  const pkg = JSON.parse(
    await readFile(path.join(directory, 'package.json'), 'utf8'),
  ) as PackageJson
  const installed = dependencyVersion(pkg, a11y.package)
  if (a11y.enabled) {
    if (installed !== a11y.version) {
      throw new Error(
        `template.json devA11y expects ${a11y.package}@${a11y.version}, found ${installed ?? 'nothing'}.`,
      )
    }
    if (!configText.includes(a11y.package) || !devGate(configText)) {
      throw new Error('template.json devA11y.config must load @axe-core/react only in development.')
    }
    return
  }
  if (installed !== undefined) {
    throw new Error(`template.json devA11y is disabled, but ${a11y.package} is still a dependency.`)
  }
  if (!a11y.reason || !configText.includes(a11y.reason)) {
    throw new Error('template.json devA11y.config must include the reason the tool is off.')
  }
}

async function assertE2e(directory: string, manifest: TemplateManifest): Promise<void> {
  const e2e = manifest.e2e
  if (!e2e) {
    throw new Error('template.json e2e must name the runner and its config file.')
  }
  const pkg = JSON.parse(
    await readFile(path.join(directory, 'package.json'), 'utf8'),
  ) as PackageJson
  if (e2e.tool === 'playwright') {
    const installed = dependencyVersion(pkg, '@playwright/test')
    if (installed !== e2e.version) {
      throw new Error(
        `template.json e2e expects @playwright/test@${e2e.version ?? ''}, found ${installed ?? 'nothing'}.`,
      )
    }
    await readTemplateText(directory, e2e.config, 'playwright')
    if (pkg.scripts?.['test:e2e'] !== 'playwright test') {
      throw new Error('package.json test:e2e must be playwright test.')
    }
    const spec = await readTemplateText(directory, 'e2e/workshop.spec.ts', 'playwright axe spec')
    if (!spec.includes('@axe-core/playwright')) {
      throw new Error('e2e/workshop.spec.ts must run @axe-core/playwright.')
    }
    return
  }
  const flow = await readTemplateText(directory, e2e.config, 'maestro')
  if (!flow.includes('appId:') || !flow.includes('launchApp')) {
    throw new Error('template.json e2e.config must be a Maestro flow with appId and launchApp.')
  }
  if (dependencyVersion(pkg, '@playwright/test') !== undefined) {
    throw new Error('template.json e2e is maestro, but @playwright/test is still a dependency.')
  }
  if (pkg.scripts?.['test:e2e'] !== undefined) {
    throw new Error('template.json e2e is maestro, but test:e2e is still a script.')
  }
}

async function rewriteChangesetIgnore(directory: string, projectName: string): Promise<void> {
  const configPath = path.join(directory, '.changeset', 'config.json')
  try {
    await stat(configPath)
  } catch {
    return
  }
  const config = JSON.parse(await readFile(configPath, 'utf8')) as { ignore?: string[] }
  await writeFile(
    configPath,
    `${JSON.stringify(rewriteChangesetConfig(config, projectName), null, 2)}\n`,
  )
}

export async function scaffold(options: ScaffoldOptions): Promise<void> {
  assertProjectName(options.name)
  await mkdir(path.dirname(options.directory), { recursive: true })
  await assertDestination(options.directory)

  const here = path.dirname(fileURLToPath(import.meta.url))
  const repoRoot = await findRepoRoot(here)
  const templateDir = path.join(repoRoot, 'templates', options.template)
  const manifest = await readManifest(templateDir)
  if (manifest.id !== options.template) {
    throw new Error(`template.json id "${manifest.id}" does not match ${options.template}.`)
  }

  await copyFiltered(templateDir, options.directory)
  await copySharedPackages(repoRoot, options.directory, manifest)
  await copyManifestFiles(repoRoot, options.directory, manifest.configs)
  await copyManifestFiles(repoRoot, options.directory, manifest.docs, {
    template: options.template,
    projectName: options.name,
  })

  const workflow = path.join(options.directory, manifest.ci)
  try {
    await stat(workflow)
  } catch {
    throw new Error(`Template is missing its CI workflow: ${manifest.ci}`)
  }

  await writeFile(path.join(options.directory, 'pnpm-workspace.yaml'), workspaceYaml(manifest))

  for (const [from, to] of Object.entries(manifest.rename ?? {})) {
    await rename(path.join(options.directory, from), path.join(options.directory, to))
  }

  for (const relative of manifest.replacements ?? []) {
    const filePath = path.join(options.directory, relative.file)
    const contents = await readFile(filePath, 'utf8')
    if (!contents.includes(relative.from)) {
      throw new Error(`Replacement target was not found in ${relative.file}`)
    }
    await writeFile(filePath, contents.replaceAll(relative.from, relative.to))
  }

  for (const relative of manifest.strip ?? ['template.json']) {
    await rm(path.join(options.directory, relative), { force: true, recursive: true })
  }

  if (!manifest.docker) {
    for (const relative of DOCKER_FILES) {
      await rm(path.join(options.directory, relative), { force: true })
    }
  }
  for (const relative of unselectedFrameworkFiles(manifest)) {
    await rm(path.join(options.directory, relative), { force: true })
  }

  await writeProjectPackage(options.directory, options.name, manifest, repoRoot)
  await assertClickToSource(options.directory, manifest)
  await assertReactScan(options.directory, manifest)
  await assertWhyDidYouRender(options.directory, manifest)
  await assertBundleAnalyze(options.directory, manifest)
  await assertPropsDiff(options.directory, manifest)
  await assertStorybook(options.directory, manifest)
  await assertBrowserMocks(options.directory, manifest)
  await assertDevA11y(options.directory, manifest)
  await assertE2e(options.directory, manifest)
  if (options.deploy === 'self-hosted') {
    await writeDeployFiles(options.directory, options.template)
  }
  await rewriteChangesetIgnore(options.directory, options.name)
  await installAiConfig({
    repoRoot,
    directory: options.directory,
    template: options.template,
    projectName: options.name,
    rules: manifest.ai.rules,
    pointers: manifest.ai.pointers,
  })

  if (options.install) {
    await runInstall(options.directory)
  }
}

function runInstall(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', ['install'], { cwd, stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`pnpm install exited with code ${code ?? 'unknown'}`))
    })
  })
}
