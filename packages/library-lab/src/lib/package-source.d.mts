export interface PackageRef {
  name: string
  version: string | null
}
export const SHEETJS_CE_0203: string
export function allowedPackageResolution(pkg: PackageRef, manifestSpec: string | undefined): boolean
export function packageInstallCommand(packages: readonly PackageRef[]): string
