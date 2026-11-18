import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const reactFile = require.resolve('@rive-app/react-webgl2')
const runtimeRequire = createRequire(reactFile)
const runtimeFile = runtimeRequire.resolve('@rive-app/webgl2')
const reactRoot = dirname(dirname(reactFile))
const runtimeRoot = dirname(runtimeFile)
const reactPackage = JSON.parse(await readFile(join(reactRoot, 'package.json')))
const runtimePackage = JSON.parse(await readFile(join(runtimeRoot, 'package.json')))
assert.equal(reactPackage.version, '4.37.0')
assert.equal(reactPackage.dependencies['@rive-app/webgl2'], '2.45.0')
assert.equal(runtimePackage.version, '2.45.0')
assert.equal(runtimePackage.license, 'MIT')
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
const sources = []
for (const [path, markers] of [
  [
    reactFile,
    [
      'function useRive(',
      'new canvas.Rive',
      'onRiveReady',
      'queueMicrotask',
      'safeCleanup("unmount"',
      'safeCleanup("final unmount"',
    ],
  ],
  [
    runtimeFile,
    [
      'RuntimeLoader.wasmURL =',
      'RuntimeLoader.wasmFallbackURL =',
      'RuntimeLoader.setWasmBinary',
      'Rive.prototype.cleanup =',
    ],
  ],
]) {
  const bytes = await readFile(path)
  const text = bytes.toString()
  sources.push({
    path,
    bytes: bytes.length,
    sha256: sha(bytes),
    excerpts: markers.map((marker) => {
      const offset = text.indexOf(marker)
      assert.ok(offset >= 0, marker)
      return { marker, offset, text: text.slice(Math.max(0, offset - 80), offset + 600) }
    }),
  })
}
const wasm = []
for (const name of ['rive.wasm', 'rive_fallback.wasm']) {
  const path = join(runtimeRoot, name)
  const bytes = await readFile(path)
  wasm.push({ path, bytes: bytes.length, sha256: sha(bytes) })
}
console.log(
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      node: process.version,
      react: {
        path: reactRoot,
        version: reactPackage.version,
        peerDependencies: reactPackage.peerDependencies,
      },
      runtime: {
        path: runtimeRoot,
        version: runtimePackage.version,
        license: runtimePackage.license,
      },
      sources,
      wasm,
      boundary:
        'MIT runtime/WASM only; no .riv copied or parsed. Wrapper owns cleanup; shared offscreen context/WASM singleton need not vanish with one component.',
    },
    null,
    2,
  ),
)
