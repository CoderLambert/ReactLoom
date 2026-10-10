const scopes = ['spa', 'ssr', 'mobile', 'api-client', 'cli', 'docs', 'ci']

const vagueSubjects = new Set([
  'update files',
  'fix stuff',
  'wip',
  'changes',
  'misc',
  'updates',
  'update',
  'fixes',
  'fix',
  'stuff',
  'tmp',
  'temp',
  'minor changes',
  'various fixes',
  'various changes',
  'cleanup',
  'tweaks',
])

function scopeKnown(parsed) {
  const scope = parsed.scope ?? ''
  const ok = scopes.some(
    (base) => scope === base || scope.startsWith(`${base}-`) || scope.startsWith(`${base}/`),
  )
  return [
    ok,
    `scope must be ${scopes.join(', ')}, or that name plus a feature suffix (spa-auth, api-client/retry)`,
  ]
}

function subjectNotVague(parsed) {
  const subject = (parsed.subject ?? '').trim().toLowerCase()
  return [!vagueSubjects.has(subject), `subject "${parsed.subject ?? ''}" is too vague`]
}

function featFixBody(parsed) {
  if (parsed.type !== 'feat' && parsed.type !== 'fix') return [true]
  const body = [parsed.body, parsed.footer].filter(Boolean).join('\n').trim()
  if (body.length < 40) {
    return [
      false,
      'feat and fix need a body of at least 40 characters explaining what changed and why',
    ]
  }
  if (!/\bwhy\b|为什么/i.test(body)) {
    return [false, 'feat and fix body must say why (include "Why" or "为什么")']
  }
  if (!/impact|影响/i.test(body)) {
    return [false, 'feat and fix body must state the impact scope (include "Impact" or "影响")']
  }
  return [true]
}

const plugin = {
  rules: {
    'scope-known': scopeKnown,
    'subject-not-vague': subjectNotVague,
    'feat-fix-body': featFixBody,
  },
}

export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [plugin],
  rules: {
    'scope-enum': [0],
    'footer-leading-blank': [0],
    'scope-empty': [2, 'never'],
    'scope-known': [2, 'always'],
    'subject-min-length': [2, 'always', 12],
    'subject-not-vague': [2, 'always'],
    'feat-fix-body': [2, 'always'],
  },
}
