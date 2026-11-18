import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateBudget, staticClosure, summarizeChunks } from './report-policy.mjs'

test('entry budget follows transitive static imports and excludes dynamic-only chunks', () => {
  const chunks = [
    {
      file: 'entry.js',
      isEntry: true,
      imports: ['shared.js'],
      dynamicImports: ['tool.js'],
      bytes: 100,
      gzipBytes: 70,
    },
    { file: 'shared.js', isEntry: false, imports: ['nested.js'], bytes: 80, gzipBytes: 60 },
    { file: 'nested.js', isEntry: false, imports: ['shared.js'], bytes: 60, gzipBytes: 50 },
    { file: 'tool.js', isEntry: false, imports: [], bytes: 400, gzipBytes: 200 },
  ]
  assert.deepEqual(staticClosure(chunks), ['entry.js', 'nested.js', 'shared.js'])
  const measured = summarizeChunks(chunks)
  assert.equal(measured.initialGzipBytes, 180)
  assert.equal(measured.totalGzipBytes, 380)
  assert.deepEqual(measured.deferredFiles, ['tool.js'])
  assert.equal(evaluateBudget({ variant: 'lazy', ...measured }, 180).passed, true)
  assert.equal(evaluateBudget({ variant: 'lazy', ...measured }, 179).passed, false)
})

test('broken graph and invalid budgets fail instead of silently undercounting', () => {
  assert.throws(() => staticClosure([{ file: 'entry.js', isEntry: true, imports: ['missing.js'] }]))
  assert.throws(() => evaluateBudget({ initialGzipBytes: 10 }, 0))
  assert.throws(() => evaluateBudget({ initialGzipBytes: 10 }, NaN))
})
