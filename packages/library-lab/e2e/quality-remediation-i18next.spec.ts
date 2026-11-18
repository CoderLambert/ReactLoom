// Real core-i18next UI proposal. Local dictionaries are fixtures, not machine translation.
// No SDK/backend/clock/Intl/DOM replacement or direct handler invocation.
import { expect, type Locator, type Page, test } from '@playwright/test'

type Events = {
  sdkLanguageChanged: number
  sdkResourceAdded: number
  uiCommits: number
  lastLanguage: string | null
  lastResource: string | null
}
async function json<T>(locator: Locator): Promise<T> {
  return JSON.parse((await locator.textContent()) || 'null') as T
}
async function open(page: Page, level: 'basic' | 'business' | 'advanced') {
  await page.goto(`/libraries/i18next?tab=demo&example=${level}`)
  const app = page.getByTestId('c17-workshop')
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  await expect(app.or(run).first()).toBeVisible()
  if (await run.isVisible()) await run.click()
  await expect(app).toHaveAttribute('data-level', level)
  await expect(app).toHaveAttribute('data-ready', 'true')
  return app
}
async function language(app: Locator, value: 'zh' | 'en') {
  await app.getByRole('combobox', { name: '语言', exact: true }).selectOption(value)
  await expect(app).toHaveAttribute('data-language', value)
  await expect
    .poll(async () => (await json<{ pending: boolean }>(app.getByTestId('c17-language'))).pending)
    .toBe(false)
}

test('@C17 actual instance t resolves interpolation/plurals and escaped strings remain React text', async ({
  page,
}) => {
  const app = await open(page, 'basic')
  await expect(app.getByTestId('c17-welcome')).toHaveText('欢迎，开发者！')
  await expect(app.getByTestId('c17-plural')).toHaveText('共 2 条文章')
  await app.getByRole('textbox', { name: '昵称', exact: true }).fill('Ada')
  await language(app, 'en')
  await expect(app.getByTestId('c17-welcome')).toHaveText('Welcome, Ada!')
  const count = app.getByRole('spinbutton', { name: '文章数量', exact: true })
  await count.fill('1')
  await expect(app.getByTestId('c17-plural')).toHaveText('1 article')
  await count.fill('2')
  await expect(app.getByTestId('c17-plural')).toHaveText('2 articles')
  await app.getByRole('textbox', { name: '昵称', exact: true }).fill('<Ada>')
  // escapeValue:true yields literal entities at this text sink; it is not rich HTML rendering.
  await expect(app.getByTestId('c17-welcome')).toHaveText('Welcome, &lt;Ada&gt;!')
  await expect(app.getByTestId('c17-welcome').locator('*')).toHaveCount(0)
  await language(app, 'zh')
  await count.fill('0')
  await expect(app.getByTestId('c17-plural')).toHaveText('共 0 条文章')
  await app.getByRole('button', { name: '重置当前实例', exact: true }).click()
  await expect(app).toHaveAttribute('data-ready', 'true')
  await expect(app).toHaveAttribute('data-language', 'zh')
  await expect(app.getByRole('textbox', { name: '昵称', exact: true })).toHaveValue('开发者')
  await expect(count).toHaveValue('2')
})

test('@C17 actual resource bundle API publishes a local namespace and reset owns fresh dictionaries', async ({
  page,
}) => {
  const app = await open(page, 'business')
  await expect(app.getByTestId('c17-channel')).toHaveText('尚未添加本地channel词典')
  expect((await json<{ hasBundle: boolean }>(app.getByTestId('c17-resource'))).hasBundle).toBe(
    false,
  )
  const add = app.getByRole('button', { name: '加入本地channel词典', exact: true })
  await add.focus()
  await page.keyboard.press('Enter')
  await expect(app.getByTestId('c17-channel')).toHaveText('本地RSS频道配置')
  await expect
    .poll(async () => (await json<Events>(app.getByTestId('c17-events'))).sdkResourceAdded)
    .toBe(2)
  await expect(add).toBeDisabled()
  await language(app, 'en')
  await expect(app.getByTestId('c17-channel')).toHaveText('Local RSS channel settings')
  await expect(app.getByTestId('i18next-output')).toContainText('Technology · Refresh feeds')
  const old = await app.getByRole('textbox', { name: '昵称', exact: true }).elementHandle()
  if (!old) throw new Error('Missing actual input before new instance')
  const generation = await app.getAttribute('data-generation')
  await app.getByRole('button', { name: '重置当前实例', exact: true }).click()
  await expect(app).toHaveAttribute('data-ready', 'true')
  expect(await app.getAttribute('data-generation')).not.toBe(generation)
  expect(await old.evaluate((node) => node.isConnected)).toBe(false)
  await expect(app.getByTestId('c17-channel')).toHaveText('尚未添加本地channel词典')
  expect((await json<{ hasBundle: boolean }>(app.getByTestId('c17-resource'))).hasBundle).toBe(
    false,
  )
  expect((await json<Events>(app.getByTestId('c17-events'))).sdkResourceAdded).toBe(0)
  await expect(add).toBeEnabled()
})

test('@C17 actual fallback details and serial latest intent survive level/reset/unmount boundaries', async ({
  page,
}) => {
  let app = await open(page, 'basic')
  await language(app, 'en')
  await app.getByRole('textbox', { name: '昵称', exact: true }).fill('上一场景草稿')
  await page.getByRole('combobox', { name: '学习场景', exact: true }).selectOption('advanced')
  app = page.getByTestId('c17-workshop')
  await expect(app).toHaveAttribute('data-level', 'advanced')
  await expect(app).toHaveAttribute('data-ready', 'true')
  await expect(app).toHaveAttribute('data-language', 'zh')
  await expect(app.getByRole('textbox', { name: '昵称', exact: true })).toHaveValue('开发者')
  await expect(app.getByTestId('c17-editorial')).toHaveText('Editors pick')
  expect(await json(app.getByTestId('c17-fallback'))).toEqual(
    expect.objectContaining({ res: 'Editors pick', usedLng: 'en', usedNS: 'news' }),
  )
  await expect(app.getByTestId('c17-missing')).toHaveText('（未配置翻译）')
  const before = await json<Events>(app.getByTestId('c17-events'))
  await app.getByRole('button', { name: '快速请求 EN→ZH', exact: true }).click()
  await expect
    .poll(async () => (await json<Events>(app.getByTestId('c17-events'))).uiCommits)
    .toBe(before.uiCommits + 1)
  expect(await json(app.getByTestId('c17-language'))).toEqual({
    requested: 'zh',
    committed: 'zh',
    sdkObserved: 'zh',
    pending: false,
  })
  const after = await json<Events>(app.getByTestId('c17-events'))
  expect(after.sdkLanguageChanged).toBe(before.sdkLanguageChanged + 2)
  expect(after.lastLanguage).toBe('zh')
  await expect(app.getByTestId('c17-welcome')).toHaveText('欢迎，开发者！')
  await app.getByRole('button', { name: '快速请求 ZH→EN', exact: true }).click()
  await expect
    .poll(async () => (await json<Events>(app.getByTestId('c17-events'))).uiCommits)
    .toBe(before.uiCommits + 2)
  expect(await json(app.getByTestId('c17-language'))).toEqual({
    requested: 'en',
    committed: 'en',
    sdkObserved: 'en',
    pending: false,
  })
  await expect(app.getByTestId('c17-welcome')).toHaveText('Welcome, 开发者!')
  await page.setViewportSize({ width: 390, height: 980 })
  expect(await app.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
  const old = await app.getByRole('textbox', { name: '昵称', exact: true }).elementHandle()
  if (!old) throw new Error('Missing actual input before unmount')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  expect(await old.evaluate((node) => node.isConnected)).toBe(false)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(app).toHaveAttribute('data-ready', 'true')
  await expect(app).toHaveAttribute('data-language', 'zh')
  expect((await json<Events>(app.getByTestId('c17-events'))).uiCommits).toBe(0)
  await expect(app.getByRole('textbox', { name: '昵称', exact: true })).toHaveValue('开发者')
})

// SDK events are genuine callbacks. UI commit/generation counters belong to the application.
// Bundled resources make changeLanguage fast; no fake delay/backend creates a false network race.
// Pure deferred queue policy4 and actual SDK5 are separate evidence. dispose does not cancel SDK IO.
// These DOM/reset assertions do not census browser-global listeners; actual owned off is tested in SDK5.
// OS IME, assistive technology, real backend failure/cancellation and SSR hydration remain NOT_RUN.
