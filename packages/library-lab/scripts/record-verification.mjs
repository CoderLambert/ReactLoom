/** Run a fixed verification command and produce a receipt; never edits entry metadata. */
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readinessReport } from './readiness.mjs'
import { verificationCommand } from './verification-contract.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const repo = path.resolve(root, '../..')
const hash = (value) => createHash('sha256').update(value).digest('hex')
export function parseRecordArgs(args) {
  const result = { execute: false, entryId: null, entries: null, kind: null }
  for (const arg of args) {
    if (arg === '--execute' && !result.execute) result.execute = true
    else if (/^--entry=[A-F]\d{2}$/u.test(arg) && !result.entryId && !result.entries)
      result.entryId = arg.slice(8)
    else if (
      /^--entries=[A-F]\d{2}(?:,[A-F]\d{2})*$/u.test(arg) &&
      !result.entryId &&
      !result.entries
    )
      result.entries = arg.slice(10).split(',')
    else if (/^--kind=(sdk|build|browser)$/u.test(arg) && !result.kind)
      result.kind = arg.slice(7)
    else throw new Error('Usage: --entry=D03 --kind=sdk|build|browser [--execute]')
  }
  if (
    result.entries &&
    (result.kind !== 'build' ||
      result.entries.length < 2 ||
      result.entries.length > 6 ||
      new Set(result.entries).size !== result.entries.length)
  )
    throw new Error('Batch verification requires 2–6 unique entry IDs for build only')
  verificationCommand(result.kind, result.entryId ?? result.entries?.[0])
  return result
}
export async function recordVerification(options) {
  const entryIds = options.entries ?? [options.entryId]
  const command = verificationCommand(options.kind, entryIds[0])
  if (!options.execute) return { mode: 'plan', command }
  const [major, minor] = process.versions.node.split('.').map(Number)
  if (major < 22 || (major === 22 && minor < 18))
    throw new Error('Requires Node >=22.18; no verification ran')
  const git = (args) =>
    execFileSync('git', args, {
      cwd: repo,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  const head = git(['rev-parse', 'HEAD'])
  if (
    git([
      'status',
      '--porcelain',
      '--',
      'packages/library-lab',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
      'package.json',
      '.npmrc',
    ])
  )
    throw new Error('Commit or reconcile runtime inputs before recording evidence')
  const lock = await readFile(path.join(repo, 'pnpm-lock.yaml'), 'utf8')
  if (!/^ {2}packages\/library-lab:\s*$/mu.test(lock))
    throw new Error('A real Library Lab lock importer is required')
  const inventory = () =>
    readinessReport(path.join(root, 'entries'), options.entries ? {} : { group: entryIds[0][0] })
  const beforeReport = await inventory()
  const fingerprints = new Map()
  for (const entryId of entryIds) {
    const before = beforeReport.entries.find((entry) => entry.id === entryId)
    if (!before?.fingerprint) throw new Error('Entry ' + entryId + ' is not source-complete')
    fingerprints.set(entryId, before.fingerprint)
  }
  const startedAt = new Date().toISOString()
  const response = spawnSync(
    command[0] === 'node' ? process.execPath : command[0],
    command.slice(1),
    { cwd: root, encoding: 'utf8', shell: false, timeout: 900_000, maxBuffer: 24 * 1024 * 1024 },
  )
  const finishedAt = new Date().toISOString()
  if (response.error || !Number.isSafeInteger(response.status))
    throw response.error ?? new Error('Verification process did not return a usable exit code')
  const afterReport = await inventory()
  for (const entryId of entryIds) {
    if (
      fingerprints.get(entryId) !==
      afterReport.entries.find((entry) => entry.id === entryId)?.fingerprint
    )
      throw new Error('Execution inputs changed during verification: ' + entryId)
  }
  const prefix =
    'docs/library-lab/evidence/runs/' +
    startedAt.replace(/[:.]/gu, '-') +
    '-' +
    (options.entries ? 'batch-build' : entryIds[0] + '-' + options.kind)
  const logPath = prefix + '.log'
  const log = Buffer.from(
    `$ ${command.join(' ')}\n${response.stdout ?? ''}\n${response.stderr ?? ''}`,
  )
  if (log.length > 24 * 1024 * 1024)
    throw new Error('Combined verification log exceeds the evidence limit')
  await mkdir(path.dirname(path.join(repo, logPath)), { recursive: true })
  await writeFile(path.join(repo, logPath), log)
  const results = {}
  for (const entryId of entryIds) {
    const evidence = options.entries ? prefix + '-' + entryId + '.json' : prefix + '.json'
    const fingerprint = fingerprints.get(entryId)
    const receipt = {
      schemaVersion: 1,
      kind: options.kind,
      entryId,
      sourceFingerprint: fingerprint,
      command: command.join(' '),
      status: response.status === 0 ? 'PASS' : 'FAIL',
      exitCode: response.status,
      head,
      node: process.versions.node,
      lockSha256: hash(lock),
      startedAt,
      finishedAt,
      log: { path: logPath, sha256: hash(log), bytes: log.length },
    }
    const bytes = JSON.stringify(receipt, null, 2) + '\n'
    await writeFile(path.join(repo, evidence), bytes)
    results[entryId] = {
      status: receipt.status,
      sourceFingerprint: fingerprint,
      command: receipt.command,
      evidence,
      evidenceSha256: hash(bytes),
    }
  }
  if (response.status !== 0) process.exitCode = response.status
  return options.entries
    ? { entries: results }
    : { entryId: entryIds[0], [options.kind]: results[entryIds[0]] }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(
      JSON.stringify(await recordVerification(parseRecordArgs(process.argv.slice(2))), null, 2),
    )
  } catch (error) {
    console.error(String(error))
    process.exitCode = 1
  }
}
