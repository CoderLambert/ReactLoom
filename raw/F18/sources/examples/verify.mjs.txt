import { spawnSync } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { compareBuilds, evaluateBudget } from './report-policy.mjs'
import {
  assertReportsBoundary,
  buildCommand,
  computeInputDigest,
  installedVersions,
  lab,
  readBuild,
  readCurrentSummary,
  reports,
} from './summary-reader.mjs'

const args = process.argv.slice(2)
const scenarioOption = args.find((arg) => arg.startsWith('--scenario='))
const scenario = scenarioOption?.slice('--scenario='.length) ?? 'advanced'
if (
  !['basic', 'business', 'advanced'].includes(scenario) ||
  args.some((arg) => arg !== scenarioOption)
) {
  throw new Error(
    'Usage: node entries/F18-rollup-plugin-visualizer/examples/verify.mjs [--scenario=basic|business|advanced]',
  )
}
const selected = scenario === 'basic' ? ['static'] : ['static', 'lazy']
// Fixed own outputs only. Never delete Lab dist/, another entry, or a caller path.
await mkdir(reports, { recursive: true })
await assertReportsBoundary()
await rm(path.join(reports, 'summary.json'), { force: true })
await rm(path.join(reports, 'budget-result.json'), { force: true })
const beforeDigest = await computeInputDigest()
const builds = []
for (const variant of selected) {
  const output = path.join(reports, variant)
  await rm(output, { force: true, recursive: true })
  await mkdir(output, { recursive: true })
  const command = buildCommand(variant)
  process.stdout.write(`cwd=${lab}\n${command.program} ${command.args.join(' ')}\n`)
  const run = spawnSync(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', command.args, {
    cwd: lab,
    encoding: 'utf8',
    maxBuffer: 8_000_000,
    timeout: 120_000,
    windowsHide: true,
  })
  const log = `${run.stdout ?? ''}${run.stderr ?? ''}\nexit=${run.status}; signal=${run.signal ?? 'none'}\n`
  await writeFile(path.join(output, 'build.log'), log)
  process.stdout.write(log)
  if (run.error || run.signal || run.status !== 0)
    throw new Error(`${variant} actual Vite build failed: ${run.error ?? run.signal ?? run.status}`)
  builds.push(await readBuild(variant))
}
if (beforeDigest !== (await computeInputDigest()))
  throw new Error('Fixture inputs changed during build')
const summary = {
  schemaVersion: 1,
  entryId: 'F18',
  scenario,
  generatedAt: new Date().toISOString(),
  inputDigest: beforeDigest,
  versions: await installedVersions(),
  builds,
  comparison: compareBuilds(builds),
}
await writeFile(path.join(reports, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
const validation = await readCurrentSummary()
if (validation.status !== 'ready') throw new Error(validation.reason)
for (const build of builds) {
  process.stdout.write(
    `${build.variant}: initial JS ${build.initialBytes} B; gzip(level 9) ${build.initialGzipBytes} B; all JS ${build.totalBytes} B; deferred chunks ${build.deferredFiles.length}\n`,
  )
}
if (summary.comparison)
  process.stdout.write(
    `lazy − static initial gzip: ${summary.comparison.initialGzipBytesDelta} B (positive means larger)\n`,
  )
if (scenario === 'advanced') {
  const result = evaluateBudget(
    builds.find((build) => build.variant === 'lazy'),
    2500,
  )
  await writeFile(path.join(reports, 'budget-result.json'), `${JSON.stringify(result, null, 2)}\n`)
  process.stdout.write(
    `Initial JS gzip budget: ${result.actual} <= ${result.limit} B: ${result.passed ? 'PASS' : 'FAIL'}\n`,
  )
  if (!result.passed) process.exitCode = 1
}
process.stdout.write(`Actual local build summary: ${path.join(reports, 'summary.json')}\n`)
