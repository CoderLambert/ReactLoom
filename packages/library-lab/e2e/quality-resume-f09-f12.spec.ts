import { expect, test } from '@playwright/test'

for (const [id, slug, status] of [
  ['F09', 'pdf-lib', 'unknown'],
  ['F10', 'orval', 'unknown'],
  ['F12', 'vitest', 'blocked'],
]) {
  test(`@${id} fixed official original and homepage fallback`, async ({ page }) => {
    await page.goto(`/libraries/${slug}?tab=readme`)
    await expect(page.getByRole('heading', { name: '官方 README 原文', exact: true })).toBeVisible()
    await expect(page.locator('.prose')).not.toBeEmpty()
    await expect(page.getByRole('link', { name: '打开上游原文' })).toHaveAttribute(
      'href',
      /\/[a-f0-9]{40}\//u,
    )
    await page.getByRole('tab', { name: '官网预览', exact: true }).click()
    await expect(page.getByRole('link', { name: /打开官网|打开官方仓库/u })).toBeVisible()
    await expect(page.locator('iframe')).toHaveCount(0)
    const load = page.getByRole('button', { name: '加载官网预览', exact: true })
    if (status === 'blocked') await expect(load).toHaveCount(0)
    else await expect(load).toBeVisible()
  })
}

for (const [id, slug, command] of [
  ['F10', 'orval', (level: string) => `node entries/F10-orval/examples/${level}.mjs ${level}`],
  [
    'F12',
    'vitest',
    (level: string) =>
      `pnpm exec vitest run --config entries/F12-vitest/vitest.config.ts examples/${level}.test.ts`,
  ],
] as const) {
  test(`@${id} all three CLI scenarios display the checked-in command`, async ({ page }) => {
    await page.goto(`/libraries/${slug}?tab=demo&example=basic`)
    for (const level of ['basic', 'business', 'advanced']) {
      await page.getByRole('combobox', { name: '学习场景' }).selectOption(level)
      await expect(page.getByText(command(level), { exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: '真实源码', exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: '运行当前示例' })).toHaveCount(0)
    }
  })
}
