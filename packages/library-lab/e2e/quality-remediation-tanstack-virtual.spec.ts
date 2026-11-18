// Three real browser targets. NOT_RUN by author; root integrates into public e2e.
// No SDK/observer/scroll/clock mocks. Composition dispatch below tests only the app guard, never OS IME.
import { expect, type Locator, type Page, test } from '@playwright/test'

async function open(page: Page, level: 'basic' | 'business' | 'advanced') {
  await page.setViewportSize({ width: 1280, height: 1200 })
  await page.goto(`/libraries/tanstack-virtual?tab=demo&example=${level}`)
  const app = page.getByTestId('c10-workshop')
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  await expect(app.or(run).first()).toBeVisible({ timeout: 20_000 })
  if (await run.isVisible()) await run.click()
  await expect(app).toHaveAttribute('data-level', level)
  await expect.poll(async () => (await model(app)).virtualCount).toBeGreaterThan(0)
  return app
}
async function model(app: Locator) {
  return JSON.parse((await app.getByTestId('c10-model').textContent()) ?? '{}')
}
async function filter(app: Locator) {
  return JSON.parse((await app.getByTestId('c10-filter-state').textContent()) ?? '{}')
}
function row(app: Locator, id: string) {
  return app.locator(`[data-row-id="${id}"]`)
}
async function scrollTop(app: Locator) {
  return app.getByTestId('c10-scroll').evaluate((element) => element.scrollTop)
}
async function actualFrames(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  )
}

test('@C10 actual 8000-row data renders a bounded DOM window and responds to native scroll and real deep jumps', async ({
  page,
}) => {
  const app = await open(page, 'basic')
  expect((await model(app)).count).toBe(8000)
  expect(await app.getByTestId('c10-row').count()).toBeGreaterThan(0)
  expect(await app.getByTestId('c10-row').count()).toBeLessThan(60)
  expect((await model(app)).firstKey).toBe('rss-1')
  const viewport = app.getByRole('region', { name: '虚拟文章滚动窗口', exact: true })
  await viewport.scrollIntoViewIfNeeded()
  await viewport.hover()
  await page.mouse.wheel(0, 1400)
  await expect.poll(() => scrollTop(app)).toBeGreaterThan(0)
  await expect.poll(async () => (await model(app)).firstIndex).toBeGreaterThan(0)
  const beforeKeyboard = await scrollTop(app)
  await viewport.focus()
  await page.keyboard.press('PageDown')
  await expect.poll(() => scrollTop(app)).toBeGreaterThan(beforeKeyboard)
  await app.getByRole('button', { name: '跳转靠近末尾', exact: true }).click()
  await expect.poll(async () => (await model(app)).lastIndex).toBeGreaterThan(7900)
  await expect(row(app, 'rss-7981')).toBeInViewport()
  expect(await app.getByTestId('c10-row').count()).toBeLessThan(60)
  await app.getByRole('button', { name: '回到顶部', exact: true }).click()
  await expect.poll(() => scrollTop(app)).toBeLessThan(2)
  await expect(row(app, 'rss-1')).toBeInViewport()
})

test('@C10 committed category/query identity rebuilds real views, handles empty results and preserves the composition submit boundary', async ({
  page,
}) => {
  const app = await open(page, 'business')
  const input = app.getByRole('textbox', { name: '搜索文章', exact: true })
  await app.getByRole('combobox', { name: '分类', exact: true }).selectOption('工程实践')
  expect((await model(app)).count).toBe(3400) // Draft category alone does not commit.
  expect((await filter(app)).category).toBe('all')
  await app.getByRole('button', { name: '筛选', exact: true }).click()
  await expect.poll(async () => (await model(app)).count).toBe(850)
  expect((await filter(app)).revision).toBe(1)
  await expect(row(app, 'rss-1')).toBeVisible()
  await expect(row(app, 'rss-5')).toBeVisible()
  await app.getByRole('button', { name: '跳转靠近末尾', exact: true }).click()
  await expect.poll(async () => (await model(app)).lastIndex).toBeGreaterThan(800)
  const old = await app.getByTestId('c10-view').elementHandle()
  if (!old) throw new Error('Missing old actual view')
  await app.getByRole('button', { name: '筛选', exact: true }).click()
  await expect.poll(async () => (await filter(app)).revision).toBe(2)
  expect(await old.evaluate((element) => element.isConnected)).toBe(false)
  await expect.poll(() => scrollTop(app)).toBeLessThan(2)
  expect((await model(app)).firstKey).toBe('rss-1')
  await input.fill('没有这条文章')
  await app.getByRole('button', { name: '筛选', exact: true }).click()
  await expect(app.getByTestId('c10-empty')).toBeVisible()
  await expect(app.getByTestId('c10-row')).toHaveCount(0)
  expect((await model(app)).count).toBe(0)
  await expect(app.getByRole('button', { name: '跳转靠近末尾', exact: true })).toBeDisabled()
  await expect(app.getByRole('button', { name: '回到顶部', exact: true })).toBeDisabled()
  await app.getByRole('button', { name: '重置筛选', exact: true }).click()
  await expect.poll(async () => (await model(app)).count).toBe(3400)
  const revision = (await filter(app)).revision
  // Controlled app-boundary event sequence, not a claim about real OS composition.
  await input.focus()
  await input.dispatchEvent('compositionstart')
  await input.fill('工程')
  await page.keyboard.down('Enter')
  await input.dispatchEvent('compositionend', { data: '工程' })
  await page.keyboard.up('Enter')
  expect((await filter(app)).revision).toBe(revision)
  await page.keyboard.press('Enter')
  await expect.poll(async () => (await filter(app)).revision).toBe(revision + 1)
  expect((await filter(app)).query).toBe('工程')
  await app.getByRole('button', { name: '重置筛选', exact: true }).click()
  const afterReset = (await filter(app)).revision
  await input.focus()
  await input.dispatchEvent('compositionstart')
  await input.fill('前端')
  await input.dispatchEvent('compositionend', { data: '前端' }) // Mouse/Space-style end without Enter keyup.
  await page.keyboard.press('Enter')
  await expect.poll(async () => (await filter(app)).revision).toBe(afterReset + 1)
  expect((await filter(app)).query).toBe('前端')
})

test('@C10 actual measureElement changes geometry/total for expanded rows, works at depth, and rebuild/unmount clear owned views', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  const app = await open(page, 'advanced')
  const first = row(app, 'rss-1')
  await actualFrames(page)
  const before = await first.boundingBox()
  if (!before) throw new Error('Missing actual first row geometry')
  const totalBefore = (await model(app)).totalSize
  await first.getByRole('button', { name: '展开长文', exact: true }).click()
  await expect(first.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
  await expect
    .poll(async () => (await first.boundingBox())?.height ?? 0)
    .toBeGreaterThan(before.height + 80)
  await expect.poll(async () => (await model(app)).totalSize).toBeGreaterThan(totalBefore)
  await expect
    .poll(async () => {
      const current = await first.boundingBox()
      const next = await row(app, 'rss-2').boundingBox()
      return current && next ? next.y - current.y - current.height : -1000
    })
    .toBeGreaterThanOrEqual(-1)
  await first.getByRole('button', { name: '收起长文', exact: true }).click()
  await expect
    .poll(async () => (await first.boundingBox())?.height ?? 10000)
    .toBeLessThanOrEqual(before.height + 1)
  await app.getByRole('button', { name: '跳转靠近末尾', exact: true }).click()
  const deep = row(app, 'rss-3381')
  await expect(deep).toBeInViewport()
  await deep.getByRole('button', { name: '展开长文', exact: true }).click()
  await expect(deep.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
  await app.getByRole('button', { name: '回到顶部', exact: true }).click()
  await expect(first).toBeInViewport()
  await first.getByRole('button', { name: '展开长文', exact: true }).click()
  const old = await app.getByTestId('c10-view').elementHandle()
  if (!old) throw new Error('Missing expanded actual view')
  await app.getByRole('button', { name: '筛选', exact: true }).click()
  expect(await old.evaluate((element) => element.isConnected)).toBe(false)
  await expect(first.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
  await page.setViewportSize({ width: 390, height: 1050 })
  await actualFrames(page)
  const bounds = await app.getByTestId('c10-scroll').boundingBox()
  if (!bounds) throw new Error('Missing real narrow scroll viewport')
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(391)
  const held = await app.getByTestId('c10-scroll').elementHandle()
  if (!held) throw new Error('Missing owned viewport before stop')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  expect(await held.evaluate((element) => element.isConnected)).toBe(false)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect.poll(async () => (await model(app)).count).toBe(3400)
  await expect(first.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
  expect(errors).toEqual([])
})
