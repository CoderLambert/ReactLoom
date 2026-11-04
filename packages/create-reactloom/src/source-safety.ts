import { cp, lstat } from 'node:fs/promises'
import path from 'node:path'

// Manifest validation keeps strings relative; this also checks the filesystem.
// A trusted-looking path can still leave the repository through a symlink.
export async function assertSafeSourcePath(repoRoot: string, relative: string): Promise<void> {
  const root = path.resolve(repoRoot)
  const source = path.resolve(root, relative)
  const withinRoot = path.relative(root, source)
  if (
    !withinRoot ||
    withinRoot === '..' ||
    withinRoot.startsWith('..' + path.sep) ||
    path.isAbsolute(withinRoot)
  ) {
    throw new Error('Template source path must stay inside the repository: ' + relative)
  }

  let current = root
  for (const component of withinRoot.split(path.sep)) {
    current = path.join(current, component)
    if ((await lstat(current)).isSymbolicLink()) {
      throw new Error('Template source symlinks are not allowed: ' + path.relative(root, current))
    }
  }
}

export async function copySafeSource(
  source: string,
  destination: string,
  excludedNames: ReadonlySet<string>,
): Promise<void> {
  await cp(source, destination, {
    recursive: true,
    filter: async (entry) => {
      const name = path.basename(entry)
      if (excludedNames.has(name) || name.endsWith('.tsbuildinfo')) return false
      if ((await lstat(entry)).isSymbolicLink()) {
        throw new Error('Template source symlinks are not allowed: ' + entry)
      }
      return true
    },
  })
}
