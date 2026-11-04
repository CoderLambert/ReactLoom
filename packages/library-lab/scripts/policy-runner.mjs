/** Offline entry policy tests are not evidence that a third-party SDK was executed. */

import { spawnSync } from 'node:child_process'
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isSdkSuiteName, parseSdkArguments } from './sdk-runner.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const repoRoot = path.resolve(root, '../..')
const entryPath = /^entries\/([A-F]\d{2})-[a-z0-9-]+\/(?:examples|tests)\/[^/]+\.test\.m(?:j|t)s$/u

/** Discover pure JS/TypeScript policy suites without resolving installed npm packages. */
export async function discoverPolicyTests(projectRoot = root) {
  const result = []
  for (const dir of (await readdir(path.join(projectRoot, 'entries'), { withFileTypes: true }))
    .filter((item) => item.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))) {
    if (!/^[A-F]\d{2}-[a-z0-9-]+$/u.test(dir.name)) continue
    for (const sub of ['examples', 'tests']) {
      let files
      try {
        files = await readdir(path.join(projectRoot, 'entries', dir.name, sub), {
          withFileTypes: true,
        })
      } catch (error) {
        if (error.code === 'ENOENT') continue
        throw error
      }
      for (const file of files
        .filter(
          (item) =>
            item.isFile() &&
            (item.name.endsWith('.test.mjs') || item.name.endsWith('.test.mts')) &&
            !isSdkSuiteName(item.name),
        )
        .sort((a, b) => a.name.localeCompare(b.name))) {
        result.push('entries/' + dir.name + '/' + sub + '/' + file.name)
      }
    }
  }
  return result
}
export function selectPolicyTests(files, { entries = null, group = null } = {}) {
  if (entries !== null && group !== null)
    throw new Error('--entries and --group are mutually exclusive')
  if (
    entries !== null &&
    (!Array.isArray(entries) || !entries.length || entries.some((id) => !/^[A-F]\d{2}$/u.test(id)))
  )
    throw new Error('Invalid --entries')
  if (group !== null && !/^[A-F]$/u.test(group)) throw new Error('Invalid --group')
  const approved = files.filter(
    (file) => entryPath.test(file) && !isSdkSuiteName(file.split('/').at(-1)),
  )
  const selected = approved.filter((file) => {
    const [, id] = entryPath.exec(file)
    return (entries === null || entries.includes(id)) && (group === null || id[0] === group)
  })
  if (entries !== null) {
    const found = new Set(selected.map((file) => entryPath.exec(file)[1]))
    const missing = entries.filter((id) => !found.has(id))
    if (missing.length) throw new Error('No policy suite for: ' + missing.join(', '))
  }
  if (!selected.length) throw new Error('No matching policy suites (this is not SDK verification).')
  return selected
}
/** CI: run policy tests for changed entry sources only, never infer SDK PASS. */
export function planChangedPolicyTests(changedPaths, suites) {
  if (!Array.isArray(changedPaths) || !Array.isArray(suites))
    throw Error('Changed paths and suites must be arrays')
  const affected = new Set()
  let runAll = false
  for (const file of changedPaths) {
    if (typeof file !== 'string') throw Error('Invalid changed path')
    if (
      /^(?:package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|\.github\/workflows\/library-lab\.yml)$/u.test(
        file,
      ) ||
      /^packages\/library-lab\/(?:src\/|scripts\/|tests\/|package\.json$|tsconfig\.json$|vite\.config\.|playwright\.config\.)/u.test(
        file,
      )
    )
      runAll = true
    const match =
      /^packages\/library-lab\/entries\/([A-F]\d{2})-[a-z0-9-]+\/(?:library\.json$|examples\/|tests\/)/u.exec(
        file,
      )
    if (match) affected.add(match[1])
  }
  const approved = suites.filter(
    (file) => entryPath.test(file) && !isSdkSuiteName(file.split('/').at(-1)),
  )
  const entries = [...affected].sort()
  const files = runAll ? approved : approved.filter((file) => affected.has(entryPath.exec(file)[1]))
  return { mode: runAll ? 'all' : files.length ? 'affected' : 'skip', entries, files }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const changedArg =
    args.length === 1 && args[0].startsWith('--changed-base=')
      ? args[0].slice('--changed-base='.length)
      : null
  let files,
    list = false
  if (changedArg !== null) {
    const all = await discoverPolicyTests()
    let plan
    if (!/^[a-f0-9]{40}$/u.test(changedArg) || /^0{40}$/u.test(changedArg)) {
      plan = { mode: 'all', files: selectPolicyTests(all), entries: [] }
      console.warn('Missing comparison SHA; falling back to all policy suites (not SDK evidence).')
    } else {
      const changed = spawnSync(
        'git',
        ['diff', '--name-only', '-z', '--no-renames', changedArg, 'HEAD'],
        { cwd: repoRoot, encoding: 'buffer', shell: false, maxBuffer: 4 * 1024 * 1024 },
      )
      if (changed.error || changed.status !== 0) {
        console.warn(
          'Git comparison unavailable; falling back to all policy suites (not SDK evidence).',
        )
        plan = { mode: 'all', files: selectPolicyTests(all), entries: [] }
      } else {
        const paths = Buffer.from(changed.stdout).toString('utf8').split('\0').filter(Boolean)
        plan = planChangedPolicyTests(paths, all)
      }
    }
    files = plan.files
    console.log(
      'Changed-entry policy plan: ' +
        plan.mode +
        '; affected IDs: ' +
        (plan.entries.join(',') || '(none)'),
    )
    if (plan.mode === 'skip')
      console.log('SKIP: no changed entries with policy suites; this is not an SDK or build PASS.')
  } else {
    const selector = parseSdkArguments(args)
    files = selectPolicyTests(await discoverPolicyTests(), selector)
    list = selector.list
  }
  console.log('Pure entry policy suites selected: ' + files.length + ' (not SDK evidence)')
  if (list) console.log(files.join('\n'))
  else if (files.length) {
    const result = spawnSync(process.execPath, ['--experimental-strip-types', '--test', ...files], {
      cwd: root,
      stdio: 'inherit',
    })
    if (result.error) throw result.error
    process.exitCode = result.status ?? 1
  }
}
