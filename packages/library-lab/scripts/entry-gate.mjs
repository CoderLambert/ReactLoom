/** Strict structural completeness rules for indexed library playbooks. */
const LEVELS = new Set(['basic', 'business', 'advanced'])
export function entryCompletenessIssues(entry, files = {}) {
  const issues = []
  const demos = Array.isArray(entry?.demos) ? entry.demos : []
  if (entry?.contentState === 'missing') {
    if (demos.length) issues.push('missing entry must not declare executable demos')
    return issues
  }
  for (const name of ['guide', 'agent', 'agents', 'verification'])
    if (!files[name]) issues.push(`completed entry has no ${name} file`)
  if (demos.length < 1 || demos.length > 3)
    issues.push('completed entry must declare one to three demos')
  if (!demos.some((demo) => demo?.level === 'basic'))
    issues.push('completed entry needs a basic demo')
  const seen = new Set()
  for (const demo of demos) {
    if (!LEVELS.has(demo?.level)) issues.push('invalid demo level')
    if (seen.has(demo?.level)) issues.push('duplicate demo level')
    seen.add(demo?.level)
  }
  for (const demo of demos)
    if (typeof demo?.entryPoint !== 'string' || !demo?.sourceFiles?.includes(demo.entryPoint))
      issues.push(`demo ${String(demo?.demoId)} must list its entryPoint in sourceFiles`)
  return issues
}
