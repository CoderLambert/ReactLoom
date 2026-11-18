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

test('@D21 official pinned README and unknown homepage preserve direct sources', async ({
  page,
}) => {
  await page.goto('/libraries/pagefind?tab=readme')
  await expect(page.getByRole('heading', { name: '官方 README 原文', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: '打开上游原文 ↗' })).toHaveAttribute(
    'href',
    'https://github.com/Pagefind/pagefind/blob/bf17396721be637cc67c8ed7ead1dc7b8ac43d96/README.md',
  )
  await page.getByRole('tab', { name: '官网预览', exact: true }).click()
  await expect(page.getByRole('link', { name: '打开官网 ↗' })).toHaveAttribute(
    'href',
    'https://pagefind.app/',
  )
  await expect(page.getByRole('button', { name: '加载官网预览', exact: true })).toBeVisible()
  await expect(page.locator('iframe.official-website-frame')).toHaveCount(0)
})
