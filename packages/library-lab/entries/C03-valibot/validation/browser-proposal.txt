// Root integration proposal, NOT_RUN by author. Real input/SDK output/issue paths; no validator mock.
import { expect, type Locator, type Page, test } from '@playwright/test'

async function open(page: Page, level: 'basic' | 'business' | 'advanced') {
  await page.setViewportSize({ width: 1280, height: 1400 })
  await page.goto(`/libraries/valibot?tab=demo&example=${level}`)
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  if (await run.isVisible()) await run.click()
  const app = page.getByTestId('c03-workshop')
  await expect(app).toBeVisible()
  return app
}
async function run(app: Locator) {
  await app.getByRole('button', { name: '运行 safeParse', exact: true }).click()
}
async function output(app: Locator): Promise<Record<string, unknown>> {
  await expect(app.getByTestId('c03-result')).toHaveAttribute('data-status', 'success')
  return JSON.parse(
    ((await app.getByTestId('valibot-output').textContent()) ?? '').replace(/^PASS:\s*/, ''),
  )
}
const path = (app: Locator, name: string) => app.getByRole('rowheader', { name, exact: true })

test('@C03 real single-source transformation, multiple issues, JSON syntax and recoverable stale results', async ({
  page,
}) => {
  const app = await open(page, 'basic')
  const input = app.getByRole('textbox', { name: '输入 JSON', exact: true })
  await expect(app.getByTestId('c03-result')).toHaveAttribute('data-status', 'idle')
  await run(app)
  expect(await output(app)).toEqual({
    name: '前端工程',
    url: 'https://example.com/Feed?q=A#section',
    category: 'tech',
  })
  await app.getByRole('button', { name: '载入字段错误', exact: true }).click()
  await expect(app.getByTestId('c03-result')).toHaveAttribute('data-status', 'idle')
  await run(app)
  await expect(app.getByTestId('c03-result')).toHaveAttribute('data-status', 'schema')
  await expect(app.getByTestId('c03-issues').locator('tbody tr')).toHaveCount(3)
  for (const field of ['name', 'url', 'category']) await expect(path(app, field)).toBeVisible()
  await expect(app.getByTestId('c03-issues')).toContainText('仅允许无凭据的 HTTPS 完整地址')
  await input.fill('{')
  await expect(app.getByTestId('c03-result')).toHaveAttribute('data-status', 'dirty')
  await expect(app.getByTestId('c03-issues')).toHaveCount(0)
  await run(app)
  await expect(app.getByTestId('c03-result')).toHaveAttribute('data-status', 'json')
  await expect(app.getByTestId('valibot-output')).toContainText('尚未运行 safeParse')
  await app.getByRole('button', { name: '恢复示例', exact: true }).click()
  await run(app)
  expect((await output(app)).name).toBe('前端工程')
})

test('@C03 actual shared Batch schema exposes nested paths and both collection bounds', async ({
  page,
}) => {
  const app = await open(page, 'business')
  await run(app)
  const initial = await output(app)
  expect(initial.owner).toBe('新闻项目')
  expect(initial.feeds).toHaveLength(2)
  await app.getByRole('button', { name: '载入批量错误', exact: true }).click()
  await run(app)
  await expect(path(app, 'owner')).toBeVisible()
  await expect(path(app, 'feeds.1.url')).toBeVisible()
  await expect(app.getByTestId('c03-issues').locator('tbody tr')).toHaveCount(2)
  await app.getByRole('button', { name: '载入超量批次', exact: true }).click()
  await run(app)
  await expect(path(app, 'feeds')).toBeVisible()
  await expect(app.getByTestId('c03-issues')).toContainText('一次最多导入3个RSS源')
  await app
    .getByRole('textbox', { name: '输入 JSON', exact: true })
    .fill(JSON.stringify({ owner: '新闻项目', feeds: [] }))
  await run(app)
  await expect(path(app, 'feeds')).toBeVisible()
  await expect(app.getByTestId('c03-issues')).toContainText('至少选择一个RSS源')
  await app.getByRole('button', { name: '恢复示例', exact: true }).click()
  await run(app)
  expect((await output(app)).feeds).toHaveLength(2)
})

test('@C03 real end-date validation, partialCheck despite unrelated type failure, mobile and clean remount', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const app = await open(page, 'advanced')
  await run(app)
  await expect(path(app, 'end')).toBeVisible()
  await expect(app.getByTestId('c03-issues')).toContainText('结束日期不能早于开始日期')
  await app.getByRole('button', { name: '载入非法结束日', exact: true }).click()
  await run(app)
  await expect(app.getByTestId('c03-result')).toHaveAttribute('data-status', 'schema')
  await expect(path(app, 'end')).toBeVisible()
  await expect(app.getByTestId('c03-issues')).toContainText('不存在的公历日期')
  await expect(app.getByTestId('c03-issues')).not.toContainText('结束日期不能早于开始日期')
  await app.getByRole('button', { name: '载入联合错误', exact: true }).click()
  await run(app)
  await expect(app.getByTestId('c03-issues').locator('tbody tr')).toHaveCount(2)
  for (const field of ['note', 'end']) await expect(path(app, field)).toBeVisible()
  await expect(app.getByTestId('c03-issues')).toContainText('说明必须是文本')
  await expect(app.getByTestId('c03-issues')).toContainText('结束日期不能早于开始日期')
  await app.getByRole('button', { name: '载入合法区间', exact: true }).click()
  await run(app)
  expect(await output(app)).toEqual({ start: '2024-02-29', end: '2024-03-01', note: '闰日发布' })
  await page.setViewportSize({ width: 390, height: 980 })
  await app.getByRole('button', { name: '载入联合错误', exact: true }).click()
  await run(app)
  const box = await app.boundingBox()
  if (!box) throw new Error('Missing actual narrow layout')
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(391)
  expect(await app.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
  const old = await app.elementHandle()
  if (!old) throw new Error('Missing actual mounted validator UI')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  expect(await old.evaluate((node) => node.isConnected)).toBe(false)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(app.getByTestId('c03-result')).toHaveAttribute('data-status', 'idle')
  await expect(app.getByTestId('c03-issues')).toHaveCount(0)
  await run(app)
  await expect(app.getByTestId('c03-issues').locator('tbody tr')).toHaveCount(1)
  await expect(path(app, 'end')).toBeVisible()
  expect(errors).toEqual([])
})
// Remaining NOT_RUN: actual OS IME/caret, screen-reader announcements and SSR hydration.
// No async/network cancellation or persistent import is implemented; do not infer it from these cases.
