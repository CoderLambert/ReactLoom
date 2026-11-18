import { expect, test } from '@playwright/test'

test('@F16 Lab shows isolated CLI commands and official pinned sources', async ({ page }) => {
  for (const level of ['basic', 'business', 'advanced']) {
    await page.goto(`/libraries/dependency-cruiser?tab=demo&example=${level}`)
    await expect(
      page
        .getByText(`node entries/F16-dependency-cruiser/examples/run.mjs ${level}`, {
          exact: false,
        })
        .first(),
    ).toBeVisible()
    await expect(page.getByText('Node', { exact: false }).first()).toBeVisible()
  }
  await page.goto('/libraries/dependency-cruiser?tab=readme')
  await expect(page.getByText('README.md', { exact: false }).first()).toBeVisible()
  // Display is not execution; actual six CLI process records live in local validation.
})
