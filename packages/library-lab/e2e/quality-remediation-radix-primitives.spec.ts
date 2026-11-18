// Ready root integration proposal, NOT_RUN by entry author.
// Real Radix portals/menu ARIA/keyboard/focus and application rows; no SDK mock or fake DOM menu.
import { expect, type Locator, type Page, test } from '@playwright/test'

async function open(page: Page, level: 'basic' | 'business' | 'advanced', viaAgent = false) {
  await page.setViewportSize({ width: 1100, height: 1000 })
  await page.goto(`/libraries/radix-primitives?tab=${viaAgent ? 'agent' : 'demo'}&example=${level}`)
  if (viaAgent) await page.getByRole('tab', { name: '实战 Demo', exact: true }).click()
  const app = page.getByTestId('b11-workshop')
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  await expect(app.or(run).first()).toBeVisible({ timeout: 20_000 })
  if (await run.isVisible()) await run.click()
  await expect(app).toBeVisible()
  return app
}
function feed(app: Locator, id: string) {
  return app.getByTestId('b11-feeds').locator(`button[data-feed-id="${id}"]`)
}
function menu(page: Page) {
  return page.getByRole('menu', { name: /^更多操作(?:\s*▾)?$/u })
}
async function show(page: Page, app: Locator) {
  await app.getByTestId('b11-trigger').focus()
  await page.keyboard.press('ArrowDown')
  await expect(menu(page)).toBeVisible()
  return menu(page)
}

test('@B11 actual asChild Trigger, native keyboard typeahead, local action and close focus', async ({
  page,
}) => {
  const app = await open(page, 'basic')
  const trigger = app.getByTestId('b11-trigger')
  expect(await trigger.evaluate((node) => node.tagName)).toBe('BUTTON')
  await expect(trigger.locator('button')).toHaveCount(0)
  const held = await feed(app, 'browser').elementHandle()
  if (!held) throw new Error('Missing real source row')
  const content = await show(page, app)
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await expect(content.getByRole('menuitem', { name: '查看详情', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(content).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await trigger.press('Enter')
  await expect(content).toBeVisible()
  await page.keyboard.press('r') // Real Radix textValue=rename alias, not a document shortcut.
  const rename = content.getByRole('menuitem', { name: '重命名（本地）', exact: true })
  await expect(rename).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(content).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await expect(app.getByTestId('b11-selected')).toHaveText('工程精选（本地更名）')
  await expect(app).toHaveAttribute('data-selected', 'browser')
  expect(await held.evaluate((node) => node.isConnected)).toBe(true)
  await show(page, app)
  await page.keyboard.press('Enter')
  await expect(app.getByTestId('b11-status')).toContainText(
    '查看详情：工程精选（本地更名），未读7，收藏3',
  )
  await expect(trigger).toBeFocused()
})

test('@B11 controlled checkbox and radio update actual row order while preserving the real menu', async ({
  page,
}) => {
  const app = await open(page, 'business')
  await feed(app, 'design').click()
  const held = await feed(app, 'design').elementHandle()
  if (!held) throw new Error('Missing stable selected row')
  const content = await show(page, app)
  const pin = content.getByRole('menuitemcheckbox', { name: '收藏置顶', exact: true })
  await expect(pin).toHaveAttribute('aria-checked', 'false')
  await pin.click()
  await expect(pin).toHaveAttribute('aria-checked', 'true')
  await expect(content).toBeVisible()
  await expect(app).toHaveAttribute('data-order', 'design,browser,release')
  const popular = content.getByRole('menuitemradio', { name: '热度优先', exact: true })
  await popular.click()
  await expect(popular).toHaveAttribute('aria-checked', 'true')
  await expect(
    content.getByRole('menuitemradio', { name: '最新优先', exact: true }),
  ).toHaveAttribute('aria-checked', 'false')
  await expect(content).toBeVisible()
  await expect(app).toHaveAttribute('data-sort', 'popular')
  await pin.click()
  await expect(app).toHaveAttribute('data-order', 'browser,release,design')
  await content.getByRole('menuitemradio', { name: '最新优先', exact: true }).click()
  await expect(app).toHaveAttribute('data-order', 'browser,design,release')
  expect(await held.evaluate((node) => node.isConnected)).toBe(true)
  await expect(content).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(app.getByTestId('b11-trigger')).toBeFocused()
})

test('@B11 real nested portals, disabled skip, filtered deletion fallback and SPA teardown', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const app = await open(page, 'advanced', true)
  const bodyBefore = await page.evaluate(() => document.body.style.pointerEvents)
  const lock = app.getByRole('checkbox', { name: '锁定删除权限', exact: true })
  await lock.check()
  let content = await show(page, app)
  await expect(content.getByRole('menuitem', { name: /^删除当前订阅/u })).toBeDisabled()
  await page.keyboard.press('End')
  await expect(content.getByRole('menuitem', { name: '显示全部频道', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(app).toHaveAttribute('data-count', '3')
  await lock.uncheck()
  content = await show(page, app)
  const subTrigger = content.getByRole('menuitem', { name: /^更多筛选(?:\s*▸)?$/u })
  await subTrigger.focus()
  await page.keyboard.press('ArrowRight')
  const sub = page.getByRole('menu', { name: /^更多筛选(?:\s*▸)?$/u })
  await expect(sub).toBeVisible()
  await expect(sub.getByRole('menuitem', { name: '只看未读', exact: true })).toBeFocused()
  await page.keyboard.press('ArrowLeft')
  await expect(sub).toHaveCount(0)
  await expect(subTrigger).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await sub.getByRole('menuitem', { name: '只看未读', exact: true }).click()
  await expect(menu(page)).toHaveCount(0)
  await expect(app).toHaveAttribute('data-order', 'browser,release')
  content = await show(page, app)
  await content.getByRole('menuitem', { name: '删除当前订阅', exact: true }).click()
  await expect(app).toHaveAttribute('data-selected', 'release')
  await expect(feed(app, 'design')).toHaveCount(0) // Exists in data, hidden by unread scope.
  await expect(feed(app, 'release')).toHaveAttribute('aria-pressed', 'true')
  content = await show(page, app)
  await content.getByRole('menuitem', { name: '删除当前订阅', exact: true }).click()
  await expect(app).toHaveAttribute('data-count', '1')
  await expect(app).toHaveAttribute('data-visible', '0')
  await expect(app).toHaveAttribute('data-selected', '')
  await expect(app.getByTestId('b11-selected')).toHaveText('暂无可用频道')
  content = await show(page, app)
  await expect(content.getByRole('menuitem', { name: '删除当前订阅', exact: true })).toBeDisabled()
  await expect(content.getByRole('menuitem', { name: '查看详情', exact: true })).toBeDisabled()
  await expect(
    content.getByRole('menuitemcheckbox', { name: '收藏置顶', exact: true }),
  ).toBeDisabled()
  await content.getByRole('menuitem', { name: '显示全部频道', exact: true }).click()
  await expect(app).toHaveAttribute('data-selected', 'design')
  await expect(app).toHaveAttribute('data-order', 'design')
  await app.getByRole('button', { name: '恢复演示数据', exact: true }).click()
  await expect(app).toHaveAttribute('data-order', 'browser,design,release')
  await page.setViewportSize({ width: 320, height: 720 })
  await app.getByTestId('b11-trigger').scrollIntoViewIfNeeded()
  content = await show(page, app)
  const bounds = await content.boundingBox()
  if (!bounds) throw new Error('No real menu geometry')
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(321)
  expect(bounds.height).toBeLessThanOrEqual(721)
  await content.getByRole('menuitem', { name: /^更多筛选(?:\s*▸)?$/u }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(sub).toBeVisible()
  // Browser Back operates outside the menu and triggers same-document SPA unmount, not reload.
  await page.goBack()
  await expect(page).toHaveURL(/tab=agent/u)
  await expect(app).toHaveCount(0)
  await expect(page.getByRole('menu')).toHaveCount(0)
  expect(await page.evaluate(() => document.body.style.pointerEvents)).toBe(bodyBefore)
  const again = await open(page, 'advanced')
  await expect(again).toHaveAttribute('data-order', 'browser,design,release')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(again).toHaveCount(0)
  expect(errors).toEqual([])
})
// Still NOT_RUN: native screen-reader/touch/IME, full resource census, SSR hydration, external authorization/API.
