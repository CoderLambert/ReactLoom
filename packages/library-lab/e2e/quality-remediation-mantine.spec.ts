// Root integration proposal, NOT_RUN by entry author.
// Real Mantine Provider/Portal/NumberInput/hooks/native events. No SDK mock, env=test or fake timer output.
import { expect, type Locator, type Page, test } from '@playwright/test'

async function open(page: Page, level: 'basic' | 'business' | 'advanced', viaAgent = false) {
  await page.setViewportSize({ width: 1100, height: 1000 })
  await page.goto(`/libraries/mantine?tab=${viaAgent ? 'agent' : 'demo'}&example=${level}`)
  if (viaAgent) await page.getByRole('tab', { name: '实战 Demo', exact: true }).click()
  const app = page.getByTestId('b08-workshop')
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  await expect(app.or(run).first()).toBeVisible({ timeout: 20_000 })
  if (await run.isVisible()) await run.click()
  await expect(app).toBeVisible()
  return app
}
function row(app: Locator, id: string) {
  return app.getByTestId('b08-table').locator(`tr[data-feed-id="${id}"]`)
}

test('@B08 actual scoped theme and controlled confirmation do not mutate the document color-scheme attribute', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1100, height: 1000 })
  await page.goto('/libraries/mantine?tab=agent&example=basic')
  await expect(page.getByRole('tab', { name: '实战 Demo', exact: true })).toBeVisible()
  const previous = await page.evaluate(() =>
    document.documentElement.getAttribute('data-mantine-color-scheme'),
  )
  await page.getByRole('tab', { name: '实战 Demo', exact: true }).click()
  const app = page.getByTestId('b08-workshop')
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  await expect(app.or(run).first()).toBeVisible({ timeout: 20_000 })
  if (await run.isVisible()) await run.click()
  const root = page.getByRole('region', { name: 'Mantine 真实组件与状态演示', exact: true })
  await expect(root).toHaveAttribute('data-mantine-color-scheme', 'light')
  expect(
    await page.evaluate(() => document.documentElement.getAttribute('data-mantine-color-scheme')),
  ).toBe(previous)
  const input = app.getByRole('textbox', { name: '工作区', exact: true })
  const confirm = app.getByRole('button', { name: '确认工作区', exact: true })
  await input.focus()
  await expect(confirm).toHaveCSS('background-color', 'rgb(18, 184, 134)')
  await input.fill('   ')
  await expect(confirm).toBeDisabled()
  await input.fill('  学习空间  ')
  await confirm.focus()
  await page.keyboard.press('Enter')
  await expect(app.locator('[role="status"]')).toContainText('本地工作区：学习空间')
  await input.fill('新草稿')
  await expect(app.locator('[role="status"]')).toHaveCount(0)
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  expect(
    await page.evaluate(() => document.documentElement.getAttribute('data-mantine-color-scheme')),
  ).toBe(previous)
})

test('@B08 real debounced filtering preserves stable rows and one-step Switch undo', async ({
  page,
}) => {
  const app = await open(page, 'business')
  await expect(app.getByTestId('b08-table').locator('tbody tr')).toHaveCount(3)
  const held = await row(app, 'frontend').elementHandle()
  if (!held) throw new Error('Real row missing')
  const enabled = row(app, 'frontend').getByRole('switch', { name: '前端实践 状态', exact: true })
  await expect(enabled).toBeChecked()
  await enabled.focus()
  await page.keyboard.press('Space')
  await expect(row(app, 'frontend')).toHaveAttribute('data-enabled', 'false')
  const undo = app.getByRole('button', { name: '撤销上一次', exact: true })
  await expect(undo).toBeEnabled()
  await undo.click()
  await expect(enabled).toBeChecked()
  await expect(undo).toBeDisabled()
  expect(await held.evaluate((node) => node.isConnected)).toBe(true)
  const filter = app.getByRole('textbox', { name: '筛选订阅', exact: true })
  await filter.fill('AI')
  await expect(app.getByTestId('b08-filter-draft')).toHaveText('AI')
  await expect(app.getByTestId('b08-filter-applied')).toHaveText('AI')
  await expect(app.getByTestId('b08-count')).toContainText('1/3')
  await expect(row(app, 'ai')).toHaveCount(1)
  await filter.fill('没有这条')
  await expect(app.getByTestId('b08-count')).toContainText('0/3')
  await expect(app.getByText('没有匹配订阅；清空筛选可恢复。', { exact: true })).toBeVisible()
  await filter.fill('')
  await expect(app.getByTestId('b08-count')).toContainText('3/3')
  // No precise 150ms paint claim; actual hook cancellation and filtering run in this browser.
  await filter.fill('待处理')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(app.getByTestId('b08-count')).toContainText('3/3')
  await expect(app.getByRole('textbox', { name: '筛选订阅', exact: true })).toHaveValue('')
})

test('@B08 real NumberInput preserves invalid drafts, commits valid quota and cleans an open Portal on SPA Back', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const app = await open(page, 'advanced', true)
  const opener = row(app, 'frontend').getByRole('button', {
    name: '编辑 前端实践 配额',
    exact: true,
  })
  const undo = app.getByRole('button', { name: '撤销上一次', exact: true })
  const dialog = page.getByRole('dialog', { name: '编辑配额：前端实践', exact: true })
  await expect(undo).toBeDisabled()
  await opener.click()
  await expect(dialog).toBeVisible()
  expect(await dialog.evaluate((node) => Boolean(node.closest('[data-b08-root]')))).toBe(true)
  expect(
    await dialog.evaluate((node) =>
      getComputedStyle(node).getPropertyValue('--mantine-primary-color-6').trim(),
    ),
  ).toBe('#12b886')
  const quota = dialog.getByLabel('每小时请求上限', { exact: true })
  await expect(quota).toHaveValue('15')
  // Same-value submit is a no-op and does not invent a history point.
  await dialog.getByRole('button', { name: '保存配额', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(undo).toBeDisabled()
  await expect(app.getByText('配额未变化，没有生成撤销点', { exact: true })).toBeVisible()
  await opener.click()
  for (const invalid of ['', '-', '0', '101', '1.5']) {
    await quota.fill(invalid)
    await expect(quota).toHaveValue(invalid)
    if (invalid === '' || invalid === '-')
      await expect(dialog.getByTestId('b08-quota-draft')).toContainText('string:')
    await dialog.getByRole('button', { name: '保存配额', exact: true }).click()
    await expect(dialog).toBeVisible()
    await expect(quota).toHaveAttribute('aria-invalid', 'true')
    await expect(dialog.getByRole('alert')).toContainText('配额未保存')
    await expect(row(app, 'frontend')).toHaveAttribute('data-quota', '15')
    await expect(undo).toBeDisabled()
  }
  await quota.fill('100')
  await quota.press('Enter')
  await expect(dialog).toBeHidden()
  await expect(row(app, 'frontend')).toHaveAttribute('data-quota', '100')
  await expect(opener).toBeFocused()
  await undo.click()
  await expect(row(app, 'frontend')).toHaveAttribute('data-quota', '15')
  await expect(undo).toBeDisabled()
  await opener.click()
  await quota.fill('55')
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()
  await opener.click()
  await expect(quota).toHaveValue('15')
  // Portal is truly open; browser Back changes the existing SPA route without reloading the document.
  await page.goBack()
  await expect(page).toHaveURL(/tab=agent/u)
  await expect(app).toHaveCount(0)
  await expect(dialog).toHaveCount(0)
  const again = await open(page, 'advanced')
  await expect(row(again, 'frontend')).toHaveAttribute('data-quota', '15')
  await expect(again.getByRole('button', { name: '撤销上一次', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(again).toHaveCount(0)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(errors).toEqual([])
})
// Still NOT_RUN: actual OS IME/touch/screen readers, full CSS isolation, SSR hydration, body scroll-lock census and performance.
