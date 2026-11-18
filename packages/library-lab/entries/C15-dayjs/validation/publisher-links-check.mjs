// Actual publisher contract only; no Day.js, browser, HTTP, or shared-file mutation.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolveDocumentUrl } from '../../../src/lib/document-utils.mjs'

const guide = readFileSync(new URL('../guide.md', import.meta.url), 'utf8')
const resolve = (value) => resolveDocumentUrl(value, 'C15', '/', 'official/readme.md')
const links = [...guide.matchAll(/\]\(([^)]+)\)/gu)].map((match) => match[1])
for (const link of links) assert.ok(resolve(link), `Unpublished guide link: ${link}`)
assert.equal(resolve('official/readme.md'), '/raw/C15/readme.md')
for (const privatePath of [
  'official/package-readme.md',
  'official/source-evidence.json',
  'local-validation.md',
]) {
  assert.equal(resolve(privatePath), '')
  assert.ok(!links.includes(privatePath))
}
assert.ok(
  links.includes(
    'https://github.com/iamkun/dayjs/blob/4549b8d03307891143e8a50d39fcdab1f16f77cf/README.md',
  ),
)
console.log(
  JSON.stringify(
    {
      guideLinks: links.length,
      publisherResolved: links.length,
      privatePathsStillDenied: 3,
      fixedEnglishOriginal: true,
      sdkOrBrowserOrHttp: 'NOT_RUN',
    },
    null,
    2,
  ),
)
