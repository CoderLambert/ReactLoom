import { spawn } from 'node:child_process'
import { cp, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { installAiConfig } from './ai-config.js'
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
])

export type ScaffoldOptions = {
  name: string
  template: TemplateId
  directory: string
  install?: boolean
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
): Promise<void> {
  for (const relative of relativePaths) {
    if (relative === '.github/workflows/ci.yml') {
      throw new Error(
        'List the template CI workflow in template.json "ci". Do not copy the monorepo workflow.',
      )
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
  await copyManifestFiles(repoRoot, options.directory, manifest.docs)

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
