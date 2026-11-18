// Root integration proposal. Author browser NOT_RUN; actual JSONForms/Vanilla/Ajv and real clocks.
// Composition dispatch is only an explicit application event-protocol guard, not OS IME coverage.
import { expect, type Locator, type Page, test } from '@playwright/test'

type Level = 'basic' | 'business' | 'advanced'
async function open(page: Page, level: Level, viaAgent = false) {
  await page.setViewportSize({ width: 1100, height: 1000 })
  await page.goto(`/libraries/jsonforms?tab=${viaAgent ? 'agent' : 'demo'}&example=${level}`)
  if (viaAgent) await page.getByRole('tab', { name: '实战 Demo', exact: true }).click()
  const app = page.getByTestId('c04-workshop')
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  await expect(app.or(run).first()).toBeVisible({ timeout: 20_000 })
  if (await run.isVisible()) await run.click()
  await expect(app).toHaveAttribute('data-level', level)
  await expect(app.getByTestId('c04-schema-errors')).toHaveText('SDK Schema 错误数：0')
  if (level !== 'basic') await app.getByText('查看最终 payload', { exact: true }).click()
  return app
}
async function object(app: Locator, id: string): Promise<Record<string, unknown>> {
  const value: unknown = JSON.parse((await app.getByTestId(id).textContent()) ?? 'null')
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Missing actual UI object')
  return Object.fromEntries(Object.entries(value))
}
function name(app: Locator) {
  return app.getByRole('textbox', { name: /^订阅名称/ })
}
function url(app: Locator) {
  return app.getByRole('textbox', { name: /^RSS 地址/ })
}
function save(app: Locator) {
  return app.getByRole('button', { name: '保存内存草稿', exact: true })
}
async function payloadName(app: Locator, value: string) {
  await expect.poll(async () => (await object(app, 'c04-payload')).name).toBe(value)
}
async function count(app: Locator) {
  return Number((await app.getByTestId('c04-request-count').textContent())?.match(/：(\d+)/)?.[1])
}

test('@C04 actual Vanilla cells, label association and debounced SDK change/validation output', async ({
  page,
}) => {
  const app = await open(page, 'basic')
  const title = app.getByRole('textbox', { name: /^工作区名称/ })
  await expect(title).toHaveValue('Library Lab')
  await expect(app.getByTestId('c04-notifications')).toHaveText(/：[1-9]\d* 次/)
  await title.fill('a')
  await expect.poll(async () => (await object(app, 'c04-draft')).name).toBe('a')
  await expect(app.getByTestId('c04-schema-errors')).toHaveText(/：[1-9]\d*$/)
  await expect(app.locator('.validation_error')).toBeVisible()
  await title.fill('新的工作区')
  await expect(app.getByTestId('c04-schema-errors')).toHaveText('SDK Schema 错误数：0')
  await app.getByRole('checkbox', { name: /^启用/ }).uncheck()
  await expect.poll(async () => (await object(app, 'c04-draft')).enabled).toBe(false)
  await expect(title).toHaveValue('新的工作区')
})

test('@C04 real HIDE keeps the input/data while the explicit submitted payload omits URL', async ({
  page,
}) => {
  const app = await open(page, 'business')
  const rss = url(app)
  const held = await rss.elementHandle()
  if (!held) throw new Error('Missing actual RSS input')
  await name(app).fill('  Manual Weekly  ')
  await app.getByRole('combobox', { name: /^订阅类型/ }).selectOption('manual')
  await expect.poll(async () => (await object(app, 'c04-payload')).feedType).toBe('manual')
  expect(await object(app, 'c04-payload')).toEqual({
    name: 'Manual Weekly',
    feedType: 'manual',
    enabled: true,
  })
  expect(
    await held.evaluate((node) => ({
      connected: node.isConnected,
      hidden: Boolean(node.closest('[hidden]')),
      value: node instanceof HTMLInputElement ? node.value : null,
    })),
  ).toEqual({ connected: true, hidden: true, value: 'https://example.org/feed.xml' })
  await expect(rss).toBeHidden()
  await expect(save(app)).toBeEnabled()
  await save(app).click()
  expect(await object(app, 'c04-submitted')).toEqual({
    name: 'Manual Weekly',
    feedType: 'manual',
    enabled: true,
  })
  await expect(app.getByTestId('c04-status')).toContainText('保存成功')
  await expect(name(app)).toHaveValue('  Manual Weekly  ')
  await app.getByRole('combobox', { name: /^订阅类型/ }).selectOption('rss')
  await expect(rss).toBeVisible()
  await expect(rss).toHaveValue('https://example.org/feed.xml')
  await rss.fill('http://example.org/feed')
  await expect(app.getByTestId('c04-schema-errors')).toHaveText(/：[1-9]\d*$/)
  await expect(save(app)).toBeDisabled()
  await rss.fill('https://example.org/feed.xml')
  await expect(app.getByTestId('c04-schema-errors')).toHaveText('SDK Schema 错误数：0')
  await expect(save(app)).toBeEnabled()
  await save(app).click()
  await expect(app.getByTestId('c04-status')).toContainText('保存成功')
  expect((await object(app, 'c04-submitted')).url).toBe('https://example.org/feed.xml')
})

test('@C04 additionalErrors, snapshot cancellation/reset, composition guard and pending provider unmount', async ({
  page,
}) => {
  const errors: string[] = []
  const feedRequests: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => {
    if (new URL(request.url()).hostname === 'example.org') feedRequests.push(request.url())
  })
  const app = await open(page, 'advanced', true)
  await name(app).fill('duplicate')
  await payloadName(app, 'duplicate')
  await save(app).click()
  await expect(app.getByTestId('c04-status')).toContainText('模拟 409')
  await expect(app.locator('.validation_error').filter({ hasText: '该订阅名已存在' })).toBeVisible()
  await expect(app.getByTestId('c04-schema-errors')).toHaveText('SDK Schema 错误数：0')
  await expect(app.getByTestId('c04-server-errors')).toHaveText('模拟服务字段错误：1')
  await expect(save(app)).toBeEnabled()
  await page.waitForTimeout(80) // Beyond the SDK10ms callback; errors-only updates must not erase server feedback.
  await expect(app.getByTestId('c04-server-errors')).toHaveText('模拟服务字段错误：1')
  await name(app).fill('Recovered')
  await payloadName(app, 'Recovered')
  await expect(app.getByTestId('c04-server-errors')).toHaveText('模拟服务字段错误：0')
  await url(app).fill('https://user:password@example.org/feed')
  await expect
    .poll(async () => (await object(app, 'c04-payload')).url)
    .toBe('https://user:password@example.org/feed')
  await expect(app.getByTestId('c04-schema-errors')).toHaveText('SDK Schema 错误数：0')
  await save(app).click()
  await expect(app.getByTestId('c04-status')).toContainText('模拟 422')
  await expect(app.locator('.validation_error').filter({ hasText: '无凭据、无片段' })).toBeVisible()
  await url(app).fill('https://example.org/feed.xml')
  await name(app).fill('duplicate')
  await payloadName(app, 'duplicate')
  await expect(save(app)).toBeEnabled()
  await save(app).click()
  expect((await object(app, 'c04-submitted')).name).toBe('duplicate')
  await name(app).fill('Fresh draft')
  await payloadName(app, 'Fresh draft')
  await expect(app).toHaveAttribute('data-saving', 'false')
  await expect(app.getByTestId('c04-submitted')).toHaveCount(0)
  await page.waitForTimeout(600) // Real time beyond old500ms; no fake clock.
  await expect(app.getByTestId('c04-status')).toContainText('SDK 已通知草稿变化')
  await expect(app.getByTestId('c04-server-errors')).toHaveText('模拟服务字段错误：0')
  await name(app).fill('duplicate')
  await payloadName(app, 'duplicate')
  await save(app).click()
  await app.getByRole('button', { name: '取消进行中的操作', exact: true }).click()
  await page.waitForTimeout(600)
  await expect(app.getByTestId('c04-status')).toHaveText('已取消，旧结果不会回写')
  await expect(app.getByTestId('c04-server-errors')).toHaveText('模拟服务字段错误：0')
  await save(app).click()
  const previous = await name(app).elementHandle()
  if (!previous) throw new Error('Missing old provider input')
  await app.getByRole('button', { name: '重置', exact: true }).click()
  await expect(name(app)).toHaveValue('Frontend Weekly')
  expect(await previous.evaluate((node) => node.isConnected)).toBe(false)
  await expect(app.getByTestId('c04-schema-errors')).toHaveText('SDK Schema 错误数：0')
  await page.waitForTimeout(600)
  await expect(app.getByTestId('c04-status')).toHaveText('已重置当前示例')
  const beforeIme = await count(app)
  await name(app).dispatchEvent('compositionstart', { data: '中' })
  await save(app).click()
  await expect(app.getByTestId('c04-status')).toContainText('请先完成中文输入法选词')
  expect(await count(app)).toBe(beforeIme)
  await name(app).dispatchEvent('compositionend', { data: '中' })
  await save(app).click()
  await expect(app.getByTestId('c04-status')).toContainText('保存成功')
  expect(await count(app)).toBe(beforeIme + 1)
  await page.setViewportSize({ width: 390, height: 980 })
  const bounds = await name(app).boundingBox()
  if (!bounds) throw new Error('Missing actual narrow input geometry')
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(391)
  await save(app).click()
  const pending = await name(app).elementHandle()
  if (!pending) throw new Error('Missing input before pending unmount')
  await page.goBack()
  await expect(app).toHaveCount(0)
  expect(await pending.evaluate((node) => node.isConnected)).toBe(false)
  await page.waitForTimeout(600)
  await page.goForward()
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  await expect(app.or(run).first()).toBeVisible()
  if (await run.isVisible()) await run.click()
  await expect(name(app)).toHaveValue('Frontend Weekly')
  await expect(app.getByTestId('c04-schema-errors')).toHaveText('SDK Schema 错误数：0')
  await expect(app.getByTestId('c04-server-errors')).toHaveText('模拟服务字段错误：0')
  expect(await count(app)).toBe(0)
  expect(feedRequests).toEqual([])
  expect(errors).toEqual([])
})
