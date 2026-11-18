import { expect, test } from '@playwright/test'

test('@D07 same-key observers share fresh data and stale refresh keeps the previous value', async ({
  page,
}) => {
  await page.clock.install()
  await page.goto('/libraries/tanstack-query?tab=demo&example=basic')
  const app = page.getByTestId('d07-cache-primer')
  await expect(app).toBeVisible()
  await page.clock.runFor(650)
  const first = app.getByTestId('d07-stat-value-a')
  await expect(first).toHaveText(/订阅源 9 · 启用 5 · fixture请求序号 1/u)
  await app.getByRole('button', { name: '挂载第二个统计组件', exact: true }).click()
  await expect(app.getByTestId('d07-stat-value-b')).toHaveText((await first.textContent()) ?? '')
  await expect(app.getByTestId('d07-observer-b')).toHaveAttribute('data-fetch-status', 'idle')
  await page.clock.runFor(3100)
  await expect(app.getByTestId('d07-observer-a')).toHaveAttribute('data-stale', 'true')
  await app.getByRole('button', { name: '在本地数据源新增1条', exact: true }).click()
  await expect(first).toHaveText(/订阅源 9/u)
  await app.getByRole('button', { name: '后台刷新共享统计', exact: true }).click()
  await expect(app.getByTestId('d07-observer-a')).toHaveAttribute('data-fetch-status', 'fetching')
  await expect(first).toHaveText(/订阅源 9/u)
  await page.clock.runFor(650)
  await expect(first).toHaveText(/订阅源 10 · 启用 6 · fixture请求序号 2/u)
  await expect(app.getByTestId('d07-stat-value-b')).toHaveText((await first.textContent()) ?? '')
})

test('@D07 tenant cancellation can recover and one-shot 409 rolls back before a successful retry', async ({
  page,
}) => {
  await page.goto('/libraries/tanstack-query?tab=demo&example=advanced')
  const app = page.getByTestId('d07-workspace')
  await expect(app.getByTestId('d07-row-a-1')).toBeVisible()
  await app.getByRole('combobox', { name: '本地请求延迟', exact: true }).selectOption('900')
  await app.getByRole('combobox', { name: '工作区', exact: true }).selectOption('team-b')
  await app.getByRole('button', { name: '取消当前列表查询', exact: true }).click()
  await expect(app.getByTestId('d07-query-key')).toContainText('team-b')
  await expect(app.getByTestId('d07-query-state')).toContainText('fetchStatus=idle')
  await expect(
    app.getByText('当前没有列表数据，查询已停止。请重新获取。', { exact: true }),
  ).toBeVisible()
  await app.getByRole('button', { name: '重新获取当前列表', exact: true }).click()
  await expect(app.getByTestId('d07-row-b-1')).toBeVisible()
  await app.getByRole('combobox', { name: '工作区', exact: true }).selectOption('team-a')
  const row = app.getByTestId('d07-row-a-1')
  await expect(row).toBeVisible()
  const before = await row.textContent()
  const fail = app.getByRole('checkbox', { name: '模拟下一次更新409', exact: true })
  await fail.check()
  await row.getByRole('button').click()
  await expect(app.getByTestId('d07-message')).toContainText('409')
  await expect(row).toHaveText(before ?? '')
  await expect(fail).not.toBeChecked()
  await expect(row.getByRole('button')).toBeEnabled()
  await row.getByRole('button').click()
  await expect(app.getByTestId('d07-message')).toContainText('更新完成')
  await expect(row).not.toHaveText(before ?? '')
  await page.getByRole('tab', { name: '详细文档', exact: true }).click()
  await expect(app).toHaveCount(0)
})

for (const width of [1280, 390]) {
  test(`@C01 required and HTTPS errors describe their actual inputs before a valid preview at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/libraries/react-hook-form?tab=demo&example=basic')
    const app = page.getByRole('region', { name: 'React Hook Form 实际 SDK 示例' })
    const group = app.getByRole('textbox', { name: '分组名称', exact: true })
    const url = app.getByRole('textbox', { name: '来源 1 URL', exact: true })
    await group.fill('')
    await url.fill('http://example.com/feed')
    await app.getByRole('button', { name: '验证并预览', exact: true }).click()
    await expect(group).toHaveAttribute('aria-invalid', 'true')
    await expect(group).toHaveAttribute('aria-describedby', 'rhf-group-error')
    await expect(url).toHaveAttribute('aria-invalid', 'true')
    const errorId = await url.getAttribute('aria-describedby')
    expect(errorId).toMatch(/^rhf-.+-url-error$/u)
    await expect(app.locator(`[id="${errorId}"]`)).toContainText('HTTPS')
    await group.fill('工程')
    await url.fill('https://example.com/feed')
    await app.getByRole('button', { name: '验证并预览', exact: true }).click()
    await expect(app.locator('output')).toContainText('https://example.com/feed')
    await expect(app.getByTestId('c01-form-state')).toContainText('空闲')
  })
}

test('@C01 deleting a preceding row preserves the surviving field identity, value, and error', async ({
  page,
}) => {
  await page.goto('/libraries/react-hook-form?tab=demo&example=business')
  const app = page.getByRole('region', { name: 'React Hook Form 实际 SDK 示例' })
  await app.getByRole('button', { name: '新增 RSS 来源', exact: true }).click()
  const rows = app.getByTestId('c01-source-row')
  await expect(rows).toHaveCount(2)
  const id = await rows.nth(1).getAttribute('data-field-id')
  const url = rows.nth(1).getByRole('textbox', { name: '来源 2 URL', exact: true })
  await url.fill('http://example.com/second')
  await url.press('Tab')
  await expect(url).toHaveAttribute('aria-invalid', 'true')
  const errorId = await url.getAttribute('aria-describedby')
  await rows.first().getByRole('button', { name: '移除该源', exact: true }).click()
  await expect(rows).toHaveCount(1)
  await expect(rows.first()).toHaveAttribute('data-field-id', id ?? '')
  const remaining = rows.first().getByRole('textbox', { name: '来源 1 URL', exact: true })
  await expect(remaining).toHaveValue('http://example.com/second')
  await expect(remaining).toHaveAttribute('aria-describedby', errorId ?? '')
  await expect(rows.first().getByRole('textbox', { name: '来源 1 标题', exact: true })).toHaveValue(
    '新来源',
  )
})

test('@C01 server errors recover and edited drafts cancel obsolete async submissions', async ({
  page,
}) => {
  await page.clock.install()
  await page.goto('/libraries/react-hook-form?tab=demo&example=advanced')
  const app = page.getByRole('region', { name: 'React Hook Form 实际 SDK 示例' })
  const url = app.getByRole('textbox', { name: '来源 1 URL', exact: true })
  const submit = app.getByRole('button', { name: '验证并预览', exact: true })
  await url.fill('https://example.com/duplicate')
  await submit.click()
  await page.clock.runFor(500)
  await expect(app.getByRole('alert').filter({ hasText: '模拟服务端 409' })).toBeVisible()
  await url.fill('https://example.com/valid')
  await url.press('Tab')
  await submit.click()
  await url.fill('https://example.com/newer')
  await expect(app.getByRole('status')).toContainText('旧提交已取消')
  await page.clock.runFor(600)
  await expect(app.getByRole('alert').filter({ hasText: '模拟服务端 409' })).toHaveCount(0)
  await submit.click()
  await page.clock.runFor(500)
  await expect(app.locator('output')).toContainText('https://example.com/newer')
  await page.getByRole('tab', { name: '详细文档', exact: true }).click()
  await expect(app).toHaveCount(0)
})

for (const [entryId, slug] of [
  ['C01', 'react-hook-form'],
  ['D07', 'tanstack-query'],
  ['F11', 'msw'],
]) {
  test(`@${entryId} official original and homepage check remain separate from runtime receipts`, async ({
    page,
  }) => {
    await page.goto(`/libraries/${slug}?tab=readme`)
    await expect(page.getByRole('heading', { name: '官方 README 原文', exact: true })).toBeVisible()
    await expect(page.locator('.prose')).not.toBeEmpty()
    await expect(page.getByRole('alert')).toHaveCount(0)
    await expect(page.getByRole('link', { name: '打开上游原文' })).toHaveAttribute(
      'href',
      /\/[a-f0-9]{40}\//u,
    )
    await page.getByRole('tab', { name: '官网预览', exact: true }).click()
    await expect(page.getByRole('link', { name: /打开官网|打开官方仓库/u })).toHaveAttribute(
      'href',
      /^https:/u,
    )
    await expect(page.locator('iframe')).toHaveCount(0)
  })
}
