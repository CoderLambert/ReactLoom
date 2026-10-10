import { spawn } from 'node:child_process'
import { cp, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { installAiConfig } from './ai-config.js'
import { findRepoRoot, readManifest, type TemplateId } from './templates.js'

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
    filter: (entry) => !SKIP_DIRS.has(path.basename(entry)),
  })
}

async function rewritePackageName(directory: string, name: string): Promise<void> {
  const packagePath = path.join(directory, 'package.json')
  const pkg = JSON.parse(await readFile(packagePath, 'utf8')) as { name?: string }
  pkg.name = name
  await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`)
}

export async function scaffold(options: ScaffoldOptions): Promise<void> {
  assertProjectName(options.name)
  await mkdir(path.dirname(options.directory), { recursive: true })
  await assertDestination(options.directory)

  const here = path.dirname(fileURLToPath(import.meta.url))
  const repoRoot = await findRepoRoot(here)
  const templateDir = path.join(repoRoot, 'templates', options.template)
  const manifest = await readManifest(templateDir)

  await copyFiltered(templateDir, options.directory)
  await mkdir(path.join(options.directory, 'packages'), { recursive: true })
  await copyFiltered(
    path.join(repoRoot, 'packages', 'api-client'),
    path.join(options.directory, 'packages', 'api-client'),
  )
  await copyFiltered(
    path.join(repoRoot, 'packages', 'tsconfig'),
    path.join(options.directory, 'packages', 'tsconfig'),
  )
  await copyFiltered(path.join(repoRoot, 'biome.json'), path.join(options.directory, 'biome.json'))
  await copyFiltered(
    path.join(repoRoot, '.editorconfig'),
    path.join(options.directory, '.editorconfig'),
  )

  await writeFile(
    path.join(options.directory, 'pnpm-workspace.yaml'),
    'packages:\n  - "packages/*"\n',
  )

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

  await rewritePackageName(options.directory, options.name)
  await installAiConfig({
    repoRoot,
    directory: options.directory,
    template: options.template,
    projectName: options.name,
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
