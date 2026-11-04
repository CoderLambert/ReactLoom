import { expect, test } from '@playwright/test'

test('@C20 selecting a scenario loads that demo and drops the previous run state', async ({
  page,
}) => {
  await page.goto('/libraries/clsx?tab=demo&example=basic')
  await expect(page.getByRole('heading', { name: '条件类名' })).toBeVisible()
  await page.getByLabel('选中', { exact: true }).check()
  await expect(page.getByTestId('class-output')).toContainText('is-selected')
  const scenario = page.getByRole('combobox', { name: '学习场景' })
  await scenario.selectOption('business')
  await expect(page.getByRole('heading', { name: '新闻卡片状态' })).toBeVisible()
  await expect(page.getByLabel('选中', { exact: true })).not.toBeChecked()
  await expect(page.getByTestId('class-output')).not.toContainText('is-selected')
  await scenario.selectOption('basic')
  await expect(page.getByRole('heading', { name: '条件类名' })).toBeVisible()
  await expect(page.getByLabel('选中', { exact: true })).not.toBeChecked()
  await expect(page.getByTestId('class-output')).not.toContainText('is-selected')
})
