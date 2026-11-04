/** Dependency-free consistency contract for the tracked Agent catalogue. */

import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { GROUPS } from '../src/lib/catalog.mjs'
import { loadEntries } from './find-library.mjs'

export function rootCatalogData(entries) {
  return entries.map(({ entryId, name, group, summary, directory, contentState }) => ({
    entryId,
    name,
    group,
    summary,
    path: 'packages/library-lab/entries/' + directory,
    contentState,
  }))
}
export function rootCatalogMarkdown(entries) {
  return (
    '# ReactLoom Library Lab\n\n119 条工程知识条目；收录不代表运行验证通过。先读 agent.md，再读真实源码及验证状态。\n\n' +
    '|编号|工具库|用途|组别|目录|\n|---|---|---|---|---|\n' +
    entries
      .map(
        (e) =>
          '|' +
          e.entryId +
          '|' +
          e.name +
          '|' +
          e.summary.replaceAll('|', '/') +
          '|' +
          GROUPS[e.group] +
          '|[条目](packages/library-lab/entries/' +
          e.directory +
          '/)|',
      )
      .join('\n') +
    '\n'
  )
}
export function diffRootCatalog(entries, actualJson, actualMarkdown) {
  const differences = []
  const expected = rootCatalogData(entries)
  if (!Array.isArray(actualJson)) return ['library-catalog.json must contain an array']
  const byId = new Map(actualJson.map((e) => [e?.entryId, e]))
  if (byId.size !== actualJson.length) differences.push('duplicate entries in library-catalog.json')
  for (const entry of expected) {
    const found = byId.get(entry.entryId)
    if (!found) {
      differences.push('missing ' + entry.entryId)
      continue
    }
    for (const key of Object.keys(entry))
      if (found[key] !== entry[key]) {
        differences.push(entry.entryId + ' ' + key + ' is out of date')
        break
      }
  }
  if (actualJson.length !== expected.length)
    differences.push(
      'expected ' + expected.length + ' catalogue entries; found ' + actualJson.length,
    )
  if (actualMarkdown !== rootCatalogMarkdown(entries))
    differences.push('LIBRARY_CATALOG.md differs from the canonical entry manifests')
  return differences
}
export async function runRootCatalogAudit(
  repoRoot = fileURLToPath(new URL('../../..', import.meta.url)),
  { committed = false } = {},
) {
  const [entries, json, markdown] = await Promise.all([
    loadEntries(path.join(repoRoot, 'packages/library-lab/entries')),
    readFile(path.join(repoRoot, 'library-catalog.json'), 'utf8'),
    readFile(path.join(repoRoot, 'LIBRARY_CATALOG.md'), 'utf8'),
  ])
  const differences = diffRootCatalog(entries, JSON.parse(json), markdown)
  if (committed) {
    // The generator can rewrite the working tree. Compare the submitted bytes
    // from HEAD as well, so a self-repaired index cannot turn a bad commit green.
    const git = (args) =>
      execFileSync('git', args, {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    const committedJson = git(['show', 'HEAD:library-catalog.json'])
    const committedMarkdown = git(['show', 'HEAD:LIBRARY_CATALOG.md'])
    differences.push(
      ...diffRootCatalog(entries, JSON.parse(committedJson), committedMarkdown).map(
        (message) => 'HEAD: ' + message,
      ),
    )
    if (git(['diff', 'HEAD', '--', 'LIBRARY_CATALOG.md', 'library-catalog.json']).trim())
      differences.push(
        'Tracked Agent indexes differ from HEAD; regenerate and commit them explicitly.',
      )
  }
  return { entries: entries.length, differences }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  if (args.some((arg) => arg !== '--committed'))
    throw new Error('Usage: node scripts/root-catalog.mjs [--committed]')
  const result = await runRootCatalogAudit(undefined, { committed: args.includes('--committed') })
  if (result.differences.length) {
    for (const message of result.differences) console.error(message)
    console.error(
      'Refresh tracked indexes with: pnpm --filter @reactloom/library-lab catalog:generate',
    )
    process.exitCode = 1
  } else
    console.log(
      'Agent index matches ' + result.entries + ' entry manifests (SDK runtime NOT verified).',
    )
}
