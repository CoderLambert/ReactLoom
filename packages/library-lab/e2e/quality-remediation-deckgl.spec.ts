// Ready Playwright proposal, NOT_RUN by the entry author. Root integrates and executes against a stable build.
// Actual WebGL2, Deck callbacks/GPU picking, attributes and lifecycle; no SDK mock or screenshot replacement.
import { expect, type Locator, type Page, test } from '@playwright/test'

type Snapshot = {
  initialized: boolean
  layerId: string
  instances: number
  layerLoaded: boolean
  width: number
  height: number
  radiusValues: number[]
  points: { id: string; x: number; y: number }[]
}
async function state(app: Locator): Promise<Snapshot | null> {
  return JSON.parse((await app.getByTestId('a17-sdk-state').textContent()) ?? 'null')
}
async function open(page: Page, level: 'basic' | 'business' | 'advanced') {
  await page.setViewportSize({ width: 1100, height: 1000 })
  await page.goto(`/libraries/deckgl?tab=demo&example=${level}`)
  const app = page.getByTestId('a17-workshop')
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  await expect(app.or(run).first()).toBeVisible({ timeout: 20_000 })
  if (await run.isVisible()) await run.click()
  await app.getByText('查看真实图层、属性和投影', { exact: true }).click()
  await expect(app).toHaveAttribute('data-ready', 'true', { timeout: 20_000 })
  await expect
    .poll(async () => (await state(app))?.layerLoaded ?? false, { timeout: 20_000 })
    .toBe(true)
  await expect(app.getByTestId('a17-error')).toHaveCount(0)
  await expect(app.getByTestId('a17-canvas').locator('canvas')).toHaveCount(1)
  expect((await state(app))?.initialized).toBe(true)
  expect((await state(app))?.layerId).toBe('library-sites')
  return app
}
function row(app: Locator, id: string) {
  return app.getByTestId('a17-table').locator(`tr[data-site-id="${id}"]`)
}

test('@A17 real WebGL initialization and GPU picking select the projected point', async ({
  page,
}) => {
  const app = await open(page, 'basic')
  await expect.poll(async () => (await state(app))?.instances ?? 0).toBe(2)
  await expect(app.getByTestId('a17-table').locator('tbody tr')).toHaveCount(2)
  const canvas = app.getByTestId('a17-canvas').locator('canvas')
  expect(
    await canvas.evaluate(
      (node) =>
        node instanceof HTMLCanvasElement &&
        node.getContext('webgl2') instanceof WebGL2RenderingContext,
    ),
  ).toBe(true)
  await canvas.scrollIntoViewIfNeeded()
  const bounds = await canvas.boundingBox()
  const point = (await state(app))?.points.find((point) => point.id === 't1')
  if (!bounds || !point) throw new Error('Actual Deck viewport did not supply point geometry')
  await page.mouse.move(bounds.x + point.x, bounds.y + point.y)
  await expect(page.locator('.deck-tooltip')).toContainText('天津')
  await page.mouse.click(bounds.x + point.x, bounds.y + point.y)
  await expect(app).toHaveAttribute('data-picked', 't1')
  await expect(
    row(app, 't1').getByRole('button', { name: '选择天津', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await row(app, 'b1').getByRole('button', { name: '选择北京', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(app).toHaveAttribute('data-picked', 'b1')
})

test('@A17 filtering and radius triggers update actual GPU attributes on the same Deck canvas', async ({
  page,
}) => {
  const app = await open(page, 'business')
  await expect.poll(async () => (await state(app))?.instances ?? 0).toBe(4)
  const canvas = await app.getByTestId('a17-canvas').locator('canvas').elementHandle()
  if (!canvas) throw new Error('Actual canvas missing')
  await row(app, 't1').getByRole('button', { name: '选择天津', exact: true }).click()
  await app.getByRole('checkbox', { name: '仅看健康站点', exact: true }).check()
  await expect.poll(async () => (await state(app))?.instances ?? 0).toBe(3)
  await expect(row(app, 't1')).toHaveCount(0)
  await expect(app).toHaveAttribute('data-picked', '')
  expect(await canvas.evaluate((node) => node.isConnected)).toBe(true)
  const slider = app.getByRole('slider', { name: /半径倍数/u })
  await slider.focus()
  await slider.press('End')
  await expect(app.getByTestId('a17-radius')).toHaveText('3')
  await expect
    .poll(async () => (await state(app))?.radiusValues[0] ?? 0)
    .toBeCloseTo(Math.sqrt(42) * 3, 3)
  expect(await canvas.evaluate((node) => node.isConnected)).toBe(true)
  await app.getByRole('checkbox', { name: '仅看健康站点', exact: true }).uncheck()
  await expect.poll(async () => (await state(app))?.instances ?? 0).toBe(4)
  await expect(app.getByTestId('a17-error')).toHaveCount(0)
})

test('@A17 dense data, complete DOM paging, resize and finalize retain truthful GPU boundaries', async ({
  page,
}) => {
  const app = await open(page, 'advanced')
  const canvas = await app.getByTestId('a17-canvas').locator('canvas').elementHandle()
  if (!canvas) throw new Error('Actual canvas missing')
  await app.getByRole('checkbox', { name: '添加1200个本地数据点', exact: true }).check()
  await expect(app).toHaveAttribute('data-count', '1204')
  await expect.poll(async () => (await state(app))?.instances ?? 0, { timeout: 20_000 }).toBe(1204)
  await expect(app.getByTestId('a17-table').locator('tbody tr')).toHaveCount(12)
  await expect(app.getByTestId('a17-page')).toContainText(/第\s*1\s*\/\s*101\s*页/u)
  await app.getByRole('button', { name: '下一页', exact: true }).click()
  await expect(row(app, 'local-8')).toHaveCount(1)
  expect(await canvas.evaluate((node) => node.isConnected)).toBe(true)
  expect((await state(app))?.instances).toBe(1204)
  await app.getByRole('checkbox', { name: '仅看健康站点', exact: true }).check()
  await expect(app).toHaveAttribute('data-count', '903')
  await expect.poll(async () => (await state(app))?.instances ?? 0).toBe(903)
  await expect(app.getByTestId('a17-page')).toContainText(/第\s*1\s*\/\s*76\s*页/u)
  await app.getByRole('button', { name: '重置数据', exact: true }).click()
  await expect.poll(async () => (await state(app))?.instances ?? 0).toBe(4)
  await expect(app.getByTestId('a17-table').locator('tbody tr')).toHaveCount(4)
  await expect(app.getByTestId('a17-radius')).toHaveText('1.5')
  const width = (await state(app))?.width ?? 0
  await page.setViewportSize({ width: 640, height: 1000 })
  await expect.poll(async () => (await state(app))?.width ?? 0).toBeLessThan(width)
  expect((await state(app))?.height).toBeGreaterThan(0)
  const host = await app.getByTestId('a17-canvas').elementHandle()
  if (!host) throw new Error('owned host missing')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  expect(
    await host.evaluate((node) => JSON.parse(node.getAttribute('data-a17-cleanup') ?? 'null')),
  ).toEqual({ initialized: false, canvas: false, canvases: 0 })
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(app).toHaveAttribute('data-ready', 'true', { timeout: 20_000 })
  await expect(app.getByTestId('a17-canvas').locator('canvas')).toHaveCount(1)
  await expect(app.getByTestId('a17-table').locator('tbody tr')).toHaveCount(4)
  await page.getByRole('tab', { name: 'Agent 指南', exact: true }).click()
  await expect(app).toHaveCount(0)
})

// Counts are initialized layer instances, not a performance or all-points-in-view claim.
// Hardware/GL failures are real failures to report, never an instruction to mock or silently skip.
// Touch, full screen readers, GPU memory/FPS and external basemap/overlay integration remain NOT_RUN.
