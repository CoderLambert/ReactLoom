import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import test, { after } from 'node:test'

const require = createRequire(import.meta.url)
const reactRuntime = require('@rive-app/react-webgl2')
const runtimeRequire = createRequire(require.resolve('@rive-app/react-webgl2'))
const { RuntimeLoader, Layout, Fit, Alignment } = reactRuntime
const wasm = await readFile(join(dirname(runtimeRequire.resolve('@rive-app/webgl2')), 'rive.wasm'))
// The installed MIT runtime binary only. No .riv file, remote fetch, Canvas or renderer substitute.
RuntimeLoader.setWasmFallbackUrl(null)
RuntimeLoader.setWasmBinary(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength))
const ready = RuntimeLoader.awaitInstance()
after(() => RuntimeLoader.setWasmBinary(null))
const frame = { minX: 0, minY: 0, maxX: 200, maxY: 200 }
const content = { minX: 0, minY: 0, maxX: 100, maxY: 50 }

test('actual Rive WASM contain alignment centers a known artboard without cropping', {
  timeout: 10000,
}, async () => {
  const runtime = await ready
  const layout = new Layout({ fit: Fit.Contain, alignment: Alignment.Center })
  const matrix = runtime.computeAlignment(
    layout.runtimeFit(runtime),
    layout.runtimeAlignment(runtime),
    frame,
    content,
    1,
  )
  let input
  let mapped
  try {
    assert.equal(typeof document, 'undefined')
    assert.equal(typeof reactRuntime.useRive, 'function')
    assert.deepEqual([matrix.xx, matrix.yy, matrix.tx, matrix.ty], [2, 2, 0, 50])
    input = new runtime.Vec2D(50, 25)
    mapped = runtime.mapXY(matrix, input)
    assert.deepEqual([mapped.x(), mapped.y()], [100, 100])
    console.log(
      'Actual WASM:',
      JSON.stringify({
        bytes: wasm.length,
        sha256: createHash('sha256').update(wasm).digest('hex'),
        contain: [matrix.xx, matrix.yy, matrix.tx, matrix.ty],
      }),
    )
  } finally {
    mapped?.delete()
    input?.delete()
    matrix.delete()
  }
})
test('actual Rive WASM cover alignment crops horizontally while Layout.copyWith preserves the original', {
  timeout: 10000,
}, async () => {
  const runtime = await ready
  const contain = new Layout({ fit: Fit.Contain, alignment: Alignment.Center })
  const cover = contain.copyWith({ fit: Fit.Cover })
  const matrix = runtime.computeAlignment(
    cover.runtimeFit(runtime),
    cover.runtimeAlignment(runtime),
    frame,
    content,
    1,
  )
  try {
    assert.equal(contain.fit, Fit.Contain)
    assert.equal(cover.fit, Fit.Cover)
    assert.deepEqual([matrix.xx, matrix.yy, matrix.tx, matrix.ty], [4, 4, -100, 0])
  } finally {
    matrix.delete()
  }
})
