import { expect, test } from '@playwright/test'

test('@F13 Lab only displays standalone CLI recipes and official sources', async ({ page }) => {
  for (const level of ['basic', 'business', 'advanced']) {
    await page.goto(`/libraries/playwright?tab=demo&example=${level}`)
    await expect(
      page
        .getByText(
          `pnpm exec playwright test --config=entries/F13-playwright/examples/playwright.config.ts entries/F13-playwright/examples/${level}.spec.ts`,
          { exact: false },
        )
        .first(),
    ).toBeVisible()
    await expect(page.getByText('Node', { exact: false }).first()).toBeVisible()
  }
  await page.goto('/libraries/playwright?tab=readme')
  await expect(page.getByText('README.md', { exact: false }).first()).toBeVisible()
  // CLI executions and Chromium workshop results are separate from this display check.
})
