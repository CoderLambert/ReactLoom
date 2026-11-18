import { expect, test } from '@playwright/test'

test('@C20 complete experiment exposes real state, native semantics and full/lite differences', async ({
  page,
}) => {
  await page.goto('/libraries/clsx?tab=demo')
  await page.getByLabel('选中', { exact: true }).check()
  await expect(page.getByTestId('class-output')).toHaveText('"demo-card is-selected"')
  await page.getByLabel('提示语气').selectOption('success')
  await expect(page.getByTestId('class-output')).toContainText('tone-success')
  await page.getByLabel('禁用操作').check()
  await expect(page.getByRole('button', { name: '取消收藏', exact: true })).toBeDisabled()
  await page.getByLabel('输入预设').selectOption('object')
  await expect(page.getByTestId('full-output')).toHaveText('"card is-selected"')
  await expect(page.getByTestId('lite-output')).toHaveText('"card"')
  await page.getByLabel('输入预设').selectOption('utilities')
  await expect(page.getByTestId('full-output')).toHaveText('"px-2 px-4 px-4"')
  await expect(page.getByTestId('lite-output')).toHaveText('"px-2 px-4 px-4"')
})

test('@D15 real IndexedDB filters, rolls back and upgrades without losing existing fields', async ({
  page,
}) => {
  await page.goto('/libraries/dexie?tab=demo')
  await page.getByRole('button', { name: '查询分组', exact: true }).click()
  await expect(page.getByRole('heading', { name: '技术分组：2 条，按更新时间升序' })).toBeVisible()
  const table = page.getByRole('table', { name: '查询结果 · 时间单位为演示刻度' })
  await expect(table.getByRole('row').nth(1)).toContainText('rss-b')
  await expect(table.getByRole('row').nth(2)).toContainText('rss-a')
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('business')
  await page.getByRole('button', { name: '触发重复键并检查回滚' }).click()
  await expect(page.getByRole('heading', { name: '已确认原子回滚' })).toBeVisible()
  await expect(page.getByRole('table', { name: '事务失败之后' })).not.toContainText('rss-d')
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('advanced')
  await page.getByRole('button', { name: '创建 v1，再升级到 v2' }).click()
  await expect(page.getByRole('heading', { name: '当前版本 v2：遗留字段已回填' })).toBeVisible()
  await expect(page.getByText('true → true（保留已有值）')).toBeVisible()
  await page.getByRole('tab', { name: '详细文档', exact: true }).click()
  await expect(page.locator('.dexie-lab')).toHaveCount(0)
})

test('@D15 unavailable UUID generation releases busy state and exposes a recoverable error', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true }),
  )
  await page.goto('/libraries/dexie?tab=demo')
  const run = page.getByRole('button', { name: '查询分组', exact: true })
  await run.click()
  await expect(page.locator('.dexie-status')).toContainText('执行失败')
  await expect(run).toBeEnabled()
})

test('@C20 official README is loaded on demand and retains pinned upstream links', async ({
  page,
}) => {
  let requests = 0
  page.on('request', (request) => {
    if (request.url().endsWith('/raw/C20/readme.md')) requests += 1
  })
  await page.goto('/libraries/clsx')
  await expect(page.getByRole('tab', { name: '详细文档', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  expect(requests).toBe(0)
  await page.getByRole('tab', { name: '官方 README', exact: true }).click()
  await expect(page.getByRole('heading', { name: '官方 README 原文' })).toBeVisible()
  await expect(page.locator('.prose')).toContainText('Usage')
  await expect(page.getByRole('link', { name: '打开上游原文' })).toHaveAttribute(
    'href',
    /925494cf31bcd97d3337aacd34e659e80cae7fe2\/readme.md/,
  )
  expect(requests).toBe(1)
  await page.locator('.prose a[href="#api"]').click()
  await expect(page.locator('h2#api')).toBeVisible()
  await page.locator('.prose a[href="#clsxlite"]').click()
  await expect(page.locator('h4#clsxlite')).toBeVisible()
})

test('@C20 altered official Markdown is refused before rendering', async ({ page }) => {
  await page.route('**/raw/C20/readme.md', (route) =>
    route.fulfill({ contentType: 'text/markdown', body: '# changed upstream bytes' }),
  )
  await page.goto('/libraries/clsx?tab=readme')
  await expect(page.getByRole('alert')).toContainText('原文摘要不一致')
  await expect(page.getByRole('heading', { name: 'changed upstream bytes' })).toHaveCount(0)
})

for (const slug of ['clsx', 'rollup-plugin-visualizer']) {
  test(`official repository ${slug} refuses embedding with a direct upstream exit`, async ({
    page,
  }) => {
    await page.goto(`/libraries/${slug}?tab=website`)
    await expect(page.getByRole('heading', { name: '这个网站不允许嵌入其他页面' })).toBeVisible()
    await expect(page.getByRole('link', { name: '打开官方仓库' })).toHaveAttribute(
      'href',
      /^https:\/\/github.com\//,
    )
    await expect(page.locator('iframe')).toHaveCount(0)
  })
}

test('@D15 homepage frame only mounts on request and unmounts when leaving the tab', async ({
  page,
}) => {
  await page.route('https://dexie.org/', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<h1>External homepage fixture</h1>' }),
  )
  await page.goto('/libraries/dexie?tab=website')
  await expect(page.locator('iframe')).toHaveCount(0)
  await page.getByRole('button', { name: '加载官网预览' }).click()
  await expect(
    page.frameLocator('iframe').getByRole('heading', { name: 'External homepage fixture' }),
  ).toBeVisible()
  await page.getByRole('tab', { name: '详细文档', exact: true }).click()
  await expect(page.locator('iframe')).toHaveCount(0)
})

test('@F18 real build comparison is visible without executing commands in the browser', async ({
  page,
}) => {
  await page.goto('/libraries/rollup-plugin-visualizer?tab=demo&example=business')
  await expect(
    page.getByText(
      'node entries/F18-rollup-plugin-visualizer/examples/verify.mjs --scenario=business',
      { exact: true },
    ),
  ).toBeVisible()
  const report = page.getByRole('region', { name: '实际构建结果' })
  const detail: { buildSummaryAvailable?: boolean } = await (
    await page.request.get('/raw/F18/detail.json')
  ).json()
  if (!detail.buildSummaryAvailable) {
    await expect(page.getByRole('heading', { name: '还没有当前输入的构建结果' })).toBeVisible()
    await expect(report).toHaveCount(0)
    return
  }
  const summary: { builds: { variant: string; initialGzipBytes: number }[] } = await (
    await page.request.get('/raw/F18/build-summary.json')
  ).json()
  await expect(report.getByRole('table')).toBeVisible()
  const eager = summary.builds.find((build) => build.variant === 'static')
  const lazy = summary.builds.find((build) => build.variant === 'lazy')
  if (eager && lazy) {
    const delta = lazy.initialGzipBytes - eager.initialGzipBytes
    await expect(report).toContainText(
      `入口 gzip ${delta >= 0 ? '增加' : '减少'}了 ${Math.abs(delta).toLocaleString('zh-CN')} B`,
    )
  }
  await expect(page.getByRole('button', { name: '运行当前示例' })).toHaveCount(0)
})

test('@F18 missing local build artifacts show a reproducible empty state', async ({ page }) => {
  await page.route('**/raw/F18/detail.json', async (route) => {
    const response = await route.fetch()
    const body: Record<string, unknown> = await response.json()
    await route.fulfill({
      response,
      contentType: 'application/json',
      body: JSON.stringify({ ...body, buildSummaryAvailable: false }),
    })
  })
  await page.goto('/libraries/rollup-plugin-visualizer?tab=demo&example=business')
  await expect(page.getByRole('heading', { name: '还没有当前输入的构建结果' })).toBeVisible()
  await expect(page.getByRole('region', { name: '实际构建结果' })).toHaveCount(0)
  await expect(
    page.getByText(
      'node entries/F18-rollup-plugin-visualizer/examples/verify.mjs --scenario=business',
      { exact: true },
    ),
  ).toBeVisible()
})
