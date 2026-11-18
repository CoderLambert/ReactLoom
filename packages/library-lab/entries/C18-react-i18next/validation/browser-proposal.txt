// Root integration proposal. Author real browser NOT_RUN.
// Real Provider/useTranslation/Trans and SDK language events. Promise gate is an explicit local fixture.
import { expect, type Locator, type Page, test } from '@playwright/test'

type View = {
  ready: boolean
  actual: string
  requested: string
  committed: string
  activeTarget: string | null
  awaitingRelease: boolean
  manual: boolean
  status: string
  events: number
  error: string
}
async function state(panel: Locator): Promise<View> {
  return JSON.parse((await panel.getByTestId('c18-state').textContent()) || 'null') as View
}
async function open(page: Page, level: 'basic' | 'business' | 'advanced') {
  await page.goto('/libraries/react-i18next?tab=demo&example=' + level)
  const app = page.getByTestId('c18-workshop')
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  await expect(app.or(run).first()).toBeVisible()
  if (await run.isVisible()) await run.click()
  await expect(app).toHaveAttribute('data-level', level)
  const a = app.getByRole('article', { name: '工作区 A翻译面板', exact: true })
  await expect.poll(async () => (await state(a)).status).toBe('ready')
  return { app, a }
}

test('@C18 useTranslation reacts to real original-instance language events and plural input', async ({
  page,
}) => {
  const { app, a } = await open(page, 'basic')
  await expect(a.getByRole('heading')).toHaveText('工作区 A · 订阅偏好')
  await expect(a.getByTestId('c18-unread')).toHaveText('关注的频道 · 未读 2 条')
  await expect(a.getByRole('textbox')).toHaveCount(0)
  const before = (await state(a)).events
  await a.getByLabel('工作区 A语言', { exact: true }).selectOption('en')
  await expect(a.getByRole('heading')).toHaveText('工作区 A · Subscription preferences')
  await expect.poll(async () => (await state(a)).status).toBe('ready')
  expect((await state(a)).actual).toBe('en')
  expect((await state(a)).events).toBeGreaterThan(before)
  const count = a.getByLabel('工作区 A未读数量', { exact: true })
  await count.fill('1')
  await expect(a.getByTestId('c18-unread')).toHaveText('Followed feeds · 1 unread story')
  await count.fill('2')
  await expect(a.getByTestId('c18-unread')).toHaveText('Followed feeds · 2 unread stories')
  await a.getByLabel('工作区 A语言', { exact: true }).selectOption('zh')
  await expect(a.getByRole('heading')).toHaveText('工作区 A · 订阅偏好')
  await app.getByRole('button', { name: '重置当前演示', exact: true }).click()
  await expect(count).toHaveValue('2')
  await expect.poll(async () => (await state(a)).status).toBe('ready')
  expect((await state(a)).actual).toBe('zh')
})

test('@C18 namespace text and named Trans component remain React-owned while user text stays literal', async ({
  page,
}) => {
  const { a } = await open(page, 'business')
  const emphasis = a.getByTestId('c18-emphasis')
  await expect(emphasis).toHaveText('隐私说明')
  expect(await emphasis.evaluate((element) => element.tagName)).toBe('STRONG')
  const payload = '<img src=x onerror=alert(1)> & Ada'
  await a.getByLabel('工作区 A用户昵称', { exact: true }).fill(payload)
  await expect(a.getByTestId('c18-greeting')).toHaveText('你好，' + payload)
  await expect(a.locator('img,script,iframe,a')).toHaveCount(0)
  await a.getByLabel('工作区 A语言', { exact: true }).selectOption('en')
  await expect(a.getByTestId('c18-greeting')).toHaveText('Hello, ' + payload)
  await expect(a.getByTestId('c18-legal')).toHaveText('Read the privacy notice.')
  await expect(emphasis).toHaveText('privacy notice')
  await expect(a.locator('strong')).toHaveCount(1)
  await expect(a.locator('img,script,iframe,a')).toHaveCount(0)
  await a.getByLabel('工作区 A用户昵称', { exact: true }).fill('Ada')
  await expect(a.getByTestId('c18-greeting')).toHaveText('Hello, Ada')
})

test('@C18 stable Provider queue survives hook wrapper changes, isolates tenants and disposes held local work', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const { app, a } = await open(page, 'advanced')
  const b = app.getByRole('article', { name: '工作区 B翻译面板', exact: true })
  await expect.poll(async () => (await state(b)).actual).toBe('en')
  const bBefore = await state(b)
  await expect(a).toContainText('（等待本地化）')
  await a.getByLabel('工作区 A手动放行切换', { exact: true }).check()
  await a.getByLabel('工作区 A语言', { exact: true }).selectOption('en')
  await expect.poll(async () => (await state(a)).awaitingRelease).toBe(true)
  await a.getByLabel('工作区 A语言', { exact: true }).selectOption('zh')
  expect(await state(a)).toMatchObject({
    actual: 'zh',
    requested: 'zh',
    activeTarget: 'en',
    status: 'switching',
  })
  await a.getByRole('button', { name: '放行在途切换', exact: true }).click()
  await expect.poll(async () => (await state(a)).activeTarget).toBe('zh')
  expect(await state(a)).toMatchObject({
    actual: 'en',
    requested: 'zh',
    awaitingRelease: true,
    status: 'switching',
  })
  // The real hook must rerender on the first actual event without disposing the Provider-owned queue.
  await expect(a.getByRole('heading')).toHaveText('工作区 A · Subscription preferences')
  await a.getByRole('button', { name: '放行在途切换', exact: true }).click()
  await expect.poll(async () => (await state(a)).status).toBe('ready')
  expect(await state(a)).toMatchObject({ actual: 'zh', requested: 'zh', committed: 'zh' })
  await expect(a.getByRole('heading')).toHaveText('工作区 A · 订阅偏好')
  expect(await state(b)).toEqual(bBefore)
  await a.getByLabel('工作区 A语言', { exact: true }).selectOption('en')
  await expect.poll(async () => (await state(a)).awaitingRelease).toBe(true)
  await a.getByRole('button', { name: '拒绝在途切换', exact: true }).click()
  await expect(a.getByRole('alert')).toContainText('本地 fixture 拒绝')
  expect((await state(a)).actual).toBe('zh')
  await expect(b.getByRole('alert')).toHaveCount(0)
  await a.getByRole('button', { name: '重试最新选择', exact: true }).click()
  await a.getByLabel('工作区 A手动放行切换', { exact: true }).uncheck()
  await expect.poll(async () => (await state(a)).status).toBe('ready')
  expect((await state(a)).actual).toBe('en')
  await expect(a.getByRole('alert')).toHaveCount(0)

  await a.getByLabel('工作区 A手动放行切换', { exact: true }).check()
  await a.getByLabel('工作区 A语言', { exact: true }).selectOption('zh')
  await expect.poll(async () => (await state(a)).awaitingRelease).toBe(true)
  const previous = await a.elementHandle()
  if (!previous) throw new Error('Missing actual old workspace')
  await app.getByRole('button', { name: '重置当前演示', exact: true }).click()
  expect(await previous.evaluate((element) => element.isConnected)).toBe(false)
  await expect.poll(async () => (await state(a)).status).toBe('ready')
  expect(await state(a)).toMatchObject({
    actual: 'zh',
    requested: 'zh',
    manual: false,
    awaitingRelease: false,
  })
  expect((await state(b)).actual).toBe('en')
  await page.setViewportSize({ width: 390, height: 844 })
  await expect
    .poll(() => app.evaluate((element) => element.scrollWidth <= element.clientWidth + 1))
    .toBe(true)
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect.poll(async () => (await state(a)).status).toBe('ready')
  expect(await state(a)).toMatchObject({ actual: 'zh', manual: false, awaitingRelease: false })
  expect(errors).toEqual([])
})
