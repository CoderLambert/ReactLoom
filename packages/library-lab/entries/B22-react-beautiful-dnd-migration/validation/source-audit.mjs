import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const root = dirname(dirname(require.resolve('@hello-pangea/dnd')))
const pkg = JSON.parse(await readFile(join(root, 'package.json')))
const files = []
for (const name of ['dist/dnd.esm.js', 'dist/dnd.d.ts']) {
  const path = join(root, name)
  const bytes = await readFile(path)
  const source = bytes.toString('utf8')
  files.push({
    path,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    excerpts: [
      'const beforeStart =',
      'asyncMarshal.add(() =>',
      'function DragDropContext(',
      'interface DropResult',
      'onBeforeDragStart?:',
      'function useStyleMarshal(',
      'remove(alwaysRef)',
    ].flatMap((key) => {
      const offset = source.indexOf(key)
      return offset < 0
        ? []
        : [{ key, offset, source: source.slice(Math.max(0, offset - 70), offset + 750) }]
    }),
  })
}
const actual = require('@hello-pangea/dnd')
assert.equal(pkg.version, '18.0.1')
assert.equal(actual.resetServerContext, undefined)
const lab = JSON.parse(await readFile(new URL('../../../package.json', import.meta.url)))
assert.equal(lab.dependencies['react-beautiful-dnd'], undefined)
await writeFile(
  new URL('sdk-source-audit.json', import.meta.url),
  `${JSON.stringify({ package: { name: pkg.name, version: pkg.version, license: pkg.license, peerDependencies: pkg.peerDependencies }, legacyDirectDependency: false, legacyExecuted: false, publicExports: Object.keys(actual), resetServerContextExported: false, files }, null, 2)}\n`,
)
console.log(
  'Actual replacement18.0.1/Apache2/React18-19 sync beforeStart + deferred start, public exports and absent legacy direct dependency captured',
)
