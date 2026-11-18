// Validate actual Knip v6 JSON reporter data. This pure parser does not run Knip.
export function checkKnipReport(level, status, stdout) {
  if (!['basic', 'business', 'advanced'].includes(level)) throw Error('Unknown scenario')
  if (status !== 0 && status !== 1) throw Error(`Knip CLI/config error (exit ${status})`)
  if (typeof stdout !== 'string' || Buffer.byteLength(stdout) > 2_000_000)
    throw Error('Missing or oversized report')
  let report
  try {
    report = JSON.parse(stdout)
  } catch {
    throw Error('Invalid Knip JSON output')
  }
  if (!report || !Array.isArray(report.issues)) throw Error('Missing issues array')
  let count = 0,
    orphan = false
  for (const issue of report.issues) {
    if (typeof issue?.file !== 'string') throw Error('Issue missing file')
    for (const [type, items] of Object.entries(issue)) {
      if (type === 'file' || type === 'owners') continue
      if (!Array.isArray(items)) throw Error('Invalid issue category')
      for (const item of items) {
        if (typeof item?.name !== 'string') throw Error('Invalid issue item')
        count++
        if (type === 'files' && item.name.replaceAll('\\', '/').endsWith('src/unused.ts'))
          orphan = true
      }
    }
  }
  if (count > 0 !== (status === 1)) throw Error('Exit code and findings disagree')
  if (level === 'basic' && !orphan) throw Error('Expected unused fixture not reported')
  if (level === 'business' && orphan) throw Error('ignoreIssues did not suppress unused fixture')
  return { count, orphan }
}

// Entry-specific expectations, not Knip guarantees for arbitrary projects.
export function checkFixtureFindings(level, stdout) {
  const { issues } = JSON.parse(stdout)
  const names = (category) =>
    issues.flatMap((issue) => (issue[category] ?? []).map((item) => item.name))
  if (!names('dependencies').includes('clsx')) throw Error('Expected unused clsx dependency')
  if (!names('exports').includes('unreachableHelper')) throw Error('Expected unused helper export')
  const files = names('files').map((name) => name.replaceAll('\\', '/'))
  if (level === 'business' && !files.includes('tests/tasks.test.ts'))
    throw Error('Expected unregistered test file')
  if (level === 'advanced') {
    if (files.some((name) => name.startsWith('tests/') || name.startsWith('scripts/')))
      throw Error('Development-only files entered production report')
    for (const name of ['report', 'unusedPublic']) {
      if (!names('exports').includes(name)) throw Error(`Expected production entry export: ${name}`)
    }
  }
}
