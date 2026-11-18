import { copyFile, cp, mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { generate } from './generate.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const site = path.join(root, 'dist-pages')
await generate(root)
await build({ root, mode: 'pages', publicDir: false, build: { outDir: site } })

// Copy only catalogue outputs. The local public directory can also hold licensed core assets.
for (const name of ['catalog-index.json', 'catalog.json', 'llms.txt', 'raw']) {
  await cp(path.join(root, 'public', name), path.join(site, name), { recursive: true })
}

// Emit physical entry pages so static hosting can serve direct links and keep document anchors.
const catalog = JSON.parse(await readFile(path.join(site, 'catalog-index.json'), 'utf8'))
for (const { slug } of catalog) {
  if (!/^[a-z0-9][a-z0-9-]*$/u.test(slug)) throw new Error('Unsafe Pages route slug')
  const directory = path.join(site, 'libraries', slug)
  await mkdir(directory, { recursive: true })
  await copyFile(path.join(site, 'index.html'), path.join(directory, 'index.html'))
}
