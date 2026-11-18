// Actual nuqs/TanStack Router, URL/history and DOM. Author browser NOT_RUN.
// Composition dispatch below tests the application protocol, never real OS IME.
import { expect, type Locator, type Page, test } from '@playwright/test'

async function ready(page: Page, level: 'basic' | 'business' | 'advanced') {
  const app = page.getByTestId('c19-workshop')
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  await expect(app.or(run).first()).toBeVisible({ timeout: 20_000 })
  if (await run.isVisible()) await run.click()
  await expect(app).toHaveAttribute('data-level', level)
  return app
}
async function open(page: Page, level: 'basic' | 'business' | 'advanced', extra = '') {
  await page.setViewportSize({ width: 1280, height: 1100 })
  await page.goto(`/libraries/nuqs?tab=demo&example=${level}&host_probe=kept${extra}`)
  return ready(page, level)
}
async function model(app: Locator) {
  return JSON.parse((await app.getByTestId('c19-model').textContent()) ?? '{}')
}
function url(page: Page) {
  return new URL(page.url())
}
async function hostKeys(page: Page, level: string) {
  expect(url(page).searchParams.get('tab')).toBe('demo')
  expect(url(page).searchParams.get('example')).toBe(level)
  expect(url(page).searchParams.get('host_probe')).toBe('kept')
}
async function historyLength(page: Page) {
  return page.evaluate(() => window.history.length)
}

test('@C19 real query state shares/reloads, clears only owned keys, and keeps IME/space drafts out of URL until apply', async ({
  page,
}) => {
  let app = await open(page, 'basic', '&ll_c19_group=business&ll_c19_page=3')
  expect((await model(app)).safe.group).toBe('all')
  await expect(app.getByTestId('c19-result-row')).toHaveCount(5)
  const input = app.getByRole('textbox', { name: 'RSS 搜索', exact: true })
  const before = await historyLength(page)
  await input.fill('React ')
  await input.pressSequentially('官方')
  await expect(input).toHaveValue('React 官方')
  expect(url(page).searchParams.has('ll_c19_q')).toBe(false)
  await expect(app.getByTestId('c19-result-row')).toHaveCount(5)
  await input.press('Enter')
  await expect.poll(() => url(page).searchParams.get('ll_c19_q')).toBe('React 官方')
  await expect(app.getByTestId('c19-result-row')).toHaveCount(1)
  await expect(app.locator('[data-feed-id="rss-001"]')).toBeVisible()
  expect(await historyLength(page)).toBe(before)
  expect(url(page).searchParams.has('ll_c19_page')).toBe(false)
  await hostKeys(page, 'basic')
  await page.reload()
  app = await ready(page, 'basic')
  await expect(app.getByRole('textbox', { name: 'RSS 搜索', exact: true })).toHaveValue(
    'React 官方',
  )
  await expect(app.getByTestId('c19-result-row')).toHaveCount(1)
  await app.getByRole('button', { name: '清除实验参数', exact: true }).click()
  await expect.poll(() => url(page).searchParams.has('ll_c19_q')).toBe(false)
  for (const key of ['ll_c19_q', 'll_c19_page', 'll_c19_group'])
    expect(url(page).searchParams.has(key)).toBe(false)
  await hostKeys(page, 'basic')
  const editor = app.getByRole('textbox', { name: 'RSS 搜索', exact: true })
  await editor.focus()
  await editor.dispatchEvent('compositionstart')
  await editor.fill('技术')
  await page.keyboard.down('Enter')
  await editor.dispatchEvent('compositionend', { data: '技术' })
  await page.keyboard.up('Enter')
  expect(url(page).searchParams.has('ll_c19_q')).toBe(false)
  await page.keyboard.press('Enter')
  await expect.poll(() => url(page).searchParams.get('ll_c19_q')).toBe('技术')
  await expect(app.locator('[data-feed-id="rss-004"]')).toBeVisible()
  await editor.dispatchEvent('compositionstart')
  await editor.fill('商业')
  await editor.dispatchEvent('compositionend', { data: '商业' }) // Space/mouse-style confirmation with no Enter keyup.
  await page.keyboard.press('Enter')
  await expect.poll(() => url(page).searchParams.get('ll_c19_q')).toBe('商业')
  await expect(app.locator('[data-feed-id="rss-005"]')).toBeVisible()
})

test('@C19 actual grouped parser update applies query/group/page together, uses replace and recovers empty results', async ({
  page,
}) => {
  const app = await open(page, 'business')
  const before = await historyLength(page)
  await app.getByRole('button', { name: '下一页', exact: true }).click()
  await expect.poll(() => url(page).searchParams.get('ll_c19_page')).toBe('2')
  expect(await historyLength(page)).toBe(before)
  await expect(app.locator('[data-feed-id="rss-003"]')).toBeVisible()
  await app.getByRole('combobox', { name: '分组筛选', exact: true }).selectOption('tech')
  await app.getByRole('textbox', { name: 'RSS 搜索', exact: true }).fill('部署')
  expect(url(page).searchParams.has('ll_c19_group')).toBe(false)
  expect(url(page).searchParams.get('ll_c19_page')).toBe('2')
  await expect(app.getByTestId('c19-draft-state')).toContainText('未应用')
  await app.getByRole('button', { name: '应用筛选', exact: true }).click()
  await expect.poll(() => url(page).searchParams.get('ll_c19_q')).toBe('部署')
  expect(url(page).searchParams.get('ll_c19_group')).toBe('tech')
  expect(url(page).searchParams.has('ll_c19_page')).toBe(false)
  expect((await model(app)).safe).toEqual({ query: '部署', group: 'tech', page: 1 })
  await expect(app.getByTestId('c19-result-row')).toHaveCount(1)
  await expect(app.locator('[data-feed-id="rss-002"]')).toBeVisible()
  await expect(app.getByRole('button', { name: '下一页', exact: true })).toBeDisabled()
  expect(await historyLength(page)).toBe(before)
  await hostKeys(page, 'business')
  await app.getByRole('textbox', { name: 'RSS 搜索', exact: true }).fill('没有此订阅')
  await app.getByRole('button', { name: '应用筛选', exact: true }).click()
  await expect(app.getByTestId('c19-empty')).toBeVisible()
  await expect(app.getByTestId('c19-result-row')).toHaveCount(0)
  await expect(app.getByRole('button', { name: '上一页', exact: true })).toBeDisabled()
  await expect(app.getByRole('button', { name: '下一页', exact: true })).toBeDisabled()
  await app.getByRole('button', { name: '清除实验参数', exact: true }).click()
  await expect.poll(() => url(page).searchParams.has('ll_c19_q')).toBe(false)
  await expect(app.getByTestId('c19-result-row')).toHaveCount(2)
  expect((await model(app)).pageCount).toBe(3)
})

test('@C19 real push/replace history restores Back/Forward; raw deep-link parse differs from business clamping and survives remount', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  let app = await open(page, 'advanced', '&host_multi=a&host_multi=b#anchor')
  const before = await historyLength(page)
  for (const value of ['2', '3']) {
    await app.getByRole('button', { name: '下一页', exact: true }).click()
    await expect.poll(() => url(page).searchParams.get('ll_c19_page')).toBe(value)
  }
  expect(await historyLength(page)).toBe(before + 2)
  expect((await model(app)).router.host_multi).toEqual(['a', 'b'])
  expect(url(page).hash).toBe('#anchor')
  await page.goBack()
  await expect.poll(() => url(page).searchParams.get('ll_c19_page')).toBe('2')
  await expect(app.getByTestId('c19-page')).toHaveText('第 2 / 3 页')
  await page.goForward()
  await expect.poll(() => url(page).searchParams.get('ll_c19_page')).toBe('3')
  await app.getByRole('textbox', { name: 'RSS 搜索', exact: true }).fill('React')
  await app.getByRole('button', { name: '应用筛选', exact: true }).click()
  await expect.poll(() => url(page).searchParams.get('ll_c19_q')).toBe('React')
  expect(url(page).searchParams.has('ll_c19_page')).toBe(false)
  expect(await historyLength(page)).toBe(before + 2) // search's page reset must not inherit push.
  await page.goBack()
  await expect.poll(() => url(page).searchParams.get('ll_c19_page')).toBe('2')
  await expect(app.getByRole('textbox', { name: 'RSS 搜索', exact: true })).toHaveValue('')
  await page.goForward()
  await expect.poll(() => url(page).searchParams.get('ll_c19_q')).toBe('React')
  await expect(app.getByRole('textbox', { name: 'RSS 搜索', exact: true })).toHaveValue('React')
  await app.getByRole('button', { name: '清除实验参数', exact: true }).click()
  await expect.poll(() => url(page).searchParams.has('ll_c19_q')).toBe(false)
  for (const [value, parsed, safe] of [
    ['abc', 1, 1],
    ['99', 99, 3],
    ['2tail', 2, 2],
  ] as const) {
    await app.getByRole('link', { name: `打开 page=${value} 深链接`, exact: true }).click()
    app = await ready(page, 'advanced')
    await expect.poll(async () => (await model(app)).sdk.page).toBe(parsed)
    expect((await model(app)).safe.page).toBe(safe)
    expect(url(page).searchParams.get('ll_c19_page')).toBe(value) // no silent canonical rewrite.
    await hostKeys(page, 'advanced')
    expect((await model(app)).router.host_multi).toEqual(['a', 'b'])
    expect(url(page).hash).toBe('#anchor')
  }
  await page.setViewportSize({ width: 390, height: 1050 })
  expect(await app.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
  const editor = app.getByRole('textbox', { name: 'RSS 搜索', exact: true })
  await editor.fill('未应用草稿')
  const old = await editor.elementHandle()
  if (!old) throw new Error('Missing owned editor')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  expect(await old.evaluate((element) => element.isConnected)).toBe(false)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(editor).toHaveValue('')
  expect((await model(app)).sdk.page).toBe(2)
  expect(url(page).searchParams.get('ll_c19_page')).toBe('2tail')
  expect((await model(app)).router.host_multi).toEqual(['a', 'b'])
  expect(url(page).hash).toBe('#anchor')
  expect(errors).toEqual([])
})
