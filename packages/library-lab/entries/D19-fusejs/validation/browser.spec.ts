import { expect, test } from '@playwright/test'

test('@D19 weighted search, scoped category and composition submission', async ({ page }) => {
  await page.goto('/libraries/fusejs?tab=demo&example=business')
  const app = page.getByRole('region', { name: 'Fuse.js 浏览器模糊搜索', exact: true })
  const input = app.getByLabel('检索关键词', { exact: true })
  await expect(app.getByTestId('fuse-hit-01')).toBeVisible()
  await app.getByLabel('频道分组', { exact: true }).selectOption('商业')
  await expect(app.getByTestId('fuse-hit-01')).toHaveCount(0)
  await input.fill('')
  await app.getByRole('button', { name: '开始检索', exact: true }).click()
  await expect(app.getByTestId('fuse-hit-04')).toBeVisible()
  await input.dispatchEvent('compositionstart')
  await input.fill('React')
  await app.getByRole('button', { name: '开始检索', exact: true }).click()
  await expect(app.getByTestId('fuse-hit-04')).toBeVisible()
  await input.dispatchEvent('compositionend')
  await app.getByRole('button', { name: '开始检索', exact: true }).click()
  await expect(app.getByTestId('fuse-hit-04')).toHaveCount(0)
  await app.getByLabel('频道分组', { exact: true }).selectOption('技术')
  await expect(app.getByTestId('fuse-hit-01')).toBeVisible()
})

test('@D19 actual index replacement and deletion remove old searchable content', async ({
  page,
}) => {
  await page.goto('/libraries/fusejs?tab=demo&example=advanced')
  const app = page.getByRole('region', { name: 'Fuse.js 浏览器模糊搜索', exact: true })
  await app.getByRole('button', { name: '新增或恢复 RSS（React）', exact: true }).click()
  await expect(app.getByTestId('fuse-hit-imported-rss')).toContainText('React Query')
  await app.getByRole('button', { name: '同 ID 替换为 TypeScript', exact: true }).click()
  await expect(app.getByTestId('fuse-hit-imported-rss')).toHaveCount(0)
  await app.getByLabel('检索关键词', { exact: true }).fill('TypeScript')
  await app.getByRole('button', { name: '开始检索', exact: true }).click()
  await expect(app.getByTestId('fuse-hit-imported-rss')).toContainText('TypeScript 专题替换')
  await app.getByRole('button', { name: '删除导入的 RSS', exact: true }).click()
  await expect(app.getByTestId('fuse-hit-imported-rss')).toHaveCount(0)
  await app.getByLabel('检索关键词', { exact: true }).fill('React')
  await app.getByRole('button', { name: '开始检索', exact: true }).click()
  await app.getByRole('button', { name: '新增或恢复 RSS（React）', exact: true }).click()
  await expect(app.getByTestId('fuse-hit-imported-rss')).toContainText('React Query')
})

test('@D19 basic displays scores and advanced threshold changes typo matching', async ({
  page,
}) => {
  await page.goto('/libraries/fusejs?tab=demo&example=basic')
  const app = page.getByRole('region', { name: 'Fuse.js 浏览器模糊搜索', exact: true })
  await expect(app.getByTestId('fuse-hit-01')).toContainText('越小越相似')
  await expect(app.getByTestId('fuse-hit-03')).toBeVisible()
  await expect(app.getByLabel('频道分组', { exact: true })).toHaveCount(0)
  await page.goto('/libraries/fusejs?tab=demo&example=advanced')
  await app.getByLabel('容错阈值', { exact: true }).selectOption('0')
  await expect(app.getByTestId('fuse-hit-03')).toHaveCount(0)
  await app.getByLabel('容错阈值', { exact: true }).selectOption('0.35')
  await expect(app.getByTestId('fuse-hit-03')).toBeVisible()
})
