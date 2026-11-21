import { lstat } from 'node:fs/promises'
import path from 'node:path'

/** Keep documented template env samples, but never copy developer-local secrets. */
export function shouldCopyScaffoldEntry(
  entry: string,
  skippedNames: ReadonlySet<string>,
  permittedDevelopmentEnv?: string,
): boolean {
  const name = path.basename(entry)
  if (skippedNames.has(name) || name.endsWith('.tsbuildinfo')) return false
  if (name === '.env' || name === '.envrc' || name.startsWith('.envrc.')) return false
  // Only the template root's committed inspector config is intentional.
  // A nested/shared-package .env.development can contain local credentials.
  if (name === '.env.development') return entry === permittedDevelopmentEnv
  if (name.startsWith('.env.') && name !== '.env.example') return false
  return true
}

/** Reject copied symlinks before fs.cp stages potentially unsafe references. */
export async function shouldCopySafeScaffoldEntry(
  entry: string,
  skippedNames: ReadonlySet<string>,
  permittedDevelopmentEnv?: string,
): Promise<boolean> {
  if (!shouldCopyScaffoldEntry(entry, skippedNames, permittedDevelopmentEnv)) return false
  if ((await lstat(entry)).isSymbolicLink()) {
    throw new Error(`Template source symlinks are not allowed: ${entry}`)
  }
  return true
}
