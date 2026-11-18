import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

const recipes = [
  [
    'F13',
    'playwright',
    (level: string) =>
      `pnpm exec playwright test --config=entries/F13-playwright/examples/playwright.config.ts entries/F13-playwright/examples/${level}.spec.ts`,
  ],
  [
    'F14',
    'storybook',
    () =>
      'pnpm exec storybook dev --no-open -p 6029 --config-dir entries/F14-storybook/examples/.storybook',
  ],
  [
    'F15',
    'knip',
    (level: string) =>
      `pnpm exec knip --directory entries/F15-knip/examples/workspace --config knip.${level}.json${level === 'advanced' ? ' --production' : ''}`,
  ],
  [
    'F16',
    'dependency-cruiser',
    (level: string) => `node entries/F16-dependency-cruiser/examples/run.mjs ${level}`,
  ],
] as const

for (const [id, slug, command] of recipes) {
  test(`@${id} the CLI recipes show the actual standalone commands`, async ({ page }) => {
    await page.goto(`/libraries/${slug}?tab=demo&example=basic`)
    for (const level of ['basic', 'business', 'advanced']) {
      await page.getByRole('combobox', { name: '学习场景' }).selectOption(level)
      await expect(page.getByText(command(level), { exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: '真实源码', exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: '运行当前示例' })).toHaveCount(0)
    }
  })
}

for (const [id, slug] of [...recipes, ['F17', 'axe-core'] as const]) {
  test(`@${id} official original and iframe policy match the reviewed source metadata`, async ({
    page,
  }) => {
    const metadata = JSON.parse(
      await readFile(new URL(`../entries/${id}-${slug}/library.json`, import.meta.url), 'utf8'),
    )
    await page.goto(`/libraries/${slug}?tab=readme`)
    await expect(page.getByRole('heading', { name: '官方 README 原文', exact: true })).toBeVisible()
    await expect(page.locator('.prose')).not.toBeEmpty()
    await expect(page.getByRole('link', { name: '打开上游原文' })).toHaveAttribute(
      'href',
      metadata.official.readme.sourceUrl,
    )
    await page.getByRole('tab', { name: '官网预览', exact: true }).click()
    await expect(page.getByRole('link', { name: /打开官网|打开官方仓库/u })).toHaveAttribute(
      'href',
      metadata.official.homepage.url,
    )
    await expect(page.locator('iframe')).toHaveCount(0)
    const load = page.getByRole('button', { name: '加载官网预览', exact: true })
    if (metadata.official.homepage.status === 'blocked') await expect(load).toHaveCount(0)
    else await expect(load).toBeVisible()
  })
}
