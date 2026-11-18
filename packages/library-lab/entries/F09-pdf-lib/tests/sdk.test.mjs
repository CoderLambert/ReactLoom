import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test, { after } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { PDFDocument } from 'pdf-lib'

const root = path.resolve(fileURLToPath(new URL('../../../../../', import.meta.url)))
const entry = path.resolve(fileURLToPath(new URL('../', import.meta.url)))
const temp = mkdtempSync(path.join(tmpdir(), 'f09-sdk-'))
after(() => rmSync(temp, { recursive: true, force: true }))
symlinkSync(
  path.join(root, 'packages/library-lab/node_modules'),
  path.join(temp, 'node_modules'),
  'dir',
)
for (const file of ['document.ts', 'document-policy.mjs', 'document-policy.d.mts'])
  copyFileSync(path.join(entry, 'examples', file), path.join(temp, file))
writeFileSync(path.join(temp, 'package.json'), JSON.stringify({ type: 'module' }))
writeFileSync(
  path.join(temp, 'tsconfig.json'),
  JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      strict: true,
      skipLibCheck: true,
      outDir: 'out',
    },
    include: ['document.ts'],
  }),
)
execFileSync('pnpm', ['exec', 'tsc', '-p', path.join(temp, 'tsconfig.json')], {
  cwd: root,
  stdio: 'pipe',
})
copyFileSync(path.join(temp, 'document-policy.mjs'), path.join(temp, 'out/document-policy.mjs'))
const { createNote, combineNotes, stampOwnPdf } = await import(
  pathToFileURL(path.join(temp, 'out/document.js')).href
)
test('actual shared new and merge save/load preserve page count and bounds', async () => {
  const one = await createNote('Original SDK fixture'),
    two = await combineNotes()
  assert.equal((await PDFDocument.load(one)).getPageCount(), 1)
  assert.equal((await PDFDocument.load(two)).getPageCount(), 2)
  assert.equal(new TextDecoder().decode(one.slice(0, 5)), '%PDF-')
  console.log(
    JSON.stringify({
      layer: 'NODE_PDF_LIB',
      singleBytes: one.length,
      mergeBytes: two.length,
      pages: [1, 2],
    }),
  )
})
test('actual local annotation preserves count including tiny and offset crop pages', async () => {
  for (const width of [36, 595]) {
    const book = await PDFDocument.create(),
      page = book.addPage([width, 100])
    page.setCropBox(0, 0, width, 90)
    const original = await book.save(),
      stamped = await stampOwnPdf(original),
      read = await PDFDocument.load(stamped)
    assert.equal(read.getPageCount(), 1)
    assert.equal(read.getPage(0).getCropBox().width, width)
    assert.ok(stamped.length > original.length)
  }
  const offset = await PDFDocument.create()
  offset.addPage([595, 842]).setCropBox(100, 200, 200, 300)
  assert.equal((await PDFDocument.load(await stampOwnPdf(await offset.save()))).getPageCount(), 1)
})
test('real parser plus policy reject corrupt, oversized geometry, no pages and nonASCII labels', async () => {
  await assert.rejects(stampOwnPdf(new TextEncoder().encode('%PDF-invalid bytes')), Error)
  for (const pages of [[], [[3000, 842]]]) {
    const book = await PDFDocument.create()
    for (const box of pages) book.addPage(box)
    // Save without silently adding a default page.
    await assert.rejects(
      stampOwnPdf(await book.save({ addDefaultPage: false })),
      /page count|dimensions/,
    )
  }
  await assert.rejects(createNote('中文'), /ASCII/)
})
