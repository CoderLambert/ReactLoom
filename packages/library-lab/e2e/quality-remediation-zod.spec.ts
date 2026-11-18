import { expect, type Locator, type Page, test } from '@playwright/test'

async function open(page: Page, level: string) {
  await page.goto(`/libraries/zod?tab=demo&example=${level}`)
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  if (await run.isVisible()) await run.click()
  const app = page.getByTestId('c02-workshop')
  await expect(app).toHaveAttribute('data-level', level)
  return app
}
async function run(app: Locator) {
  await app.getByRole('button', { name: '运行 safeParse', exact: true }).click()
}
async function parsed(app: Locator) {
  return JSON.parse((await app.getByTestId('c02-output').textContent()) ?? '{}')
}

test('@C02 actual strict fields, trim output, schema and JSON syntax failure invalidate old results', async ({
  page,
}) => {
  const app = await open(page, 'basic')
  const raw = app.getByRole('textbox', { name: '待校验 JSON', exact: true })
  await run(app)
  expect(await parsed(app)).toEqual({ title: '前端实战', url: 'https://example.com/rss.xml' })
  await app.getByRole('button', { name: '加载失败样例', exact: true }).click()
  await expect(app.getByTestId('c02-output')).toHaveCount(0)
  await run(app)
  await expect(app.getByTestId('c02-issues')).toContainText('title')
  await expect(app.getByTestId('c02-issues')).toContainText('url')
  await expect(app.getByTestId('c02-issues')).toContainText('(根对象)')
  await expect(raw).toHaveAttribute('aria-invalid', 'true')
  await raw.fill('{')
  await expect(app.getByTestId('c02-issues')).toHaveCount(0)
  await run(app)
  await expect(app.getByTestId('c02-status')).toHaveText('JSON 解析失败')
  await app.getByRole('button', { name: '重置', exact: true }).click()
  await run(app)
  expect((await parsed(app)).title).toBe('前端实战')
})

test('@C02 actual discriminated union chooses JSON metadata branch rather than parsing OPML files', async ({
  page,
}) => {
  const app = await open(page, 'business')
  const raw = app.getByRole('textbox', { name: '待校验 JSON', exact: true })
  await run(app)
  expect(await parsed(app)).toEqual({
    kind: 'opml',
    filename: 'feeds.opml',
    groups: ['技术', '开源'],
  })
  await app.getByRole('button', { name: '加载失败样例', exact: true }).click()
  await run(app)
  await expect(app.getByTestId('c02-issues')).toContainText('filename')
  await expect(app.getByTestId('c02-issues')).toContainText('groups')
  await raw.fill(JSON.stringify({ kind: 'csv', url: 'https://example.com/feed' }))
  await run(app)
  await expect(app.getByTestId('c02-issues')).toContainText('kind')
  await raw.fill(JSON.stringify({ kind: 'rss', url: 'https://example.com/feed' }))
  await run(app)
  expect(await parsed(app)).toEqual({ kind: 'rss', url: 'https://example.com/feed' })
})

test('@C02 actual TTL output conversion and canonical identity duplicates preserve output URL spelling', async ({
  page,
}) => {
  const app = await open(page, 'advanced')
  const raw = app.getByRole('textbox', { name: '待校验 JSON', exact: true })
  await run(app)
  expect((await parsed(app)).ttlMinutes).toBe(15)
  await app.getByRole('button', { name: '加载失败样例', exact: true }).click()
  await run(app)
  await expect(app.getByTestId('c02-issues')).toContainText('ttlMinutes')
  await expect(app.getByTestId('c02-output')).toHaveCount(0)
  await app.getByRole('button', { name: '加载重复来源', exact: true }).click()
  await run(app)
  await expect(app.getByTestId('c02-issues')).toContainText('sources.1.url')
  const input = JSON.parse(await raw.inputValue())
  input.sources[1].url = 'https://example.com/feed?q=A#two'
  await raw.fill(JSON.stringify(input))
  await run(app)
  expect((await parsed(app)).sources[0].url).toBe('https://EXAMPLE.COM:443/Feed?q=A#one')
  expect((await parsed(app)).ttlMinutes).toBe(15)
  input.ttlMinutes = '05'
  await raw.fill(JSON.stringify(input))
  await run(app)
  await expect(app.getByTestId('c02-issues')).toContainText('ttlMinutes')
})
