// Integration proposal; author browser NOT_RUN. Actual Virtuoso, ResizeObserver, scroll and real timers.
// Composition dispatch verifies the application event guard only, not a native operating-system IME.
import { expect, type Locator, type Page, test } from '@playwright/test'

type Level = 'basic' | 'business' | 'advanced'
async function open(page: Page, level: Level, viaAgent = false) {
  await page.setViewportSize({ width: 1100, height: 1000 })
  await page.goto(`/libraries/react-virtuoso?tab=${viaAgent ? 'agent' : 'demo'}&example=${level}`)
  if (viaAgent) await page.getByRole('tab', { name: '实战 Demo', exact: true }).click()
  const app = page.getByTestId(`c09-${level}`)
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  await expect(app.or(run).first()).toBeVisible({ timeout: 20_000 })
  if (await run.isVisible()) await run.click()
  await expect(app).toBeVisible()
  return app
}
function scroller(app: Locator) {
  return app.getByTestId('c09-viewport').locator('[data-virtuoso-scroller="true"]')
}
async function visibleAnchor(app: Locator) {
  return scroller(app).evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const rows = [...element.querySelectorAll<HTMLElement>('article[data-article-id]')]
    const row = rows.find((node) => {
      const bounds = node.getBoundingClientRect()
      return bounds.top >= rect.top + 1 && bounds.top < rect.bottom - 20
    })
    if (!row?.dataset.articleId) throw new Error('No actual visible article to anchor')
    return { id: row.dataset.articleId, offset: row.getBoundingClientRect().top - rect.top }
  })
}
async function offset(app: Locator, id: string) {
  return scroller(app).evaluate((element, articleId) => {
    const row = [...element.querySelectorAll<HTMLElement>('article[data-article-id]')].find(
      (node) => node.dataset.articleId === articleId,
    )
    if (!row) return null
    return row.getBoundingClientRect().top - element.getBoundingClientRect().top
  }, id)
}

test('@C09 basic: actual 10,000-item virtual window, imperative jump and resize', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const app = await open(page, 'basic')
  const rows = app.locator('article[data-article-id]')
  await expect(rows.first()).toBeVisible()
  await expect.poll(() => rows.count()).toBeGreaterThan(0)
  expect(await rows.count()).toBeLessThan(100)
  await expect(app.getByTestId('c09-range')).toHaveText(/已渲染区间：\d+–\d+/)
  await app.getByRole('button', { name: '跳至第 9001 条', exact: true }).click()
  const target = app.locator('[data-article-id="article-9001"]')
  await expect(target).toBeVisible()
  await scroller(app).scrollIntoViewIfNeeded()
  await expect(target).toBeInViewport()
  await expect.poll(() => scroller(app).evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
  await expect
    .poll(async () => {
      const text = await app.getByTestId('c09-range').textContent()
      const match = text?.match(/：(\d+)–(\d+)/)
      return Boolean(match && Number(match[1]) <= 9001 && Number(match[2]) >= 9001)
    })
    .toBe(true)
  await page.setViewportSize({ width: 390, height: 844 })
  await scroller(app).scrollIntoViewIfNeeded()
  await expect(target).toBeInViewport()
  expect(await rows.count()).toBeLessThan(100)
  await expect
    .poll(() => scroller(app).evaluate((element) => element.scrollWidth - element.clientWidth))
    .toBeLessThanOrEqual(2)
  expect(errors).toEqual([])
})

test('@C09 business: real SDK viewport identity, local pagination cancellation, empty recovery and leave', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  let app = await open(page, 'business', true)
  const status = () => app.getByTestId('c09-load-status')
  const query = () => app.getByRole('textbox', { name: '文章关键词', exact: true })
  const search = () => app.getByRole('button', { name: '搜索', exact: true })
  const load = () => app.getByRole('button', { name: '加载下一段', exact: true })
  await expect(status()).toContainText('30/630 篇')
  await load().click()
  await expect(app).toHaveAttribute('data-loading', 'true')
  await expect(load()).toBeDisabled()
  await app.getByRole('button', { name: '取消本地加载', exact: true }).click()
  await expect(app).toHaveAttribute('data-loading', 'false')
  await page.waitForTimeout(350) // Real 260ms owned timer has had time to expire; no fake clock.
  await expect(status()).toContainText('30/630 篇')
  await expect(status()).toContainText('已取消')
  await load().click()
  await expect(status()).toContainText('60/630 篇')
  const oldScroller = await scroller(app).elementHandle()
  if (!oldScroller) throw new Error('Missing actual SDK scroller')
  await scroller(app).hover()
  await page.mouse.wheel(0, 600)
  await expect
    .poll(() => scroller(app).evaluate((element) => element.scrollTop))
    .toBeGreaterThan(100)
  await search().click() // Same empty query still starts a new viewport.
  await expect(app).toHaveAttribute('data-view-revision', '1')
  await expect.poll(() => oldScroller.evaluate((element) => element.isConnected)).toBe(false)
  await expect(status()).toContainText('30/630 篇')
  await expect
    .poll(() => scroller(app).evaluate((element) => element.scrollTop))
    .toBeLessThanOrEqual(2)

  await load().click()
  await expect(app).toHaveAttribute('data-loading', 'true')
  await query().fill('不存在的文章XYZ')
  await search().click()
  await expect(app.getByTestId('c09-empty')).toBeVisible()
  await page.waitForTimeout(350)
  await expect(status()).toContainText('0/0 篇')
  await expect(app.locator('article[data-article-id]')).toHaveCount(0)
  await expect(app.getByRole('button', { name: '已是最后一段', exact: true })).toBeDisabled()
  await query().fill('React')
  await query().dispatchEvent('compositionstart')
  const revision = await app.getAttribute('data-view-revision')
  await search().click()
  await expect(app).toHaveAttribute('data-view-revision', revision ?? 'missing')
  await expect(status()).toContainText('不会提交搜索')
  await query().dispatchEvent('compositionend')
  await search().click()
  await expect(status()).toContainText('30/210 篇')
  await expect(app.locator('article[data-article-id]').first()).toHaveAttribute(
    'data-article-id',
    'article-3',
  )
  await load().click()
  await expect(app).toHaveAttribute('data-loading', 'true')
  const heldInput = await query().elementHandle()
  if (!heldInput) throw new Error('Missing original input')
  await page.goBack() // SPA history: agent page was opened before Demo; provider really unmounts.
  await expect.poll(() => heldInput.evaluate((element) => element.isConnected)).toBe(false)
  await page.waitForTimeout(350)
  await page.goForward()
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  app = page.getByTestId('c09-business')
  await expect(app.or(run).first()).toBeVisible()
  if (await run.isVisible()) await run.click()
  await expect(app).toHaveAttribute('data-view-revision', '0')
  await expect(status()).toContainText('30/630 篇')
  await expect(query()).toHaveValue('')
  expect(errors).toEqual([])
})

test('@C09 advanced: true prepend anchor, ID expansion measurement and conditional bottom follow', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const app = await open(page, 'advanced')
  await expect(app.getByTestId('c09-history-status')).toContainText('消息 30 条，窗口起点 100000')
  const first = app.locator('[data-article-id="article-501"]')
  await expect(first).toBeVisible()
  const initialHeight = await first.evaluate((element) => element.getBoundingClientRect().height)
  await app.getByRole('button', { name: '展开 article-501 说明', exact: true }).click()
  await expect(
    app.getByRole('button', { name: '折叠 article-501 说明', exact: true }),
  ).toHaveAttribute('aria-expanded', 'true')
  await expect
    .poll(() => first.evaluate((element) => element.getBoundingClientRect().height))
    .toBeGreaterThan(initialHeight + 100)
  await expect
    .poll(() =>
      first.evaluate((element) =>
        Number(element.parentElement?.getAttribute('data-known-size') ?? 0),
      ),
    )
    .toBeGreaterThan(initialHeight + 100)
  const before = await offset(app, 'article-501')
  if (before === null) throw new Error('Missing old article before prepend')
  await app.getByRole('button', { name: '向前加载 10 条', exact: true }).click()
  await expect(app.getByTestId('c09-history-status')).toContainText('消息 40 条，窗口起点 99990')
  await expect(
    app.getByRole('button', { name: '折叠 article-501 说明', exact: true }),
  ).toHaveAttribute('aria-expanded', 'true')
  await expect
    .poll(async () => {
      const after = await offset(app, 'article-501')
      return after === null ? 1e9 : Math.abs(after - before)
    })
    .toBeLessThan(8)
  await app.getByRole('button', { name: '折叠 article-501 说明', exact: true }).click()
  // Wait for the actual collapsed row measurement before establishing a new scroll baseline.
  await expect
    .poll(() =>
      first.evaluate((element) =>
        Math.abs(
          Number(element.parentElement?.getAttribute('data-known-size') ?? 0) -
            element.getBoundingClientRect().height,
        ),
      ),
    )
    .toBeLessThanOrEqual(1)
  await scroller(app).hover()
  const beforeWheel = await scroller(app).evaluate((element) => element.scrollTop)
  await page.mouse.wheel(0, 400)
  // mouse.wheel returns before scrolling finishes; atBottom was already false before this wheel.
  await expect
    .poll(() => scroller(app).evaluate((element) => element.scrollTop))
    .toBeGreaterThan(beforeWheel + 390)
  await expect(app).toHaveAttribute('data-at-bottom', 'false')
  const anchor = await visibleAnchor(app)
  await app.getByRole('button', { name: '添加最新消息', exact: true }).click()
  await expect(app.getByTestId('c09-history-status')).toContainText('消息 41 条')
  await expect
    .poll(async () => {
      const after = await offset(app, anchor.id)
      return after === null ? 1e9 : Math.abs(after - anchor.offset)
    })
    .toBeLessThan(8)
  await app.getByRole('button', { name: '跳至最新消息', exact: true }).click()
  await expect(app).toHaveAttribute('data-at-bottom', 'true')
  await app.getByRole('button', { name: '添加最新消息', exact: true }).click()
  await expect(app.getByTestId('c09-history-status')).toContainText('消息 42 条')
  await scroller(app).scrollIntoViewIfNeeded()
  await expect(app.locator('[data-article-id="article-532"]')).toBeInViewport()
  await expect(app).toHaveAttribute('data-at-bottom', 'true')
  await expect
    .poll(() =>
      scroller(app).evaluate(
        (element) => element.scrollHeight - element.clientHeight - element.scrollTop,
      ),
    )
    .toBeLessThanOrEqual(4)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect
    .poll(() => scroller(app).evaluate((element) => element.scrollWidth - element.clientWidth))
    .toBeLessThanOrEqual(2)
  expect(errors).toEqual([])
})
