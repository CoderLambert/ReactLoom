import { expect, test } from '@playwright/test'

test('@D01 one pipeline exposes ordering, grouping and pagination with recovery', async ({
  page,
}) => {
  await page.goto('/libraries/es-toolkit?tab=demo&example=basic')
  const run = page.getByRole('button', { name: '运行真实工具函数', exact: true })
  const output = page.getByTestId('toolkit-output')
  const read = async () => JSON.parse((await output.textContent()) ?? '{}')
  await run.click()
  await expect(output).toBeVisible()
  let result = await read()
  expect(result.inputCount).toBe(5)
  expect(result.normalized).toHaveLength(5)
  expect(result.sorted).toHaveLength(5)
  expect(result.unique.map((row: { title: string }) => row.title).slice(0, 2)).toEqual([
    'Release notes',
    'Frontend Insights',
  ])
  expect(result.unique).toHaveLength(4)
  expect(result.groupSizes).toEqual({ official: 2, community: 2, other: 0 })
  expect(result.pages.map((rows: unknown[]) => rows.length)).toEqual([2, 2])
  expect(result.rejected).toEqual([])
  await page.getByLabel('每页文章数').selectOption('3')
  await run.click()
  expect((await read()).pages.map((rows: unknown[]) => rows.length)).toEqual([3, 1])
  await page.getByRole('checkbox', { name: '包含两个坏输入' }).check()
  await run.click()
  result = await read()
  expect(result.inputCount).toBe(7)
  expect(result.unique).toHaveLength(4)
  expect(result.rejected.map((row: { index: number }) => row.index)).toEqual([5, 6])
  const input = page.getByLabel('文章 JSON')
  await input.fill('{}')
  await run.click()
  await expect(page.getByRole('alert')).toHaveText('输入必须是 JSON 数组')
  await expect(output).toHaveCount(0)
  await input.fill('[')
  await run.click()
  await expect(page.getByRole('alert')).toBeVisible()
  await page.getByRole('button', { name: '恢复示例输入' }).click()
  await expect(page.getByRole('checkbox', { name: '包含两个坏输入' })).not.toBeChecked()
  await expect(page.getByRole('alert')).toHaveCount(0)
  const rows = JSON.parse(await input.inputValue())
  rows[1].publishedAt = '2026-10-28T06:00:00Z'
  await input.fill(JSON.stringify(rows))
  await run.click()
  result = await read()
  expect(result.unique[0].title).toBe('Same article older')
  expect(result.unique.map((row: { title: string }) => row.title)).not.toContain(
    'Frontend Insights',
  )
  await input.fill('[]')
  await run.click()
  result = await read()
  for (const key of ['normalized', 'unique', 'pages', 'rejected']) expect(result[key]).toEqual([])
  await page.getByRole('tab', { name: '详细文档', exact: true }).click()
  await expect(input).toHaveCount(0)
  await page.getByRole('tab', { name: '实战 Demo', exact: true }).click()
  await expect(input).toContainText('Frontend Insights')
  await expect(output).toHaveCount(0)
})

for (const [id, slug, status] of [
  ['C22', 'moment-migration', 'unknown'],
  ['D01', 'es-toolkit', 'unknown'],
  ['D02', 'lodash', 'blocked'],
]) {
  test(`@${id} pinned official original and honest homepage fallback`, async ({ page }) => {
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
    const load = page.getByRole('button', { name: '加载官网预览', exact: true })
    if (status === 'blocked') await expect(load).toHaveCount(0)
    else await expect(load).toBeVisible()
  })
}
