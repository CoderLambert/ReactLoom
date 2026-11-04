/** Hash execution inputs, not generated output, documents, or evidence metadata. */
import { createHash } from 'node:crypto'
import { lstat, readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const hash = (value) => createHash('sha256').update(value).digest('hex')
async function collect(root, relative, rows) {
  const full = path.join(root, relative)
  let stat
  try {
    stat = await lstat(full)
  } catch (error) {
    if (error.code === 'ENOENT') return
    throw error
  }
  if (stat.isSymbolicLink())
    throw new Error('Verification input must not be a symlink: ' + relative)
  if (stat.isDirectory()) {
    for (const name of (await readdir(full)).sort()) {
      if (
        ['node_modules', 'dist', '.local-evidence'].includes(name) ||
        ['src/generated', 'runners/msw/public'].includes(
          path.join(relative, name).split(path.sep).join('/'),
        )
      )
        continue
      await collect(root, path.join(relative, name), rows)
    }
  } else if (stat.isFile()) {
    if (stat.size > 32 * 1024 * 1024) throw new Error('Verification input too large: ' + relative)
    rows.push([relative.split(path.sep).join('/'), hash(await readFile(full))])
  }
}
export async function sharedInputsFingerprint(packageRoot) {
  const rows = [],
    repo = path.resolve(packageRoot, '../..')
  for (const file of ['pnpm-lock.yaml', 'pnpm-workspace.yaml', 'package.json', '.npmrc']) {
    const record = []
    await collect(repo, file, record)
    rows.push(...record.map(([name, digest]) => ['repo/' + name, digest]))
  }
  for (const file of [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'playwright.config.ts',
    'src',
    'scripts',
    'runners',
    'e2e',
    'tests',
  ]) {
    const record = []
    await collect(packageRoot, file, record)
    rows.push(...record.map(([name, digest]) => ['lab/' + name, digest]))
  }
  return hash(JSON.stringify(rows))
}
export async function entryInputsFingerprint(folder, shared) {
  const rows = []
  for (const file of ['library.json', 'examples', 'tests']) await collect(folder, file, rows)
  return hash(JSON.stringify({ shared, files: rows }))
}
