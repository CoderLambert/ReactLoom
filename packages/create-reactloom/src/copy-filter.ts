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
