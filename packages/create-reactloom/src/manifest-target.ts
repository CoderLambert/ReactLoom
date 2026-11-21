import { lstat, rename } from 'node:fs/promises'
import path from 'node:path'

/** Refuse to replace content already staged from the selected template. */
export async function assertManifestCopyTargetAvailable(
  directory: string,
  relative: string,
): Promise<void> {
  try {
    await lstat(path.join(directory, relative))
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return
    throw error
  }
  throw new Error(`template.json copy target already exists: ${relative}`)
}

/** Refuse to replace a file already staged by the selected template. */
export async function renameManifestFile(
  directory: string,
  source: string,
  target: string,
): Promise<void> {
  const destination = path.join(directory, target)
  try {
    await lstat(destination)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      await rename(path.join(directory, source), destination)
      return
    }
    throw error
  }
  throw new Error(`template.json rename target already exists: ${target}`)
}
