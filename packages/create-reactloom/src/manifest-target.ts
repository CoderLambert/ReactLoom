import { lstat } from 'node:fs/promises'
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
