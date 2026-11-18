import assert from 'node:assert/strict'
import { realpathSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import { BasicPlatform, Chart } from 'chart.js'
import { createReadingConfig } from '../examples/chart-model.ts'
import { chartCounts } from '../examples/chart-stream-policy.ts'

// Existing locked PDF.js optional dependency supplies a real native 2D Canvas.
// No SDK, canvas methods, drawing result or Chart platform is mocked.
// Missing native dependency is an explicit fixture prerequisite failure, not a fake fallback.
const nativeRequire = createRequire(
  realpathSync(new URL('../../../node_modules/pdfjs-dist/package.json', import.meta.url)),
)
const { createCanvas } = nativeRequire('@napi-rs/canvas')
const artifactRoot = new URL('../.artifacts/', import.meta.url)
async function savePng(name, canvas) {
  const bytes = canvas.toBuffer('image/png')
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10])
  assert.ok(bytes.length > 1000)
  await mkdir(artifactRoot, { recursive: true })
  await writeFile(new URL(name, artifactRoot), bytes)
  return bytes
}

test('real Chart draws native pixels, updates the same instance and exposes actual hit/active elements', async () => {
  const canvas = createCanvas(700, 310)
  const chart = new Chart(
    canvas,
    createReadingConfig('bar', chartCounts(0), { responsive: false, devicePixelRatio: 1 }),
  )
  try {
    assert.ok(chart.platform instanceof BasicPlatform)
    assert.equal(Chart.getChart(canvas), chart)
    assert.deepEqual(chart.data.datasets[0].data, chartCounts(0))
    const before = await savePng('bar-initial.png', canvas)
    const id = chart.id
    chart.data.datasets[0].data = chartCounts(1)
    chart.update('none')
    assert.equal(chart.id, id)
    assert.equal(chart.getDatasetMeta(0).data.length, 7)
    assert.deepEqual(chart.data.datasets[0].data, chartCounts(1))
    const center = chart.getDatasetMeta(0).data[2].getCenterPoint()
    const hit = chart.getElementsAtEventForMode(
      { native: null, x: center.x, y: center.y },
      'nearest',
      { intersect: true },
      true,
    )
    assert.equal(hit[0].index, 2)
    chart.setActiveElements([{ datasetIndex: 0, index: 2 }])
    chart.update('none')
    assert.equal(chart.getActiveElements()[0].index, 2)
    assert.notDeepEqual(await savePng('bar-updated.png', canvas), before)
    console.log(
      'native Canvas PNGs: bar-initial.png/bar-updated.png; real instance',
      id,
      'hit index',
      hit[0].index,
    )
  } finally {
    chart.destroy()
  }
  assert.equal(Chart.getChart(canvas), undefined)
})

test('real destroy releases a native canvas for line reconstruction and explicit resize', async () => {
  const canvas = createCanvas(700, 310)
  const original = new Chart(
    canvas,
    createReadingConfig('bar', chartCounts(2), { responsive: false, devicePixelRatio: 1 }),
  )
  const id = original.id
  original.destroy()
  assert.equal(Chart.getChart(canvas), undefined)
  const chart = new Chart(
    canvas,
    createReadingConfig('line', chartCounts(2), { responsive: false, devicePixelRatio: 1 }),
  )
  try {
    assert.notEqual(chart.id, id)
    assert.equal(chart.getDatasetMeta(0).type, 'line')
    assert.deepEqual(chart.data.datasets[0].data, chartCounts(2))
    chart.resize(820, 350)
    assert.equal(chart.width, 820)
    assert.equal(chart.height, 350)
    await savePng('line-resized.png', canvas)
    console.log(
      'native Canvas PNG: line-resized.png; dimensions',
      chart.width,
      chart.height,
      'old/new ids',
      id,
      chart.id,
    )
  } finally {
    chart.destroy()
  }
  assert.equal(Chart.getChart(canvas), undefined)
})
