import { expect, test } from '@playwright/test'

for (const [id, slug, blocked] of [
  ['A05', 'd3', false],
  ['A07', 'antv-g6', false],
  ['A12', 'react-konva', true],
] as const) {
  test(`@${id} original README has immutable provenance and checked official homepage`, async ({
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
    if (blocked) {
      await expect(
        page.getByRole('heading', { name: '这个网站不允许嵌入其他页面', exact: true }),
      ).toBeVisible()
      await page.getByText(/查看检查依据/u).click()
      await expect(page.getByText(/SAMEORIGIN/u)).toBeVisible()
    } else {
      await expect(page.getByRole('button', { name: '加载官网预览', exact: true })).toBeVisible()
    }
  })
}
