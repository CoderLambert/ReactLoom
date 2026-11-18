import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, realpath } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = dirname(dirname(fileURLToPath(import.meta.resolve('@react-three/fiber'))))
const bytes = await readFile(join(packageRoot, 'package.json'))
const pkg = JSON.parse(bytes)
assert.equal(pkg.version, '9.8.2')
const sha = (buffer) => createHash('sha256').update(buffer).digest('hex')
const web = await readFile(join(packageRoot, 'dist/react-three-fiber.esm.js'), 'utf8')
const eventName = web.match(/from '\.\/(events-[^']+\.esm\.js)'/)[1]
const patterns = {
  'dist/react-three-fiber.esm.js':
    /function CanvasImpl|useInsertionEffect|catch\(setError\)|children: fallback/,
  [`dist/${eventName}`]:
    /function useFrame\(|function disposeOnIdle|function removeChild\(|function unmountComponentAtNode|function releaseRenderer|function disposeRenderer|function invalidate\(|function createRenderer|forceContextLoss|const shouldDispose/,
}
const sources = []
for (const [path, pattern] of Object.entries(patterns)) {
  const content = await readFile(join(packageRoot, path))
  sources.push({
    path: join(packageRoot, path),
    bytes: content.length,
    sha256: sha(content),
    evidence: content
      .toString()
      .split('\n')
      .flatMap((line, index) =>
        pattern.test(line) ? [{ line: index + 1, text: line.slice(0, 300) }] : [],
      ),
  })
}
const threePath = await realpath(
  new URL('../../../node_modules/three/package.json', import.meta.url),
)
const three = JSON.parse(await readFile(threePath))
assert.equal(three.version, '0.186.0')
console.log(
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      node: process.version,
      fiber: {
        version: pkg.version,
        packageRoot,
        packageSha256: sha(bytes),
        peerDependencies: pkg.peerDependencies,
      },
      three: { version: three.version, packagePath: threePath },
      sources,
    },
    null,
    2,
  ),
)
