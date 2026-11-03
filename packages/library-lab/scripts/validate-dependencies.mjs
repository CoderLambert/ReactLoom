/** Static dependency-contract audit. Does not claim npm packages are installed. */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { allowedPackageResolution } from '../src/lib/package-source.mjs'
import { loadEntries } from './find-library.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const npmName = /^(?:@[a-z0-9._-]+\/)?[a-z0-9][a-z0-9._-]*$/u
export function checkDependencyContract(entries, manifest) {
  const versions = { ...manifest.dependencies, ...manifest.devDependencies }
  const errors = []
  let checked = 0,
    referenced = 0
  for (const entry of entries) {
    if (!entry.demos?.length) continue
    checked++
    const names = new Set()
    for (const pkg of entry.packages ?? []) {
      referenced++
      if (!npmName.test(pkg.name)) {
        errors.push(`${entry.entryId}: invalid npm name ${String(pkg.name)}`)
        continue
      }
      if (names.has(pkg.name)) errors.push(`${entry.entryId}: duplicate package ${pkg.name}`)
      names.add(pkg.name)
      if (!Object.hasOwn(versions, pkg.name))
        errors.push(`${entry.entryId}: missing ${pkg.name} in Library Lab dependencies`)
      else if (!allowedPackageResolution(pkg, versions[pkg.name]))
        errors.push(
          `${entry.entryId}: ${pkg.name} metadata ${pkg.version}, manifest ${versions[pkg.name]}`,
        )
    }
  }
  return { checked, referenced, errors }
}
export async function runDependencyAudit({
  entriesRoot = path.join(root, 'entries'),
  manifestPath = path.join(root, 'package.json'),
} = {}) {
  const [entries, raw] = await Promise.all([
    loadEntries(entriesRoot),
    readFile(manifestPath, 'utf8'),
  ])
  return checkDependencyContract(entries, JSON.parse(raw))
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await runDependencyAudit()
  console.log(
    `Static dependency contract: ${result.checked} demo entries, ${result.referenced} package references`,
  )
  if (result.errors.length) {
    for (const error of result.errors) console.error(error)
    process.exitCode = 1
  } else console.log('Manifest contracts consistent (installation and SDK runtime NOT verified).')
}
