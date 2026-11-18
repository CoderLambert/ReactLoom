import { expect, test } from '@playwright/test'

test('@C20 one complete experiment and legacy scenario links retain a usable demo', async ({
  page,
}) => {
  await page.goto('/libraries/clsx?tab=demo&example=basic')
  await expect(page.getByRole('heading', { name: '从组件状态到 className' })).toBeVisible()
  await page.getByLabel('选中', { exact: true }).check()
  await expect(page.getByTestId('class-output')).toContainText('is-selected')
  const scenario = page.getByRole('combobox', { name: '学习场景' })
  await expect(scenario.locator('option')).toHaveCount(1)
  await page.goto('/libraries/clsx?tab=demo&example=business')
  await expect(page.getByRole('heading', { name: '从组件状态到 className' })).toBeVisible()
  await expect(page.getByLabel('选中', { exact: true })).not.toBeChecked()
  await expect(page.getByTestId('class-output')).not.toContainText('is-selected')
  await page.getByRole('button', { name: '重置此示例' }).click()
  await expect(page.getByRole('heading', { name: '从组件状态到 className' })).toBeVisible()
  await expect(page.getByLabel('选中', { exact: true })).not.toBeChecked()
  await expect(page.getByTestId('class-output')).not.toContainText('is-selected')
})
