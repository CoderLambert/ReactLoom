import { expect, test } from '@playwright/test'

test('@C13 shared-origin preview stays blocked and canonical keyboard table source remains readable', async ({
  page,
}) => {
  await page.goto('/libraries/frappe-gantt?tab=demo&example=business')
  await expect(page.getByRole('heading', { name: 'Frappe Gantt', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '运行当前示例' })).toHaveCount(0)
  await expect(page.getByRole('note')).toContainText('专用隔离 origin')
  await expect(page.getByText(/document mouseup 监听无公开释放 API/u)).toBeVisible()
  await page.getByRole('combobox', { name: '查看源码文件' }).selectOption('examples/example.tsx')
  const source = page.locator('.source-viewer')
  await expect(source).toContainText('等效键盘可编辑任务列表')
  await expect(source).toContainText('validatePlan(candidate)')
  await expect(page.locator('.demo-stage svg.gantt')).toHaveCount(0)
})
