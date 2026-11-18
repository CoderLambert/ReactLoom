import { expect, test } from '@playwright/test'

test('F04 Node-only scenarios show exact commands and actual sources, not a browser workbook runner @F04', async ({
  page,
}) => {
  for (const level of ['basic', 'business', 'advanced']) {
    await page.goto(`/libraries/exceljs?tab=demo&example=${level}`)
    await expect(
      page
        .getByText(`node entries/F04-exceljs/examples/${level}.mjs ${level}`, { exact: false })
        .first(),
    ).toBeVisible()
    // Displaying a command cannot prove that ExcelJS executed or produced a workbook.
    await expect(page.getByText('Node', { exact: false }).first()).toBeVisible()
  }
  await page.goto('/libraries/exceljs?tab=readme')
  await expect(page.getByText('README_zh.md', { exact: false }).first()).toBeVisible()
  // The main controller handles the common source panel and pinned-source assertions.
})
