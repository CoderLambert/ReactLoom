import { expect, test } from '@playwright/test'

test('@D05 editable decimal addition and validation recover without stale output', async ({
  page,
}) => {
  await page.goto('/libraries/decimal-js?tab=demo&example=basic')
  await expect(page.getByTestId('native-number')).toHaveText('0.30000000000000004')
  await expect(page.getByTestId('decimal-value')).toHaveText('0.3')
  await page.getByLabel('右操作数', { exact: true }).fill('0.7')
  await expect(page.getByTestId('decimal-value')).toHaveText('0.8')
  await page.getByLabel('左操作数', { exact: true }).fill('1e3')
  await expect(page.getByRole('alert')).toContainText('非负十进制字符串')
  await expect(page.getByTestId('decimal-value')).toHaveCount(0)
  await page.getByLabel('左操作数', { exact: true }).fill('0.1')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByTestId('decimal-value')).toHaveText('0.8')
})

test('@D05 invoice editing invalidates computed result and bad quantity recovers', async ({
  page,
}) => {
  await page.goto('/libraries/decimal-js?tab=demo&example=business')
  const calculate = page.getByRole('button', { name: '按业务规则计算', exact: true })
  const invoice = page.getByTestId('invoice')
  await calculate.click()
  await expect(invoice).toContainText('"subtotal": "59.97"')
  await expect(invoice).toContainText('"tax": "4.50"')
  await expect(invoice).toContainText('"total": "64.47"')
  await page.getByLabel('数量', { exact: true }).fill('0')
  await expect(invoice).toHaveCount(0)
  await calculate.click()
  await expect(page.getByRole('alert')).toContainText('数量必须是 1–9999 的整数')
  await page.getByLabel('数量', { exact: true }).fill('3')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await calculate.click()
  await expect(invoice).toContainText('"total": "64.47"')
  await page.getByLabel('单价', { exact: true }).fill('0.335')
  await expect(invoice).toHaveCount(0)
  await page.getByLabel('税率', { exact: true }).fill('100')
  await calculate.click()
  await expect(invoice).toContainText('"total": "2.02"')
})

test('@D05 independent rounding boundary view uses two isolated modes', async ({ page }) => {
  await page.goto('/libraries/decimal-js?tab=demo&example=advanced')
  await expect(page.getByTestId('half-up')).toHaveText('1.01')
  await expect(page.getByTestId('half-even')).toHaveText('1.00')
  await expect(page.getByTestId('extended-line')).toHaveText('1.01')
  await expect(page.getByTestId('rounded-unit')).toHaveText('1.02')
  await expect(page.getByLabel('单价', { exact: true })).toHaveCount(0)
})
