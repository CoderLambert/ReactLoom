import path from 'node:path'

/** Keep documented template env samples, but never copy developer-local secrets. */
export function shouldCopyScaffoldEntry(entry: string, skippedNames: ReadonlySet<string>): boolean {
  const name = path.basename(entry)
  if (skippedNames.has(name) || name.endsWith('.tsbuildinfo')) return false
  if (name === '.env') return false
  if (name.startsWith('.env.') && name !== '.env.example' && name !== '.env.development') {
    return false
  }
  return true
}
