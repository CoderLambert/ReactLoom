/** Strict structural completeness rules for indexed library playbooks. */
const REQUIRED_LEVELS = Object.freeze(['basic', 'business', 'advanced'])
export function entryCompletenessIssues(entry, files = {}) {
  const issues = []
  const demos = Array.isArray(entry?.demos) ? entry.demos : []
  if (entry?.contentState === 'missing') {
    if (demos.length) issues.push('missing entry must not declare executable demos')
    return issues
  }
  for (const name of ['guide', 'agent', 'agents', 'verification'])
    if (!files[name]) issues.push(`completed entry has no ${name} file`)
  if (demos.length !== REQUIRED_LEVELS.length)
    issues.push('completed entry must declare exactly three demos')
  for (const level of REQUIRED_LEVELS)
    if (demos.filter((demo) => demo?.level === level).length !== 1)
      issues.push(`completed entry needs exactly one ${level} demo`)
  for (const demo of demos)
    if (typeof demo?.entryPoint !== 'string' || !demo?.sourceFiles?.includes(demo.entryPoint))
      issues.push(`demo ${String(demo?.demoId)} must list its entryPoint in sourceFiles`)
  return issues
}
