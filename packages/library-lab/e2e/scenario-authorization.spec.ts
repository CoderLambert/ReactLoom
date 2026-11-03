import { expect, test } from '@playwright/test'

test('@C20 scenario switch never inherits an already-started demo or eager-loads its SDK', async ({
  page,
}) => {
  await page.goto('/libraries/clsx?tab=demo&example=basic')
  await page.getByRole('button', { name: '运行当前示例' }).click()
  await expect(page.getByTestId('class-output')).toBeVisible()
  const scenario = page.getByRole('combobox', { name: '学习场景' })
  await scenario.selectOption('business')
  await expect(page.getByRole('button', { name: '运行当前示例' })).toBeVisible()
  await expect(page.getByRole('button', { name: '停止并卸载' })).toHaveCount(0)
  await expect(page.getByTestId('class-output')).toHaveCount(0)
  await scenario.selectOption('basic')
  await expect(page.getByRole('button', { name: '运行当前示例' })).toBeVisible()
  await expect(page.getByTestId('class-output')).toHaveCount(0)
  await page.getByRole('button', { name: '运行当前示例' }).click()
  await expect(page.getByTestId('class-output')).toBeVisible()
})
