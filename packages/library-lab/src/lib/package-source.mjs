/** Deliberate, reviewable exception to registry packages: SheetJS CE release tarball. */
export const SHEETJS_CE_0203 = 'https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz'
const VALID_NAME = /^(?:@[a-z0-9._-]+\/)?[a-z0-9][a-z0-9._-]*$/u
const VALID_VERSION = /^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/u

/** Prefer the official, versioned CE distribution over the stale npm registry xlsx. */
export function allowedPackageResolution(pkg, manifestSpec) {
  if (!pkg || !VALID_NAME.test(pkg.name) || typeof manifestSpec !== 'string') return false
  if (pkg.name === 'xlsx') return pkg.version === '0.20.3' && manifestSpec === SHEETJS_CE_0203
  return (
    pkg.version === null || (VALID_VERSION.test(pkg.version ?? '') && manifestSpec === pkg.version)
  )
}

/** A printed command, never passed to a shell or used for automatic dependency installation. */
export function packageInstallCommand(packages) {
  if (!Array.isArray(packages) || packages.length === 0) return '无需额外安装 npm 包'
  const specs = packages.map((pkg) => {
    if (!pkg || !VALID_NAME.test(pkg.name)) throw new Error('Invalid package name')
    if (pkg.name === 'xlsx') {
      if (pkg.version !== '0.20.3') throw new Error('Unreviewed SheetJS CE version')
      return 'xlsx@' + SHEETJS_CE_0203
    }
    if (pkg.version !== null && !VALID_VERSION.test(pkg.version ?? ''))
      throw new Error('Invalid pinned package version')
    return pkg.name + (pkg.version ? '@' + pkg.version : '')
  })
  return 'pnpm add ' + specs.join(' ')
}
