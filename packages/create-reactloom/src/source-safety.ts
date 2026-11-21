import { lstat } from 'node:fs/promises'
import path from 'node:path'

/** Manifest validation checks strings; this checks each on-disk ancestor before reading. */
export async function assertSafeScaffoldSource(repoRoot: string, relative: string): Promise<void> {
  const root = path.resolve(repoRoot)
  const source = path.resolve(root, relative)
  const withinRoot = path.relative(root, source)
  if (
    !withinRoot ||
    withinRoot === '..' ||
    withinRoot.startsWith(`..${path.sep}`) ||
    path.isAbsolute(withinRoot)
  ) {
    throw new Error(`Template source path must stay inside the repository: ${relative}`)
  }

  let current = root
  for (const segment of withinRoot.split(path.sep)) {
    current = path.join(current, segment)
    if ((await lstat(current)).isSymbolicLink()) {
      throw new Error(`Template source symlinks are not allowed: ${path.relative(root, current)}`)
    }
  }
}
