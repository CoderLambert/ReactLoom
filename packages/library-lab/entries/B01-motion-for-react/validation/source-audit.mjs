import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const motionRoot = dirname(dirname(dirname(fileURLToPath(import.meta.resolve('motion/react')))))
const require = createRequire(import.meta.resolve('motion/react'))
const framerRoot = dirname(dirname(dirname(require.resolve('framer-motion'))))
const framerRequire = createRequire(require.resolve('framer-motion'))
const domRoot = dirname(dirname(dirname(framerRequire.resolve('motion-dom'))))
const packages = []
for (const [name, root] of [
  ['motion', motionRoot],
  ['framer-motion', framerRoot],
  ['motion-dom', domRoot],
]) {
  const pkg = JSON.parse(await readFile(join(root, 'package.json')))
  assert.equal(pkg.name, name)
  assert.equal(pkg.version, '14.6.0')
  packages.push({ name, version: pkg.version, root, peerDependencies: pkg.peerDependencies })
}
const selection = [
  [
    framerRoot,
    'dist/es/utils/reduced-motion/use-reduced-motion.mjs',
    /useState\(|TODO|return shouldReduceMotion/,
  ],
  [
    framerRoot,
    'dist/es/components/AnimatePresence/use-presence-data.mjs',
    /useContext|context.custom/,
  ],
  [
    framerRoot,
    'dist/es/components/AnimatePresence/PresenceChild.mjs',
    /const PresenceChild|isPresent|custom|register:/,
  ],
  [
    domRoot,
    'dist/es/render/VisualElement.mjs',
    /this.reducedMotionConfig|this.shouldReduceMotion =/,
  ],
  [
    domRoot,
    'dist/es/animation/interfaces/visual-element-target.mjs',
    /shouldReduceMotion|positionalKeys/,
  ],
]
const sources = []
for (const [root, path, pattern] of selection) {
  const bytes = await readFile(join(root, path))
  sources.push({
    path: join(root, path),
    sha256: createHash('sha256').update(bytes).digest('hex'),
    evidence: bytes
      .toString()
      .split('\n')
      .flatMap((text, index) =>
        pattern.test(text) ? [{ line: index + 1, text: text.slice(0, 250) }] : [],
      ),
  })
}
console.log(
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      node: process.version,
      packages,
      sources,
      conclusion:
        'Installed 14.6.0 hook has no state setter/subscription. This demo explicitly owns live media updates and all visual targets; SDK user config normally does disable positional transforms at mount.',
    },
    null,
    2,
  ),
)
