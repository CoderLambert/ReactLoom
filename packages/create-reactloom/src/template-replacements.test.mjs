import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const templatesRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../templates',
)

for (const template of ['spa', 'ssr', 'mobile']) {
  test(`${template} scaffold replacements refer to text present in the copied template`, async () => {
    const directory = path.join(templatesRoot, template)
    const manifest = JSON.parse(await readFile(path.join(directory, 'template.json'), 'utf8'))
    for (const replacement of manifest.replacements ?? []) {
      const contents = await readFile(path.join(directory, replacement.file), 'utf8')
      assert.ok(
        contents.includes(replacement.from),
        `${template}/template.json replacement source is absent from ${replacement.file}: ${JSON.stringify(replacement.from)}`,
      )
    }
  })
}
