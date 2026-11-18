import { expect, test } from '@playwright/test'

test('@D13 shared subscribers reuse the actual query and refetch increments reads', async ({
  page,
}) => {
  await page.goto('/libraries/rtk-query?tab=demo&example=basic')
  const cache = page.getByTestId('d13-cache')
  await expect(page.getByTestId('d13-rows')).toContainText('科技日报')
  await expect(cache).toContainText('"team-a":1')
  await page.getByLabel('第二个相同参数订阅').check()
  await expect(page.getByTestId('d13-second')).toContainText('2 行')
  await expect(cache).toContainText('"team-a":1')
  await page.getByRole('button', { name: '重新获取本租户' }).click()
  await expect(cache).toContainText('"team-a":2')
})

test('@D13 tenant currentData safety and successful invalidation versus 409', async ({ page }) => {
  await page.goto('/libraries/rtk-query?tab=demo&example=advanced')
  const cache = page.getByTestId('d13-cache')
  const rows = page.getByTestId('d13-rows')
  await expect(rows).toContainText('科技日报')
  await rows.locator('li').filter({ hasText: '科技日报' }).getByRole('button').click()
  await expect(rows).toContainText('科技日报 — 暂停')
  await expect(cache).toContainText('"team-a":2')
  await page.getByRole('combobox', { name: '租户', exact: true }).selectOption('team-b')
  await expect(rows).not.toContainText('科技日报')
  await expect(rows).toContainText('只读受保护频道')
  await rows.locator('li').filter({ hasText: '只读受保护频道' }).getByRole('button').click()
  await expect(
    page.getByRole('region', { name: 'RTK Query 实际运行示例' }).getByRole('status'),
  ).toContainText('409')
  await expect(cache).toContainText('"team-b":1')
  await expect(rows).toContainText('只读受保护频道 — 启用')
  await page.getByRole('button', { name: '模拟慢传输' }).click()
  await rows.locator('li').filter({ hasText: '安全研究' }).getByRole('button').click()
  await page.getByRole('combobox', { name: '租户', exact: true }).selectOption('team-a')
  await expect(rows).toContainText('科技日报')
  await page.waitForTimeout(800)
  await expect(rows).toContainText('科技日报')
  await expect(rows).not.toContainText('安全研究')
  await expect(
    page.getByRole('region', { name: 'RTK Query 实际运行示例' }).getByRole('status'),
  ).not.toContainText('409')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(rows).toHaveCount(0)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(rows).toContainText('科技日报 — 启用')
})

test('@D13 business IME waits for committed search and empty results recover', async ({ page }) => {
  await page.goto('/libraries/rtk-query?tab=demo&example=business')
  const app = page.getByRole('region', { name: 'RTK Query 实际运行示例' })
  const input = app.getByRole('textbox', { name: '标题搜索' })
  const rows = app.getByTestId('d13-rows')
  await expect(rows).toContainText('科技日报')
  await input.dispatchEvent('compositionstart')
  await input.fill('不存在')
  await app.getByRole('button', { name: '应用搜索' }).click()
  await expect(rows).toContainText('科技日报')
  await input.dispatchEvent('compositionend')
  await app.getByRole('button', { name: '应用搜索' }).click()
  await expect(rows.locator('li')).toHaveCount(0)
  await input.fill('前端')
  await app.getByRole('button', { name: '应用搜索' }).click()
  await expect(rows).toContainText('前端精选')
  await expect(rows).not.toContainText('科技日报')
})
