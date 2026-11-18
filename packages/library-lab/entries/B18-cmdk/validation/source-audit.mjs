import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const cmdk = require.resolve('cmdk')
const localRequire = createRequire(cmdk)
const dialog = localRequire.resolve('@radix-ui/react-dialog')
const scope = createRequire(dialog).resolve('@radix-ui/react-focus-scope')
const records = []
for (const [entry, names, keywords] of [
  [
    cmdk,
    ['dist/index.mjs', 'dist/index.d.ts'],
    ['isComposing', 'contentClassName', 'Primitive selectors', 'CommandFilter', 'useCmdk'],
  ],
  [dialog, ['dist/index.mjs'], ['onCloseAutoFocus:', 'context.triggerRef.current?.focus()']],
  [scope, ['dist/index.mjs'], ['setTimeout(() =>', 'previouslyFocusedElement ?? document.body']],
]) {
  const root = dirname(dirname(entry))
  const pkg = JSON.parse(await readFile(join(root, 'package.json')))
  const files = []
  for (const name of names) {
    const path = join(root, name)
    const bytes = await readFile(path)
    const text = bytes.toString('utf8')
    files.push({
      path,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      excerpts: keywords.flatMap((key) => {
        const offset = text.indexOf(key)
        return offset < 0
          ? []
          : [{ key, offset, source: text.slice(Math.max(0, offset - 100), offset + 650) }]
      }),
    })
  }
  records.push({
    package: { name: pkg.name, version: pkg.version, peerDependencies: pkg.peerDependencies },
    files,
  })
}
await writeFile(
  new URL('sdk-source-audit.json', import.meta.url),
  `${JSON.stringify({ records }, null, 2)}\n`,
)
console.log(
  'Actual installed cmdk / Dialog / FocusScope versions and ESM/type hashes + keyboard/portal/close-focus source captured',
)
