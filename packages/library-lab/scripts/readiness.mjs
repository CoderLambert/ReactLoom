/** Source-aware status inventory. No SDK or browser packages are imported. */

import { createHash } from 'node:crypto'
import { lstat, readFile, realpath } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { GROUPS, safeRelativePath } from '../src/lib/catalog.mjs'
import { entryCompletenessIssues } from './entry-gate.mjs'
import { loadEntries } from './find-library.mjs'
import {
  sourceFingerprint,
  VERIFICATION_KINDS,
  verifiedStateFromFiles,
} from './verification-contract.mjs'

import { entryInputsFingerprint, sharedInputsFingerprint } from './verification-inputs.mjs'

const ROOT = fileURLToPath(new URL('../entries/', import.meta.url))
async function readSafe(folder, relative) {
  if (!safeRelativePath(relative)) throw new Error('Unsafe path: ' + relative)
  const resolved = await realpath(path.join(folder, relative))
  const base = await realpath(folder)
  if (!resolved.startsWith(base + path.sep)) throw new Error('Source escaped entry: ' + relative)
  const metadata = await lstat(path.join(folder, relative))
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size > 2_000_000)
    throw new Error('Invalid source file: ' + relative)
  return readFile(resolved)
}
async function existsSafe(folder, relative) {
  try {
    await readSafe(folder, relative)
    return true
  } catch (error) {
    if (error?.code === 'ENOENT') return false
    throw error
  }
}
export async function readinessReport(entriesRoot = ROOT, { group } = {}) {
  if (group && !(group in GROUPS)) throw new Error('Group must be A–F')
  const packageRoot = path.dirname(path.resolve(entriesRoot))
  const sharedInputs = await sharedInputsFingerprint(packageRoot)
  const manifests = (await loadEntries(entriesRoot)).filter((e) => !group || e.group === group)
  const verification = Object.fromEntries(
    VERIFICATION_KINDS.map((k) => [k, { PASS: 0, FAIL: 0, BLOCKED: 0, NOT_RUN: 0 }]),
  )
  const counts = {
    total: manifests.length,
    sourceComplete: 0,
    sourceIncomplete: 0,
    missing: 0,
    scenarioDeclarations: 0,
    react: 0,
    worker: 0,
    nodeCi: 0,
    browserFrame: 0,
  }
  const entries = []
  for (const entry of manifests) {
    counts.scenarioDeclarations += entry.demos.length
    const folder = path.join(entriesRoot, entry.directory)
    if (entry.contentState === 'missing') {
      const problems = entryCompletenessIssues(entry)
      if (problems.length) {
        counts.sourceIncomplete++
        entries.push({ id: entry.entryId, name: entry.name, state: 'incomplete', issues: problems })
      } else {
        counts.missing++
        entries.push({ id: entry.entryId, name: entry.name, state: 'missing', demos: 0 })
      }
      continue
    }
    const files = {
      guide: await existsSafe(folder, 'guide.md'),
      agent: await existsSafe(folder, 'agent.md'),
      agents: await existsSafe(folder, 'AGENTS.md'),
      verification: await existsSafe(folder, 'verification.json'),
    }
    const issues = entryCompletenessIssues(entry, files)
    const summaries = []
    for (const filename of [...new Set(entry.demos.flatMap((d) => d.sourceFiles))].sort()) {
      try {
        const content = await readSafe(folder, filename)
        summaries.push({
          path: filename,
          sha256: createHash('sha256').update(content).digest('hex'),
        })
      } catch (error) {
        issues.push('source ' + filename + ': ' + String(error))
      }
    }
    if (issues.length) {
      counts.sourceIncomplete++
      entries.push({ id: entry.entryId, name: entry.name, state: 'incomplete', issues })
      continue
    }
    counts.sourceComplete++
    const kinds = new Set(entry.demos.map((d) => d.executionKind))
    if (kinds.has('react')) counts.react++
    if (kinds.has('worker')) counts.worker++
    if (kinds.has('node-ci')) counts.nodeCi++
    if (kinds.has('browser-frame')) counts.browserFrame++
    const fingerprint = sourceFingerprint(
      entry.packages,
      summaries,
      await entryInputsFingerprint(folder, sharedInputs),
    )
    const state = await verifiedStateFromFiles(
      JSON.parse(await readSafe(folder, 'verification.json')),
      fingerprint,
      { repoRoot: path.resolve(packageRoot, '../..'), entryId: entry.entryId },
    )
    for (const key of VERIFICATION_KINDS) verification[key][state[key].status]++
    entries.push({
      id: entry.entryId,
      name: entry.name,
      state: 'source-complete',
      fingerprint,
      verification: state,
    })
  }
  return { counts, verification, entries }
}
export function formatReadiness(report) {
  const { counts, verification } = report
  return [
    'Library Lab — ' +
      counts.total +
      ' indexed | ' +
      counts.sourceComplete +
      ' content+source | ' +
      counts.sourceIncomplete +
      ' invalid | ' +
      counts.missing +
      ' pending',
    'Declared scenarios: ' + counts.scenarioDeclarations + ' (not execution evidence)',
    'Runtime types (by library): React ' +
      counts.react +
      ' / Worker ' +
      counts.worker +
      ' / Node-CI ' +
      counts.nodeCi +
      ' / Frame ' +
      counts.browserFrame,
    ...VERIFICATION_KINDS.map(
      (k) =>
        k +
        ': PASS ' +
        verification[k].PASS +
        ' / FAIL ' +
        verification[k].FAIL +
        ' / BLOCKED ' +
        verification[k].BLOCKED +
        ' / NOT_RUN ' +
        verification[k].NOT_RUN,
    ),
    ...(counts.sourceIncomplete
      ? [
          'Incomplete: ' +
            report.entries
              .filter((e) => e.state === 'incomplete')
              .map((e) => e.id)
              .join(', '),
        ]
      : []),
  ].join('\n')
}
export function parseReadinessArgs(args) {
  let json = false,
    group
  for (const arg of args) {
    if (arg === '--json') {
      json = true
      continue
    }
    if (/^--group=[A-F]$/u.test(arg) && !group) {
      group = arg.slice(-1)
      continue
    }
    throw new Error('Usage: node scripts/readiness.mjs [--group=A] [--json]')
  }
  return { json, group }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { json, group } = parseReadinessArgs(process.argv.slice(2))
    const report = await readinessReport(ROOT, { group })
    console.log(json ? JSON.stringify(report, null, 2) : formatReadiness(report))
    if (report.counts.sourceIncomplete) process.exitCode = 1
  } catch (error) {
    console.error(String(error))
    process.exitCode = 1
  }
}
