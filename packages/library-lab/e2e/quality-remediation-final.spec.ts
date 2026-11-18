import { expect, test } from '@playwright/test'

for (const [entryId, slug] of [
  ['A10', 'tldraw'],
  ['B17', 'floating-ui'],
  ['E19', 'ffmpeg-wasm'],
]) {
  test(`@${entryId} official original remains available independently from SDK resource readiness`, async ({
    page,
  }) => {
    await page.goto(`/libraries/${slug}?tab=readme`)
    await expect(page.getByRole('heading', { name: '官方 README 原文', exact: true })).toBeVisible()
    await expect(page.locator('.prose')).not.toBeEmpty()
    await expect(page.getByRole('link', { name: '打开上游原文' })).toHaveAttribute(
      'href',
      /\/[a-f0-9]{40}\//u,
    )
    await expect(page.getByRole('alert')).toHaveCount(0)
    await page.getByRole('tab', { name: '官网预览', exact: true }).click()
    await expect(page.getByRole('link', { name: /打开官网|打开官方仓库/u })).toHaveAttribute(
      'href',
      /^https:/u,
    )
    await expect(page.locator('iframe')).toHaveCount(0)
  })
}
