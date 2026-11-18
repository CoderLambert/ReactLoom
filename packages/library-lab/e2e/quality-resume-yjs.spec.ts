import { expect, test } from '@playwright/test'

test('@D17 local transaction emits one pending update', async ({ page }) => {
  await page.goto('/libraries/yjs?tab=demo&example=basic')
  const app = page.getByRole('region', { name: 'Yjs 双副本 CRDT 真实演示', exact: true })
  await app.getByRole('button', { name: 'A 添加 RSS' }).click()
  await expect(app.getByTestId('yjs-a')).toContainText('left-1')
  await expect(app.getByTestId('yjs-stats')).toHaveText('本地事务 1 · 待传更新 1')
  await expect(app.getByTestId('yjs-b')).toHaveCount(0)
})

test('@D17 independent offline edits survive delta merge', async ({ page }) => {
  await page.goto('/libraries/yjs?tab=demo&example=business')
  const app = page.getByRole('region', { name: 'Yjs 双副本 CRDT 真实演示', exact: true })
  await app.getByRole('button', { name: 'A 添加 RSS' }).click()
  await app.getByRole('button', { name: 'B 离线添加' }).click()
  await expect(app.getByTestId('yjs-a')).not.toContainText('right-2')
  await expect(app.getByTestId('yjs-b')).not.toContainText('left-1')
  await app.getByRole('button', { name: '交换增量并合并' }).click()
  for (const id of ['yjs-a', 'yjs-b']) {
    await expect(app.getByTestId(id)).toContainText('left-1')
    await expect(app.getByTestId(id)).toContainText('right-2')
  }
  await expect(app.getByTestId('yjs-stats')).toHaveText('本地事务 2 · 待传更新 0')
})

test('@D17 concurrent title convergence, actual reversed events, scope rejection and remount', async ({
  page,
}) => {
  await page.goto('/libraries/yjs?tab=demo&example=advanced')
  const app = page.getByRole('region', { name: 'Yjs 双副本 CRDT 真实演示', exact: true })
  await app.getByRole('button', { name: 'A 添加 RSS' }).click()
  await app.getByRole('button', { name: 'A 添加 RSS' }).click()
  await app.getByRole('button', { name: 'B 离线添加' }).click()
  await app.getByRole('button', { name: '同时编辑 title' }).click()
  await expect(app.getByTestId('yjs-title-a')).toContainText('A 的标题')
  await expect(app.getByTestId('yjs-title-b')).toContainText('B 的标题')
  await app.getByRole('button', { name: '乱序+重复投递检验' }).click()
  await expect(app.getByRole('status')).toContainText('逆序本地更新 5 条')
  const title = await app.getByTestId('yjs-title-a').textContent()
  await expect(app.getByTestId('yjs-title-b')).toHaveText(title ?? '')
  const before = await app.getByTestId('yjs-a').textContent()
  const other = await app.getByTestId('yjs-b').textContent()
  await app.getByRole('button', { name: '拒绝错误文档信封' }).click()
  await expect(app.getByRole('status')).toContainText('mismatch')
  await expect(app.getByTestId('yjs-a')).toHaveText(before ?? '')
  await expect(app.getByTestId('yjs-b')).toHaveText(other ?? '')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(app.getByTestId('yjs-a')).toHaveText('{}')
  await expect(app.getByTestId('yjs-stats')).toHaveText('本地事务 0 · 待传更新 0')
})
