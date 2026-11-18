import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test, { after } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { pdf } from '@react-pdf/renderer'
import React from 'react'

const root = path.resolve(fileURLToPath(new URL('../../../../../', import.meta.url)))
const entry = path.resolve(fileURLToPath(new URL('../', import.meta.url)))
const temp = mkdtempSync(path.join(tmpdir(), 'f08-sdk-'))
after(() => rmSync(temp, { recursive: true, force: true }))
symlinkSync(
  path.join(root, 'packages/library-lab/node_modules'),
  path.join(temp, 'node_modules'),
  'dir',
)
for (const file of ['report.tsx', 'report-policy.mjs', 'report-policy.d.mts'])
  copyFileSync(path.join(entry, 'examples', file), path.join(temp, file))
writeFileSync(path.join(temp, 'package.json'), JSON.stringify({ type: 'module' }))
writeFileSync(
  path.join(temp, 'tsconfig.json'),
  JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      jsx: 'react-jsx',
      strict: true,
      skipLibCheck: true,
      outDir: 'out',
      types: ['react'],
      lib: ['ES2022', 'DOM'],
    },
    include: ['report.tsx'],
  }),
)
execFileSync('pnpm', ['exec', 'tsc', '-p', path.join(temp, 'tsconfig.json')], {
  cwd: root,
  stdio: 'pipe',
})
copyFileSync(path.join(temp, 'report-policy.mjs'), path.join(temp, 'out/report-policy.mjs'))
const { ReportDocument, validatedRows } = await import(
  pathToFileURL(path.join(temp, 'out/report.js')).href
)
for (const count of [1, 100]) {
  test(`actual Node renderer pdf.toBlob on shared ReportDocument ${count} ASCII rows`, async () => {
    const rows = validatedRows(
      Array.from({ length: count }, (_, i) => ({
        id: `node-${i}`,
        name: `Original ASCII Feed ${i}`,
        articles: i,
      })),
    )
    const blob = await pdf(
      React.createElement(ReportDocument, { title: 'Original Node SDK Report', rows }),
    ).toBlob()
    assert.equal(blob.type, 'application/pdf')
    assert.ok(blob.size > 100)
    assert.equal(await blob.slice(0, 5).text(), '%PDF-')
    console.log(
      JSON.stringify({
        layer: 'NODE_RENDERER_NOT_BROWSER',
        count,
        size: blob.size,
        type: blob.type,
        signature: '%PDF-',
      }),
    )
  })
}
