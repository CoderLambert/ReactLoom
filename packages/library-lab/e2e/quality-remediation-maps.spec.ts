import { expect, test } from '@playwright/test'

for (const [id, slug] of [
  ['A14', 'react-three-fiber'],
  ['A15', 'leaflet'],
  ['A16', 'maplibre-gl-js'],
  ['A17', 'deckgl'],
]) {
  test(`@${id} pinned original README and explicitly unknown homepage keep verified provenance`, async ({
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
    await expect(page.getByRole('button', { name: '加载官网预览', exact: true })).toBeVisible()
    await expect(page.locator('iframe')).toHaveCount(0)
  })
}
