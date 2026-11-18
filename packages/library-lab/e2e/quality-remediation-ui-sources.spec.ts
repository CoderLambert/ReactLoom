import { expect, test } from '@playwright/test'

for (const [id, slug, status] of [
  ['B01', 'motion-for-react', 'unknown'],
  ['B02', 'gsap', 'blocked'],
  ['B03', 'react-spring', 'unknown'],
  ['B04', 'dotlottie', 'blocked'],
  ['B05', 'rive-react', 'blocked'],
  ['B06', 'ant-design', 'unknown'],
  ['B07', 'mui', 'unknown'],
  ['B08', 'mantine', 'unknown'],
]) {
  test(`@${id} original fixed README and evidenced homepage ${status}`, async ({ page }) => {
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
