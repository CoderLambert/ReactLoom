import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const manifestURL = new URL('../../package.json', import.meta.resolve('dependency-cruiser'))
const manifest = JSON.parse(readFileSync(manifestURL, 'utf8'))
if (manifest.name !== 'dependency-cruiser' || manifest.version !== '18.5.0')
  throw Error('Expected installed dependency-cruiser@18.5.0')
const cliFile = fileURLToPath(new URL(manifest.bin.depcruise, manifestURL))
const cwd = fileURLToPath(new URL('./workspace/', import.meta.url))
export function executeCruise(level, reporter) {
  if (!['basic', 'business', 'advanced'].includes(level) || !['json', 'err'].includes(reporter))
    throw Error('Unsupported isolated fixture or reporter')
  const args = [cliFile, '--config', 'config.cjs', '--output-type', reporter, `${level}/src`]
  return {
    ...spawnSync(process.execPath, args, {
      cwd,
      encoding: 'utf8',
      maxBuffer: 8_000_000,
      timeout: 60_000,
      windowsHide: true,
    }),
    command: [process.execPath, ...args],
    cwd,
  }
}
