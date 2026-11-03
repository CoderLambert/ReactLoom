/** Offline, dependency-free entry discovery for coding agents.
 * No generated SPA artefacts, npm install, or browser are required.
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { GROUPS, validateEntry } from '../src/lib/catalog.mjs'

const DEFAULT_ROOT = fileURLToPath(new URL('../entries/', import.meta.url))
const USAGE = `ReactLoom Library Lab — agent-friendly local catalogue
Usage:
  node scripts/find-library.mjs --query '并发' [--group D] [--limit 8] [--json]
  node scripts/find-library.mjs --id D03 [--agent] [--related]
  node scripts/find-library.mjs --group A [--json]

The catalogue is research metadata, not proof that an SDK has passed runtime tests.
`

export function searchEntries(entries, { query = '', group, entryId, limit = 8 } = {}) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/u).filter(Boolean)
  const ranked = []
  for (const e of entries) {
    if (group && e.group !== group) continue
    if (entryId && e.entryId !== entryId.toUpperCase()) continue
    const id = e.entryId.toLocaleLowerCase(),
      name = e.name.toLocaleLowerCase(),
      slug = e.slug.toLocaleLowerCase()
    const summary = e.summary.toLocaleLowerCase()
    const tags = (e.tags ?? []).map((t) => t.toLocaleLowerCase())
    const packages = (e.packages ?? []).map((p) => p.name.toLocaleLowerCase())
    let score = 0,
      matched = true
    for (const term of terms) {
      const weight =
        id === term
          ? 100
          : name === term || slug === term
            ? 50
            : id.includes(term) || name.includes(term) || slug.includes(term)
              ? 15
              : tags.some((t) => t.includes(term))
                ? 10
                : packages.some((p) => p.includes(term))
                  ? 8
                  : summary.includes(term)
                    ? 5
                    : 0
      if (!weight) {
        matched = false
        break
      }
      score += weight
    }
    if (matched) ranked.push({ entry: e, score })
  }
  ranked.sort((a, b) => b.score - a.score || a.entry.entryId.localeCompare(b.entry.entryId))
  return ranked.slice(0, limit).map(({ entry }) => entry)
}

export async function loadEntries(entriesRoot = DEFAULT_ROOT) {
  const directories = (await readdir(entriesRoot, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
  const found = []
  for (const directory of directories) {
    const raw = await readFile(path.join(entriesRoot, directory, 'library.json'), 'utf8')
    const entry = JSON.parse(raw)
    const errors = validateEntry(entry)
    if (errors.length || directory !== `${entry.entryId}-${entry.slug}`)
      throw new Error(`Invalid ${directory}: ${errors.join('; ') || 'ID/path mismatch'}`)
    found.push({ ...entry, directory })
  }
  return found
}

/** Explain alternative/complement/migration links directly to another coding agent. */
export function relatedEntries(entry, entries) {
  const byId = new Map(entries.map((item) => [item.entryId, item]))
  return (entry.related ?? []).flatMap((relation) => {
    const target = byId.get(relation.entryId)
    return target
      ? [
          {
            id: target.entryId,
            name: target.name,
            summary: target.summary,
            relation: relation.relation,
            reason: relation.reason,
            paths: agentPaths(target),
          },
        ]
      : []
  })
}

export function parseArgs(argv) {
  const opts = {
    query: '',
    group: undefined,
    entryId: undefined,
    limit: 8,
    json: false,
    agent: false,
    related: false,
    help: false,
  }
  const named = new Set(['--query', '--group', '--id', '--limit'])
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i]
    if (flag === '--json') {
      opts.json = true
      continue
    }
    if (flag === '--agent') {
      opts.agent = true
      continue
    }
    if (flag === '--related') {
      opts.related = true
      continue
    }
    if (flag === '--help' || flag === '-h') {
      opts.help = true
      continue
    }
    if (!named.has(flag) || i === argv.length - 1 || argv[i + 1].startsWith('--'))
      throw new Error(`Invalid argument: ${flag}`)
    const value = argv[++i]
    if (flag === '--query') opts.query = value
    if (flag === '--group') opts.group = value.toUpperCase()
    if (flag === '--id') opts.entryId = value.toUpperCase()
    if (flag === '--limit') opts.limit = Number(value)
  }
  if (opts.group && !(opts.group in GROUPS)) throw new Error('Group must be A–F')
  if (opts.entryId && !/^[A-F]\d{2}$/u.test(opts.entryId))
    throw new Error('Entry ID must look like A01')
  if (!Number.isInteger(opts.limit) || opts.limit < 1 || opts.limit > 30)
    throw new Error('Limit must be 1–30')
  if (opts.agent && !opts.entryId) throw new Error('--agent requires --id')
  if (opts.related && !opts.entryId) throw new Error('--related requires --id')
  return opts
}

export function agentPaths(entry) {
  const directory = `packages/library-lab/entries/${entry.directory}`
  return {
    directory,
    metadata: `${directory}/library.json`,
    agent: `${directory}/agent.md`,
    guide: `${directory}/guide.md`,
    verification: `${directory}/verification.json`,
    examples: `${directory}/examples/`,
  }
}

export async function runCli(argv, { entriesRoot = DEFAULT_ROOT, write = console.log } = {}) {
  const opts = parseArgs(argv)
  if (opts.help) {
    write(USAGE)
    return 0
  }
  if (!opts.query && !opts.group && !opts.entryId) {
    write(USAGE)
    return 0
  }
  const entries = await loadEntries(entriesRoot)
  const selected = searchEntries(entries, opts)
  const output = selected.map((entry) => ({
    id: entry.entryId,
    name: entry.name,
    summary: entry.summary,
    group: entry.group,
    contentState: entry.contentState,
    packages: entry.packages,
    paths: agentPaths(entry),
    ...(opts.related ? { related: relatedEntries(entry, entries) } : {}),
  }))
  if (opts.json) {
    write(JSON.stringify({ count: selected.length, results: output }, null, 2))
    return selected.length ? 0 : 2
  }
  if (!selected.length) {
    write('未找到对应条目。请调整关键词、分组或编号。')
    return 2
  }
  for (const item of output) {
    write(
      `${item.id}  ${item.name} · ${GROUPS[item.group]}\n  ${item.summary}\n  Agent: ${item.paths.agent}\n  Demo: ${item.paths.examples}\n  Evidence: ${item.paths.verification}\n  内容状态: ${item.contentState}（不代表 SDK 已验收）`,
    )
  }
  if (opts.related) {
    for (const item of output) {
      write(
        item.related?.length
          ? '关联库：\n' +
              item.related
                .map(
                  (r) =>
                    '  ' +
                    r.relation +
                    ' → ' +
                    r.id +
                    ' ' +
                    r.name +
                    ': ' +
                    r.reason +
                    '\n  Agent: ' +
                    r.paths.agent,
                )
                .join('\n')
          : '暂无已确认的关联库。',
      )
    }
  }
  if (opts.agent) {
    const target = path.join(entriesRoot, selected[0].directory, 'agent.md')
    try {
      write(`\n===== ${output[0].paths.agent} =====\n${await readFile(target, 'utf8')}`)
    } catch (error) {
      if (error.code === 'ENOENT') write('当前条目尚未接入 agent.md。')
      else throw error
    }
  }
  return 0
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = await runCli(process.argv.slice(2))
  } catch (error) {
    console.error(String(error))
    process.exitCode = 1
  }
}
