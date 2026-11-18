import { expect, test } from '@playwright/test'

test('@D11 atom writes update derived values and only the selected story', async ({ page }) => {
  await page.goto('/libraries/jotai?tab=demo&example=business')
  const a = page.getByRole('article', { name: '团队 A原子状态', exact: true })
  await a.getByRole('button', { name: '当前计数 +1', exact: true }).click()
  await expect(a.getByTestId('jotai-count-团队 A')).toHaveText('count = 1，derived double = 2')
  await a.getByRole('checkbox', { name: '前端性能监控', exact: true }).check()
  await expect(a.getByTestId('jotai-unread-团队 A')).toHaveText('未读：1 / 2')
  await expect(a.getByRole('checkbox', { name: '测试场景矩阵', exact: true })).not.toBeChecked()
  await a.getByRole('button', { name: '只重置此 Store 的计数', exact: true }).click()
  await expect(a.getByTestId('jotai-count-团队 A')).toHaveText('count = 0，derived double = 0')
  await expect(a.getByTestId('jotai-unread-团队 A')).toHaveText('未读：1 / 2')
})

test('@D11 keyed session replacement resets A while sibling B keeps its Store values', async ({
  page,
}) => {
  await page.goto('/libraries/jotai?tab=demo&example=advanced')
  const a = page.getByRole('article', { name: '团队 A原子状态', exact: true })
  const b = page.getByRole('article', { name: '团队 B原子状态', exact: true })
  for (const app of [a, b]) {
    await app.getByRole('button', { name: '当前计数 +1', exact: true }).click()
    await app.getByRole('checkbox', { name: '前端性能监控', exact: true }).check()
  }
  await page.getByRole('button', { name: '退出并新建团队 A 会话', exact: true }).click()
  await expect(a.getByTestId('jotai-count-团队 A')).toHaveText('count = 0，derived double = 0')
  await expect(a.getByTestId('jotai-unread-团队 A')).toHaveText('未读：2 / 2')
  await expect(b.getByTestId('jotai-count-团队 B')).toHaveText('count = 1，derived double = 2')
  await expect(b.getByTestId('jotai-unread-团队 B')).toHaveText('未读：1 / 2')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(b).toHaveCount(0)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(b.getByTestId('jotai-count-团队 B')).toHaveText('count = 0，derived double = 0')
})
