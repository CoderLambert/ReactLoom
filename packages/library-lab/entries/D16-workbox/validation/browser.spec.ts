import { expect, test } from '@playwright/test'

for (const level of ['basic', 'business', 'advanced']) {
  test(`@D16 ${level} displays the declared local recipe without a browser execution button`, async ({
    page,
  }) => {
    await page.goto(`/libraries/workbox?tab=demo&example=${level}`)
    const recipe = page.locator('.cli-repro')
    await expect(
      recipe.getByRole('heading', { name: '真实可复现的本地命令', exact: true }),
    ).toBeVisible()
    await expect(recipe).toContainText(`node entries/D16-workbox/examples/${level}.mjs`)
    await expect(recipe).toContainText('网页只展示命令，不执行任意 shell')
    await expect(recipe.getByRole('button', { name: '复制运行命令', exact: true })).toBeVisible()
    // Display coverage only: no navigator.serviceWorker.register or offline claims.
  })
}
