import { expect, type Page, test } from '@playwright/test'

const RUNNER = 'http://127.0.0.1:4320'
const panel = (page: Page) => page.getByRole('region', { name: 'MSW 隔离浏览器场景' })
async function openScenario(page: Page, level: string) {
  await page.goto(`/libraries/msw?tab=demo&example=${level}`)
  await panel(page).getByRole('button', { name: '运行 MSW 浏览器场景' }).click()
  await expect(panel(page).getByRole('status')).toHaveText('已收到浏览器请求结果')
  return (await panel(page).locator('details code').textContent())!
}
async function stopScenario(page: Page) {
  await panel(page).getByRole('button', { name: '停止 MSW 并清理' }).click()
  await expect(panel(page).getByRole('status')).toHaveText('已停止，本次作用域已清理')
}
test('@F18 HTML fixture is displayed as verified inert text, never executed', async ({ page }) => {
  await page.goto('/libraries/rollup-plugin-visualizer?tab=demo&example=basic')
  await page
    .getByRole('combobox', { name: '查看源码文件' })
    .selectOption('examples/fixture/index.html')
  await expect(page.locator('.source-viewer .hash')).toContainText('已校验')
  await expect(page.locator('.source-viewer pre')).toContainText('<!doctype html>')
  const response = await page.request.get('/raw/F18/sources/examples/fixture/index.html.txt')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toMatch(/text\/plain/u)
  await expect(page.getByRole('button', { name: '复制源码' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Load chart helper' })).toHaveCount(0)
})
for (const [level, statuses] of [
  ['basic', ['200']],
  ['business', ['422', '200']],
  ['advanced', ['503', '200']],
] as const) {
  test(`@F11 isolated MSW ${level} uses real requests and unregisters its session`, async ({
    page,
    context,
  }) => {
    const scope = await openScenario(page, level)
    expect(scope).toMatch(/^http:\/\/127\.0\.0\.1:4320\/lab-runners\/msw\/sessions\/[a-f0-9-]+\/$/u)
    await expect(panel(page).locator('tbody tr td:nth-child(2)')).toHaveText([...statuses])
    expect(
      await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? null),
    ).toBeNull()
    const inspector = await context.newPage()
    try {
      await inspector.goto(RUNNER + '/lab-runners/msw/')
      await expect
        .poll(() =>
          inspector.evaluate(
            async (scope) =>
              (await navigator.serviceWorker.getRegistrations()).some(
                (item) => item.scope === scope,
              ),
            scope,
          ),
        )
        .toBe(true)
      await stopScenario(page)
      await expect
        .poll(() =>
          inspector.evaluate(
            async (scope) =>
              (await navigator.serviceWorker.getRegistrations()).some(
                (item) => item.scope === scope,
              ),
            scope,
          ),
        )
        .toBe(false)
    } finally {
      await inspector.close()
    }
  })
}
test('@F11 simultaneous sessions are independent and leaving a tab cleans only its session', async ({
  page,
  context,
}) => {
  const second = await context.newPage(),
    inspector = await context.newPage()
  try {
    const firstScope = await openScenario(page, 'basic'),
      secondScope = await openScenario(second, 'business')
    expect(firstScope).not.toBe(secondScope)
    await inspector.goto(RUNNER + '/lab-runners/msw/')
    await page.getByRole('tab', { name: '详细文档' }).click()
    await expect
      .poll(() =>
        inspector.evaluate(
          async (scope) =>
            (await navigator.serviceWorker.getRegistrations()).some((item) => item.scope === scope),
          firstScope,
        ),
      )
      .toBe(false)
    expect(
      await inspector.evaluate(
        async (scope) =>
          (await navigator.serviceWorker.getRegistrations()).some((item) => item.scope === scope),
        secondScope,
      ),
    ).toBe(true)
    await stopScenario(second)
    await expect
      .poll(() =>
        inspector.evaluate(
          async (scope) =>
            (await navigator.serviceWorker.getRegistrations()).some((item) => item.scope === scope),
          secondScope,
        ),
      )
      .toBe(false)
  } finally {
    await second.close()
    await inspector.close()
  }
})
