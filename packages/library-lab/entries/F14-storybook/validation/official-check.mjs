import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const entry = new URL('../', import.meta.url)
const ref = 'a17b725f4069e0bda9dc87e3002063c726de8fbc'
for (const [remote, local] of [
  ['code/core/README.md', 'readme.md'],
  ['LICENSE', 'license.txt'],
  ['code/core/package.json', 'core-package.json'],
  ['code/frameworks/react-vite/package.json', 'react-vite-package.json'],
  ['code/addons/a11y/package.json', 'a11y-package.json'],
]) {
  const response = await fetch(
    `https://raw.githubusercontent.com/storybookjs/storybook/${ref}/${remote}`,
  )
  assert.equal(response.status, 200)
  assert.deepEqual(
    Buffer.from(await response.arrayBuffer()),
    await readFile(new URL(`official/${local}`, entry)),
  )
  console.log('MATCH', remote)
}
const require = createRequire(new URL('../../package.json', entry))
for (const name of ['storybook', '@storybook/react-vite', '@storybook/addon-a11y']) {
  const p = require(`${name}/package.json`)
  assert.equal(p.version, '10.6.1')
  assert.equal(p.license, 'MIT')
  console.log(name, p.version, p.license)
}
