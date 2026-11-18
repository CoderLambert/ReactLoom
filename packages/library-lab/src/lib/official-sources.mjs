const HASH = /^[a-f0-9]{64}$/u
const COMMIT = /^[a-f0-9]{40}$/u
const REPOSITORY = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u
const validDate = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value))
function httpsLink(value) {
  if (typeof value !== 'string' || /[\s\\<>"']/u.test(value)) return ''
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''
  } catch {
    return ''
  }
}
function upstreamReadmeUrl(readme) {
  const file = readme.path.split('/').map(encodeURIComponent).join('/')
  // SheetJS publishes current CE releases on its own forge. Keep this an exact
  // repository/ref/path match rather than accepting arbitrary forge origins.
  const sheetjs = `https://git.sheetjs.com/${readme.repository}/src/commit/${readme.commit}/${file}`
  if (
    ['SheetJS/sheetjs', 'sheetjs/sheetjs'].includes(readme.repository) &&
    readme.sourceUrl === sheetjs
  )
    return sheetjs
  return `https://github.com/${readme.repository}/blob/${readme.commit}/${file}`
}
export function validateOfficialSources(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return ['invalid official sources']
  const errors = []
  const { readme, homepage } = value
  if (
    !readme ||
    !REPOSITORY.test(readme.repository ?? '') ||
    !COMMIT.test(readme.commit ?? '') ||
    typeof readme.path !== 'string' ||
    !/^(?:@?[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.md$/u.test(readme.path) ||
    readme.path.split('/').some((p) => p === '..' || p === '.') ||
    readme.snapshotPath !== 'official/readme.md' ||
    !HASH.test(readme.sha256 ?? '') ||
    !['en', 'zh', 'zh-CN', 'zh-TW'].includes(readme.language) ||
    typeof readme.version !== 'string' ||
    !readme.version.trim() ||
    !validDate(readme.syncedAt)
  )
    errors.push('invalid official README metadata')
  else if (readme.sourceUrl !== upstreamReadmeUrl(readme))
    errors.push('official README source does not match repository/ref/path')
  if (
    !homepage ||
    !httpsLink(homepage.url) ||
    !['website', 'repository'].includes(homepage.kind) ||
    !['allowed', 'blocked', 'unknown'].includes(homepage.status) ||
    !validDate(homepage.checkedAt) ||
    typeof homepage.reason !== 'string' ||
    !homepage.reason.trim()
  )
    errors.push('invalid official homepage metadata')
  return errors
}
export function resolveOfficialReadmeUrl(value, readme, headingIds) {
  if (
    typeof value !== 'string' ||
    !value ||
    value.includes('\\') ||
    Array.from(value).some(
      (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
    ) ||
    value.startsWith('//')
  )
    return ''
  if (value.startsWith('#')) {
    if (!/^#[\p{L}\p{N}_.:-]+$/u.test(value)) return ''
    const id = value.slice(1).toLocaleLowerCase()
    if (!headingIds || headingIds.includes(id)) return `#${id}`
    return httpsLink(`${upstreamReadmeUrl(readme)}${value}`)
  }
  try {
    return httpsLink(new URL(value, upstreamReadmeUrl(readme)).href)
  } catch {
    return ''
  }
}
