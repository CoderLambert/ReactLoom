import { createHash } from 'node:crypto'
import { lstat, readdir, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { compareBuilds, moduleAttribution, summarizeChunks } from './report-policy.mjs'

export const examples = fileURLToPath(new URL('.', import.meta.url))
export const lab = path.resolve(examples, '../../..')
export const reports = path.join(examples, 'reports')
export const variants = ['static', 'lazy']
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const require = createRequire(import.meta.url)

export async function assertReportsBoundary() {
  const info = await lstat(reports)
  if (!info.isDirectory() || info.isSymbolicLink()) {
    throw new Error('The fixed reports directory must not be a symlink')
  }
}

export function installedVersions() {
  const vitePackage = require.resolve('vite/package.json')
  const viteRequire = createRequire(vitePackage)
  const visualizerMain = fileURLToPath(import.meta.resolve('rollup-plugin-visualizer'))
  // The plugin does not export package.json; resolve its package relative to dist/plugin/index.js.
  return Promise.all([
    readFile(vitePackage, 'utf8'),
    readFile(viteRequire.resolve('rolldown/package.json'), 'utf8'),
    readFile(path.resolve(path.dirname(visualizerMain), '../../package.json'), 'utf8'),
  ]).then(([vite, rolldown, visualizer]) => ({
    node: process.versions.node,
    vite: JSON.parse(vite).version,
    rolldown: JSON.parse(rolldown).version,
    visualizer: JSON.parse(visualizer).version,
  }))
}

async function boundedFile(file) {
  const info = await lstat(file)
  if (!info.isFile() || info.isSymbolicLink() || info.size > 20 * 1024 * 1024) {
    throw new Error('Expected a bounded regular file')
  }
  return readFile(file)
}

async function listFiles(directory, prefix = '') {
  const names = (await readdir(directory)).sort()
  const files = []
  for (const name of names) {
    const relative = prefix ? `${prefix}/${name}` : name
    if (!prefix && name === 'reports') continue
    const absolute = path.join(directory, name)
    const info = await lstat(absolute)
    if (info.isSymbolicLink()) throw new Error('Symlinks are not allowed in fixture inputs/outputs')
    if (info.isDirectory()) files.push(...(await listFiles(absolute, relative)))
    else files.push(relative)
    if (files.length > 100) throw new Error('Too many fixture files')
  }
  return files
}

export async function computeInputDigest() {
  const sources = (await listFiles(examples)).map((file) => path.join(examples, file))
  sources.push(
    path.join(lab, 'package.json'),
    path.resolve(lab, '../../package.json'),
    path.resolve(lab, '../../pnpm-lock.yaml'),
    path.resolve(lab, '../../pnpm-workspace.yaml'),
  )
  const digest = createHash('sha256')
  for (const file of sources.sort()) {
    digest.update(path.relative(lab, file))
    digest.update('\0')
    digest.update(await boundedFile(file))
    digest.update('\0')
  }
  return digest.digest('hex')
}

export function buildCommand(variant) {
  if (!variants.includes(variant)) throw new Error('Unknown build variant')
  return {
    cwd: 'packages/library-lab',
    program: 'pnpm',
    args: [
      'exec',
      'vite',
      'build',
      '--config',
      'entries/F18-rollup-plugin-visualizer/examples/vite.config.ts',
      '--mode',
      variant,
    ],
    exitCode: 0,
  }
}

export async function readBuild(variant) {
  if (!variants.includes(variant)) throw new Error('Unknown build variant')
  await assertReportsBoundary()
  const directory = path.join(reports, variant)
  const info = await lstat(directory)
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Invalid build directory')
  const distInfo = await lstat(path.join(directory, 'dist'))
  const assetsInfo = await lstat(path.join(directory, 'dist/assets'))
  if (
    !distInfo.isDirectory() ||
    distInfo.isSymbolicLink() ||
    !assetsInfo.isDirectory() ||
    assetsInfo.isSymbolicLink()
  ) {
    throw new Error('Invalid artifact directory')
  }
  const inventory = JSON.parse(
    await boundedFile(path.join(directory, 'dist/bundle-inventory.json')),
  )
  const raw = JSON.parse(await boundedFile(path.join(directory, 'raw-data.json')))
  if (inventory.schemaVersion !== 1 || !Array.isArray(inventory.chunks)) {
    throw new Error('Invalid build inventory')
  }
  for (const chunk of inventory.chunks) {
    if (!/^assets\/[a-zA-Z0-9_.-]+\.js$/.test(chunk.file)) throw new Error('Invalid chunk path')
    const bytes = await boundedFile(path.join(directory, 'dist', chunk.file))
    if (
      bytes.length !== chunk.bytes ||
      sha256(bytes) !== chunk.sha256 ||
      gzipSync(bytes, { level: 9 }).byteLength !== chunk.gzipBytes
    ) {
      throw new Error('Actual chunk bytes differ from generated inventory')
    }
  }
  const artifacts = []
  for (const file of await listFiles(directory)) {
    const bytes = await boundedFile(path.join(directory, file))
    artifacts.push({ path: `${variant}/${file}`, bytes: bytes.length, sha256: sha256(bytes) })
  }
  for (const file of ['treemap.html', 'network.html']) {
    const html = await boundedFile(path.join(directory, file))
    if (!/<html[\s>]/i.test(html.toString())) throw new Error('Missing HTML report')
  }
  return {
    variant,
    command: buildCommand(variant),
    chunks: inventory.chunks,
    ...summarizeChunks(inventory.chunks),
    modules: moduleAttribution(raw),
    reportPaths: {
      treemap: `${variant}/treemap.html`,
      network: `${variant}/network.html`,
      raw: `${variant}/raw-data.json`,
    },
    artifacts,
  }
}

// Read-only: the platform can call this during generation. Never builds or deletes.
// This is freshness/integrity checking, not a signed receipt or SDK PASS.
export async function readCurrentSummary() {
  try {
    await assertReportsBoundary()
    const summary = JSON.parse(await boundedFile(path.join(reports, 'summary.json')))
    if (
      summary.schemaVersion !== 1 ||
      summary.entryId !== 'F18' ||
      !['basic', 'business', 'advanced'].includes(summary.scenario) ||
      !Number.isFinite(Date.parse(summary.generatedAt)) ||
      !Array.isArray(summary.builds) ||
      summary.builds.length < 1 ||
      summary.builds.length > 2
    ) {
      throw new Error('Invalid summary schema')
    }
    if (summary.inputDigest !== (await computeInputDigest()))
      throw new Error('Fixture inputs changed')
    if (JSON.stringify(summary.versions) !== JSON.stringify(await installedVersions())) {
      throw new Error('Installed runtime versions changed')
    }
    const names = summary.builds.map((build) => build.variant)
    const expectedNames = summary.scenario === 'basic' ? ['static'] : variants
    if (JSON.stringify(names) !== JSON.stringify(expectedNames))
      throw new Error('Missing scenario build')
    const currentBuilds = await Promise.all(names.map(readBuild))
    if (
      JSON.stringify(summary.builds) !== JSON.stringify(currentBuilds) ||
      JSON.stringify(summary.comparison) !== JSON.stringify(compareBuilds(currentBuilds))
    ) {
      throw new Error('Summary or actual generated artifacts changed')
    }
    return { status: 'ready', summary }
  } catch (error) {
    return {
      status: 'not-generated',
      reason:
        error.code === 'ENOENT' ? '尚未生成当前输入的构建摘要' : `构建摘要不可用：${error.message}`,
    }
  }
}
