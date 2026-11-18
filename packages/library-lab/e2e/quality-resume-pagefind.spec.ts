import { expect, test } from '@playwright/test'

test('@D21 three Node recipes display commands without launching a search host', async ({
  page,
}) => {
  for (const level of ['basic', 'business', 'advanced']) {
    await page.goto(`/libraries/pagefind?tab=demo&example=${level}`)
    const panel = page.locator('.cli-repro')
    await expect(panel.getByRole('heading', { name: '真实可复现的本地命令' })).toBeVisible()
    await expect(panel).toContainText(`node entries/D21-pagefind/examples/${level}.mjs ${level}`)
    await expect(panel).toContainText('网页只展示命令')
    await expect(page.getByRole('button', { name: '运行当前示例', exact: true })).toHaveCount(0)
    await expect(page.locator('input[type="search"]')).toHaveCount(0)
  }
})
