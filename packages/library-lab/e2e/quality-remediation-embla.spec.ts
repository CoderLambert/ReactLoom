import { expect, type Locator, type Page, test } from '@playwright/test'

type Reading = {
  selectedSnap: number
  snapPositions: number[]
  scrollProgress: number
  canPrevious: boolean
  canNext: boolean
  slideIds: string[]
  visibleSlideIndices: number[]
  viewportWidth: number
  trackWidth: number
}
async function open(page: Page, level: 'basic' | 'advanced') {
  await page.setViewportSize({ width: 1280, height: 1400 })
  await page.goto(`/libraries/embla-carousel?tab=demo&example=${level}`)
  const app = page.getByTestId('b19-workshop')
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  await expect(app.or(run).first()).toBeVisible()
  if (await run.isVisible()) await run.click()
  await expect(app.getByRole('button', { name: '读取真实引擎', exact: true })).toBeEnabled()
  return app
}
async function read(app: Locator): Promise<Reading> {
  await app.getByRole('button', { name: '读取真实引擎', exact: true }).click()
  return JSON.parse((await app.getByTestId('b19-reading').textContent()) ?? '{}')
}

test('@B19 real measured snap positions, trusted native pointer and stable DOM drive non-loop boundaries', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const app = await open(page, 'basic')
  const initial = await read(app)
  expect(initial.slideIds).toEqual(['1', '2', '3', '4'])
  expect(initial.snapPositions.length).toBeGreaterThan(1)
  expect(initial.snapPositions.length).toBeLessThanOrEqual(initial.slideIds.length)
  expect(initial.viewportWidth).toBeGreaterThan(200)
  await app.getByRole('combobox', { name: '卡片宽度', exact: true }).selectOption('48%')
  await expect
    .poll(async () => (await read(app)).snapPositions.length)
    .toBeLessThan(initial.slideIds.length)

  const previous = app.getByRole('button', { name: '← 上一张', exact: true })
  const next = app.getByRole('button', { name: '下一张 →', exact: true })
  await expect(previous).toBeDisabled()
  const first = await app.locator('[data-slide-id="1"]').elementHandle()
  if (!first) throw new Error('No actual slide')
  const viewport = app.getByTestId('b19-viewport')
  await viewport.evaluate((element) =>
    element.addEventListener('pointerdown', (event) =>
      element.setAttribute('data-native-pointer', String(event.isTrusted)),
    ),
  )
  await viewport.scrollIntoViewIfNeeded()
  const box = await viewport.boundingBox()
  if (!box) throw new Error('No actual viewport')
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.65)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.18, box.y + box.height * 0.65, { steps: 18 })
  await page.mouse.up()
  await expect(viewport).toHaveAttribute('data-native-pointer', 'true')
  await expect.poll(async () => (await read(app)).selectedSnap).toBeGreaterThan(0)
  expect(
    await app
      .getByTestId('b19-track')
      .evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41),
  ).toBeLessThan(-50)
  expect(await first.evaluate((node) => node.isConnected)).toBe(true)
  for (let count = 0; count < initial.snapPositions.length && (await next.isEnabled()); count++)
    await next.click()
  await expect(next).toBeDisabled()
  const last = await read(app)
  expect(last.selectedSnap).toBe(last.snapPositions.length - 1)
  await previous.focus()
  await page.keyboard.press('Enter')
  await expect.poll(async () => (await read(app)).selectedSnap).toBeLessThan(last.selectedSnap)
  const path = info.outputPath('b19-real-carousel.png')
  await viewport.screenshot({ path })
  await info.attach('b19-real-carousel', { path, contentType: 'image/png' })
})

test('@B19 actual loop fallback, controlled reInit, monotonic IDs and restore respect live engine state', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const app = await open(page, 'advanced')
  const next = app.getByRole('button', { name: '下一张 →', exact: true })
  const add = app.getByRole('button', { name: '添加卡片', exact: true })
  const remove = app.getByRole('button', { name: '移除最后一张', exact: true })
  const initial = await read(app)
  await expect(app).toHaveAttribute('data-reduced', 'true')
  expect(initial.canPrevious).toBe(true)
  for (let count = 0; count < initial.snapPositions.length; count++) await next.click()
  expect((await read(app)).selectedSnap).toBe(0)
  for (let count = 0; count < 3; count++) await remove.click()
  await expect.poll(async () => (await read(app)).slideIds).toEqual(['1'])
  await expect(next).toBeDisabled()
  await expect(app.getByRole('button', { name: '← 上一张', exact: true })).toBeDisabled()
  await expect(remove).toBeDisabled()
  await add.click()
  await expect.poll(async () => (await read(app)).slideIds).toEqual(['1', '5'])
  await remove.click()
  await add.click()
  await expect.poll(async () => (await read(app)).slideIds).toEqual(['1', '6'])
  await app.getByRole('button', { name: '恢复默认卡片', exact: true }).click()
  await expect.poll(async () => (await read(app)).slideIds).toEqual(['1', '2', '3', '4'])
  expect((await read(app)).selectedSnap).toBe(0)
  for (let count = 0; count < 20; count++) await add.click()
  await expect(add).toBeDisabled()
  expect((await read(app)).slideIds).toHaveLength(24)
  expect(new Set((await read(app)).slideIds).size).toBe(24)
})

test('@B19 local arrow focus, live reduced-motion jump, real ResizeObserver and hook destroy are observable', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const app = await open(page, 'basic')
  const wide = await read(app)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(app).toHaveAttribute('data-reduced', 'true')
  const viewport = app.getByTestId('b19-viewport')
  await viewport.focus()
  await viewport.press('ArrowRight')
  const instant = await read(app)
  expect(instant.selectedSnap).toBe(1)
  expect(instant.scrollProgress).toBeCloseTo(instant.snapPositions[1], 3)
  await app.getByRole('button', { name: '读取真实引擎', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  expect((await read(app)).selectedSnap).toBe(1)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(async () => (await read(app)).viewportWidth).toBeLessThan(wide.viewportWidth)
  const narrow = await read(app)
  expect(narrow.selectedSnap).toBeLessThan(narrow.snapPositions.length)
  const old = await viewport.elementHandle()
  if (!old) throw new Error('No owned viewport before stop')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  await expect.poll(() => old.evaluate((element) => element.dataset.emblaDestroyed)).toBe('true')
  expect(await old.evaluate((element) => element.isConnected)).toBe(false)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(app.getByRole('button', { name: '读取真实引擎', exact: true })).toBeEnabled()
  expect((await read(app)).slideIds).toEqual(['1', '2', '3', '4'])
  expect((await read(app)).selectedSnap).toBe(0)
})
