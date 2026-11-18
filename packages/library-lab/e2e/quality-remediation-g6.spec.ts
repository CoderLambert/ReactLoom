// Proposed real Chromium checks for root to adopt into the shared E2E suite.
// NOT_RUN here. No Graph/Canvas/ResizeObserver mocks or simulated SDK output.
import { expect, type Locator, type Page, test } from '@playwright/test'

type Snapshot = {
  instance: number
  rendered: boolean
  size: [number, number]
  zoom: number
  renderEvents: number
  nodes: { id: string; client: number[]; states: string[] }[]
  edges: { source: string; target: string }[]
}
async function state(app: Locator): Promise<Snapshot> {
  return JSON.parse((await app.getByTestId('a07-sdk-state').textContent()) ?? 'null')
}
async function ready(app: Locator) {
  await expect(app.getByTestId('a07-status')).toHaveText(/^已渲染/)
  await expect.poll(async () => (await state(app))?.rendered).toBe(true)
}
async function open(page: Page, level: 'basic' | 'business' | 'advanced') {
  // Keep controls and graph in view together when using actual client coordinates.
  await page.setViewportSize({ width: 1280, height: 1600 })
  await page.goto(`/libraries/antv-g6?tab=demo&example=${level}`)
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  if (await run.isVisible()) await run.click()
  const app = page.getByRole('region', { name: 'AntV G6 实际图谱示例', exact: true })
  await ready(app)
  return app
}

test('@A07 basic real Canvas, directed topology and NodeEvent selection', async ({
  page,
}, info) => {
  const app = await open(page, 'basic')
  const first = await state(app)
  expect(first.nodes.map((node) => node.id).sort()).toEqual(['index', 'parse', 'source'])
  expect(first.edges.map((edge) => `${edge.source}->${edge.target}`).sort()).toEqual([
    'parse->index',
    'source->parse',
  ])
  const canvas = app.getByTestId('a07-owned-canvas').locator('canvas').nth(1)
  await expect(canvas).toBeVisible()
  // G6 5.1.1 defaults to background/main/label/transient canvases; index 1 is the real main layer.
  const greenPixels = await canvas.evaluate((element) => {
    if (!(element instanceof HTMLCanvasElement)) throw new Error('Expected a real HTML Canvas')
    const context = element.getContext('2d')
    if (!context) throw new Error('Expected the actual default 2D Canvas backend')
    const pixels = context.getImageData(0, 0, element.width, element.height).data
    let found = 0
    for (let i = 0; i < pixels.length; i += 4) {
      if (
        pixels[i + 3] > 0 &&
        Math.abs(pixels[i] - 217) < 8 &&
        Math.abs(pixels[i + 1] - 231) < 8 &&
        Math.abs(pixels[i + 2] - 223) < 8
      )
        found++
    }
    return found
  })
  expect(greenPixels).toBeGreaterThan(20)
  await app.getByRole('button', { name: '重新适配视口', exact: true }).click()
  await ready(app)
  const point = (await state(app)).nodes.find((node) => node.id === 'source')?.client
  if (!point) throw new Error('No actual G6 source-node client coordinates')
  // Public getClientByCanvas conversion. No guessed scale or injected SDK calls.
  await page.mouse.click(point[0], point[1])
  await expect(app.getByTestId('a07-selection')).toContainText('source')
  await expect
    .poll(async () => (await state(app)).nodes.find((node) => node.id === 'source')?.states)
    .toEqual(['selected'])
  await expect(app.getByRole('button', { name: 'RSS来源（source）', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  const keyboard = app.getByRole('button', { name: '正文解析（parse）', exact: true })
  await keyboard.focus()
  await keyboard.press('Enter')
  await ready(app)
  await expect
    .poll(async () => (await state(app)).nodes.find((node) => node.id === 'parse')?.states)
    .toEqual(['selected'])
  await expect
    .poll(async () => (await state(app)).nodes.find((node) => node.id === 'source')?.states)
    .toEqual([])
  await info.attach('a07-real-basic.png', {
    body: await canvas.screenshot(),
    contentType: 'image/png',
  })
})

test('@A07 business setData/render retains instance and deletes old topology', async ({ page }) => {
  const app = await open(page, 'business')
  const initial = await state(app)
  expect(initial.nodes).toHaveLength(4)
  expect(initial.edges).toHaveLength(3)
  await app.getByRole('button', { name: '质量审校（review）', exact: true }).click()
  await ready(app)
  await expect
    .poll(async () => (await state(app)).nodes.find((node) => node.id === 'review')?.states)
    .toEqual(['selected'])
  const toggle = app.getByRole('checkbox', { name: '启用审校节点', exact: true })
  await toggle.uncheck()
  await expect.poll(async () => (await state(app)).nodes.length).toBe(3)
  await ready(app)
  const compact = await state(app)
  expect(compact.instance).toBe(initial.instance)
  expect(compact.renderEvents).toBeGreaterThan(initial.renderEvents)
  expect(compact.edges.map((edge) => `${edge.source}->${edge.target}`).sort()).toEqual([
    'parse->index',
    'source->parse',
  ])
  await expect(app.getByTestId('a07-selection')).toHaveText('当前选择：暂无')
  await expect(app.getByTestId('a07-topology')).not.toContainText('review')
  // Rapid real DOM intents; final state must converge without rebuilding the Graph.
  await toggle.check()
  await toggle.uncheck()
  await toggle.check()
  await expect.poll(async () => (await state(app)).nodes.length).toBe(4)
  await ready(app)
  const expanded = await state(app)
  expect(expanded.instance).toBe(initial.instance)
  expect(expanded.edges.map((edge) => `${edge.source}->${edge.target}`).sort()).toEqual([
    'parse->review',
    'review->index',
    'source->parse',
  ])
})

test('@A07 advanced actual viewport, narrow fit, rebuild and owner teardown', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const app = await open(page, 'advanced')
  const initial = await state(app)
  await app.getByRole('checkbox', { name: '使用窄容器', exact: true }).check()
  await expect.poll(async () => (await state(app)).size[0]).toBeLessThanOrEqual(320)
  await ready(app)
  const narrow = await state(app)
  expect(narrow.size[0]).toBeLessThan(initial.size[0])
  await app.getByTestId('a07-graph').scrollIntoViewIfNeeded()
  const bounds = await app.getByTestId('a07-graph').boundingBox()
  if (!bounds) throw new Error('No actual graph bounds')
  for (const node of narrow.nodes) {
    expect(node.client[0]).toBeGreaterThan(bounds.x)
    expect(node.client[0]).toBeLessThan(bounds.x + bounds.width)
    expect(node.client[1]).toBeGreaterThan(bounds.y)
    expect(node.client[1]).toBeLessThan(bounds.y + bounds.height)
  }
  // A real wheel event changes the SDK camera. Reset uses the public fitView path.
  // Native hover scrolls the actual viewport into view before wheel input.
  await app.getByTestId('a07-graph').hover()
  await page.mouse.wheel(0, -180)
  await expect.poll(async () => (await state(app)).zoom).not.toBe(narrow.zoom)
  await app.getByRole('button', { name: '重新适配视口', exact: true }).click()
  await ready(app)
  await expect.poll(async () => Math.abs((await state(app)).zoom - narrow.zoom)).toBeLessThan(0.01)
  const oldMount = await app.getByTestId('a07-owned-canvas').elementHandle()
  if (!oldMount) throw new Error('No original owned container')
  await app.getByRole('button', { name: '重新创建图实例', exact: true }).click()
  await ready(app)
  expect((await state(app)).instance).toBeGreaterThan(initial.instance)
  await expect.poll(() => oldMount.evaluate((element) => element.isConnected)).toBe(false)
  await expect.poll(() => oldMount.getAttribute('data-graph-destroyed')).toBe('true')
  expect(await oldMount.getAttribute('data-cleanup-error')).toBeNull()
  await expect(app.getByTestId('a07-owned-canvas')).toHaveCount(1)
  await info.attach('a07-real-narrow.png', {
    body: await app.getByTestId('a07-graph').screenshot(),
    contentType: 'image/png',
  })
  const currentMount = await app.getByTestId('a07-owned-canvas').elementHandle()
  if (!currentMount) throw new Error('No current owned container')
  // Issue a real topology update and immediately request host unmount. SDK timing is not mocked.
  await app.getByRole('checkbox', { name: '启用审校节点', exact: true }).uncheck()
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  await expect.poll(() => currentMount.evaluate((element) => element.isConnected)).toBe(false)
  await expect.poll(() => currentMount.getAttribute('data-graph-destroyed')).toBe('true')
  expect(await currentMount.getAttribute('data-cleanup-error')).toBeNull()
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await ready(app)
  await expect(app.getByTestId('a07-owned-canvas')).toHaveCount(1)
  expect(errors).toEqual([])
})

test('@A07 mobile measured width does not impose a desktop minimum', async ({ page }) => {
  const app = await open(page, 'advanced')
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(async () => (await state(app)).size[0]).toBeLessThanOrEqual(390)
  await ready(app)
  expect((await state(app)).size[0]).toBeGreaterThan(0)
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
})

// Additional runtime inspection: labels/arrow direction and selected color in PNGs; no animation,
// no persistent timer. Pixel output, wheel behavior and disposal above remain NOT_RUN until root
// executes Chromium against a matching build. Node model/policy results cannot satisfy them.
