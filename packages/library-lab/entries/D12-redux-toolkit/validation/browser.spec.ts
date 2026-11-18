import { expect, test } from '@playwright/test'

test('@D12 action updates and independent team stores retain stable-ID read state', async ({
  page,
}) => {
  await page.goto('/libraries/redux-toolkit?tab=demo&example=basic')
  const app = page.getByRole('region', { name: 'Redux Toolkit真实store演示', exact: true })
  await app.getByRole('button', { name: '计数 +1', exact: true }).click()
  await expect(app.getByTestId('redux-state')).toContainText('计数 1')
  await app.getByRole('button', { name: '只重置当前工作区', exact: true }).click()
  await expect(app.getByTestId('redux-state')).toContainText('计数 0')
  await page.goto('/libraries/redux-toolkit?tab=demo&example=business')
  await app.getByRole('button', { name: '增加频道', exact: true }).click()
  const feed = app.getByRole('checkbox', { name: '新闻源 A-1', exact: true })
  await feed.check()
  await app.getByLabel('当前工作区').selectOption('B')
  await expect(app.getByRole('checkbox')).toHaveCount(0)
  await app.getByRole('button', { name: '计数 +1', exact: true }).click()
  await expect(app.getByTestId('redux-state')).toContainText('当前 B 计数 1')
  await app.getByLabel('当前工作区').selectOption('A')
  await expect(feed).toBeChecked()
  await expect(app.getByTestId('redux-state')).toContainText('计数 0')
})

test('@D12 latest identity wins and reset clears outstanding timers', async ({ page }) => {
  await page.goto('/libraries/redux-toolkit?tab=demo&example=advanced')
  const app = page.getByRole('region', { name: 'Redux Toolkit真实store演示', exact: true })
  const run = app.getByRole('button', { name: '模拟先后返回的两个请求', exact: true })
  const race = app.getByTestId('redux-race')
  await run.click()
  await expect(app.getByTestId('redux-request-plan')).toContainText('A-old-1')
  await expect(race).toContainText('已忽略过期响应：1')
  await expect(race).toContainText('最后结果：新请求已采用')
  await expect(race).not.toContainText('旧请求不该覆盖')
  await run.click()
  await app.getByRole('button', { name: '只重置当前工作区', exact: true }).click()
  await page.waitForTimeout(1150)
  await expect(race).toContainText('最后结果：待运行；已忽略过期响应：0；活跃请求：无')
})

test('@D12 switching teams cancels previous team fixture callbacks', async ({ page }) => {
  await page.goto('/libraries/redux-toolkit?tab=demo&example=advanced')
  const app = page.getByRole('region', { name: 'Redux Toolkit真实store演示', exact: true })
  await app.getByRole('button', { name: '模拟先后返回的两个请求', exact: true }).click()
  await app.getByLabel('当前工作区').selectOption('B')
  await page.waitForTimeout(1150)
  await expect(app.getByTestId('redux-race')).toContainText(
    '最后结果：待运行；已忽略过期响应：0；活跃请求：无',
  )
  await app.getByLabel('当前工作区').selectOption('A')
  await expect(app.getByTestId('redux-race')).toContainText(
    '最后结果：待运行；已忽略过期响应：0；活跃请求：无',
  )
})
