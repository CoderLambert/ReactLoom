import { expect, type Locator, type Page, test } from '@playwright/test'

async function open(page: Page, level: string) {
  await page.goto(`/libraries/ajv?tab=demo&example=${level}`)
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  if (await run.isVisible()) await run.click()
  const app = page.getByTestId('c05-workshop')
  await expect(app).toHaveAttribute('data-level', level)
  return app
}
async function run(app: Locator, stage: string) {
  await app.getByRole('button', { name: '调用 Ajv.validate', exact: true }).click()
  await expect(app).toHaveAttribute('data-stage', stage)
}
async function parsed(app: Locator) {
  return JSON.parse((await app.getByTestId('ajv-result').textContent()) ?? '{}')
}

test('@C05 actual shared Ajv contract separates JSON syntax, structural errors and credential policy', async ({
  page,
}) => {
  const eventErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') eventErrors.push(message.text())
  })
  const app = await open(page, 'basic')
  const input = app.getByRole('textbox', { name: '输入 JSON', exact: true })
  await run(app, 'success')
  expect((await parsed(app)).id).toBe('frontend')
  await app.getByRole('button', { name: '载入字段反例', exact: true }).click()
  await expect(app.getByTestId('ajv-result')).toHaveCount(0)
  await run(app, 'schema')
  await expect(app.getByTestId('c05-errors')).toContainText('additionalProperties')
  await expect(app.getByTestId('c05-errors')).toContainText('/url')
  await expect(input).toHaveAttribute('aria-invalid', 'true')
  await app.getByRole('button', { name: '载入结构通过但业务失败', exact: true }).click()
  await run(app, 'domain')
  await expect(app.getByTestId('c05-status')).toHaveText('JSON Schema 已通过，RSS 业务规则不通过')
  await expect(app.getByTestId('c05-errors')).toContainText('/url')
  await input.fill('{')
  await run(app, 'json')
  await expect(app.getByTestId('c05-status')).toContainText('尚未调用 Ajv')
  await input.fill('{}')
  await run(app, 'schema')
  await expect(app.getByTestId('c05-errors').getByRole('listitem')).toHaveCount(3)
  await expect(app.getByTestId('c05-errors')).toContainText('(id)')
  await expect(app.getByTestId('c05-errors')).toContainText('(title)')
  await expect(app.getByTestId('c05-errors')).toContainText('(url)')
  await input.fill(
    JSON.stringify({
      id: 'valid',
      title: '合法订阅',
      url: 'https://example.org/rss',
      extraOne: true,
      extraTwo: true,
    }),
  )
  await run(app, 'schema')
  await expect(app.getByTestId('c05-errors').getByRole('listitem')).toHaveCount(2)
  await expect(app.getByTestId('c05-errors')).toContainText('(extraOne)')
  await expect(app.getByTestId('c05-errors')).toContainText('(extraTwo)')
  expect(eventErrors).toEqual([])
  await app.getByRole('button', { name: '恢复样例', exact: true }).click()
  await run(app, 'success')
})

test('@C05 actual uniqueItems compares whole objects while business policy compares canonical identity', async ({
  page,
}) => {
  const app = await open(page, 'business')
  const input = app.getByRole('textbox', { name: '输入 JSON', exact: true })
  await run(app, 'success')
  expect((await parsed(app)).feeds).toHaveLength(2)
  await app.getByRole('button', { name: '载入结构通过但业务失败', exact: true }).click()
  await run(app, 'domain')
  await expect(app.getByTestId('c05-errors')).toContainText('/feeds/1/url')
  const value = JSON.parse(await input.inputValue())
  value.feeds[1].url = 'https://example.com/feed?q=A#section'
  await input.fill(JSON.stringify(value))
  await run(app, 'success')
  expect((await parsed(app)).feeds[0].url).toBe('https://EXAMPLE.COM:443/Feed?q=A')
  value.feeds[1] = { ...value.feeds[0] }
  await input.fill(JSON.stringify(value))
  await run(app, 'schema')
  await expect(app.getByTestId('c05-errors')).toContainText('uniqueItems')
})

test('@C05 actual inherited strict conditional contract aggregates issues without modifying the draft', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  const app = await open(page, 'advanced')
  const input = app.getByRole('textbox', { name: '输入 JSON', exact: true })
  await run(app, 'schema')
  await expect(app.getByTestId('c05-errors')).toContainText('minimum')
  await expect(app.getByTestId('c05-errors')).toContainText('additionalProperties')
  await input.fill('{"enabled":true}')
  await run(app, 'schema')
  await expect(app.getByTestId('c05-errors')).toContainText('maxConcurrent')
  const raw = '{"enabled":true,"maxConcurrent":"3","extra":true}'
  await input.fill(raw)
  await run(app, 'schema')
  await expect(input).toHaveValue(raw)
  await expect(app.getByTestId('c05-errors')).toContainText('type')
  await input.fill('{"enabled":false}')
  await run(app, 'success')
  expect(await parsed(app)).toEqual({ enabled: false })
  await input.fill('{"enabled":false,"maxConcurrent":0}')
  await run(app, 'schema')
  await app.getByRole('button', { name: '载入合法输入', exact: true }).click()
  await run(app, 'success')
  expect((await parsed(app)).maxConcurrent).toBe(3)
  expect(errors).toEqual([])
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(app).toHaveAttribute('data-stage', 'idle')
  await expect(app.getByTestId('ajv-result')).toHaveCount(0)
})
