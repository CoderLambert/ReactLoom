import { expect, test } from '@playwright/test'

test('@D04 concurrency and actual start timestamps expose strict rate and priority', async ({
  page,
}) => {
  await page.goto('/libraries/p-queue?tab=demo&example=business')
  const app = page.getByRole('region', { name: 'p-queue 实战队列', exact: true })
  await app.getByRole('button', { name: '启动批次', exact: true }).click()
  await expect(app.getByRole('status')).toContainText('12 成功 / 0 拒绝', { timeout: 15000 })
  const cards = app.locator('.demo-job')
  await expect(app.locator('.demo-job[data-state="done"]')).toHaveCount(12)
  const starts = await cards.locator('small').allTextContents()
  const parsed = starts.map((text) => {
    const match = text.match(/#(\d+) · \+(\d+)ms/u)
    if (!match) throw new Error(`Missing start timestamp: ${text}`)
    return { order: Number(match[1]), time: Number(match[2]) }
  })
  expect(parsed[7].order).toBe(3)
  const sorted = [...parsed].sort((a, b) => a.order - b.order)
  for (let index = 3; index < sorted.length; index++) {
    expect(sorted[index].time - sorted[index - 3].time).toBeGreaterThanOrEqual(598)
  }
  await expect(app).toContainText('当前运行 0 · 等待 0 · 峰值 2')
})

test('@D04 pause prevents starts, resume settles and cancellation cleans both groups', async ({
  page,
}) => {
  await page.goto('/libraries/p-queue?tab=demo&example=advanced')
  const app = page.getByRole('region', { name: 'p-queue 实战队列', exact: true })
  await app.getByRole('button', { name: '启动批次', exact: true }).click()
  await app.getByRole('button', { name: '暂停新任务', exact: true }).click()
  const started = await app.locator('.demo-job small').count()
  // Bounded observation of the paused queue; running jobs may finish.
  await page.waitForTimeout(700)
  await expect(app.locator('.demo-job small')).toHaveCount(started)
  await app.getByRole('button', { name: '恢复排队', exact: true }).click()
  await expect(app.getByRole('status')).toContainText('11 成功 / 1 拒绝', { timeout: 15000 })
  await expect(app.locator('.demo-job[data-state="failed"]')).toHaveCount(1)
  await app.getByRole('button', { name: '启动批次', exact: true }).click()
  await app.getByRole('button', { name: '取消任务', exact: true }).click()
  await expect(app.getByRole('status')).toContainText('取消完成')
  await expect(
    app.locator('.demo-job[data-state="running"], .demo-job[data-state="queued"]'),
  ).toHaveCount(0)
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(app).toContainText('尚未运行')
})

test('@D04 basic concurrency runs seven jobs with the selected three slots', async ({ page }) => {
  await page.goto('/libraries/p-queue?tab=demo&example=basic')
  const app = page.getByRole('region', { name: 'p-queue 实战队列', exact: true })
  await app.getByRole('combobox', { name: '最大并发' }).selectOption('3')
  await app.getByRole('button', { name: '启动批次', exact: true }).click()
  await expect(app.getByRole('status')).toContainText('7 成功 / 0 拒绝')
  await expect(app.locator('.demo-job[data-state="done"]')).toHaveCount(7)
  await expect(app).toContainText('当前运行 0 · 等待 0 · 峰值 3')
})
