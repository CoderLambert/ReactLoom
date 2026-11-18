import { expect, test } from '@playwright/test'

test('@D03 observed concurrency follows the selected limit and actual jobs finish', async ({
  page,
}) => {
  await page.goto('/libraries/p-limit?tab=demo&example=basic')
  const app = page.getByRole('region', { name: 'p-limit 真实并发调度', exact: true })
  await expect(app.getByTestId('d03-metrics')).toBeVisible()
  for (const limit of ['1', '4']) {
    await app.getByRole('combobox', { name: '并发数', exact: true }).selectOption(limit)
    await app.getByRole('button', { name: '运行批处理', exact: true }).click()
    await expect(app.locator('.demo-job[data-state="done"]')).toHaveCount(6, { timeout: 15_000 })
    await expect(app.getByTestId('d03-peak')).toHaveText(limit)
    await expect(
      app.locator('.demo-job[data-state="running"], .demo-job[data-state="queued"]'),
    ).toHaveCount(0)
  }
})

test('@D03 failures remain failures and cancellation leaves no queued or running tasks', async ({
  page,
}) => {
  await page.goto('/libraries/p-limit?tab=demo&example=advanced')
  const app = page.getByRole('region', { name: 'p-limit 真实并发调度', exact: true })
  await app.getByRole('combobox', { name: '并发数', exact: true }).selectOption('4')
  await app.getByRole('button', { name: '运行批处理', exact: true }).click()
  await expect(app.locator('.demo-job[data-state="done"]')).toHaveCount(9, { timeout: 15_000 })
  await expect(app.locator('.demo-job[data-state="error"]')).toHaveCount(1)
  await app.getByRole('button', { name: '运行批处理', exact: true }).click()
  await app.getByRole('button', { name: '取消任务', exact: true }).click()
  await expect(
    app.locator('.demo-job[data-state="running"], .demo-job[data-state="queued"]'),
  ).toHaveCount(0)
  await expect(app.locator('.demo-job[data-state="cancelled"]')).not.toHaveCount(0)
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(app).toContainText('尚未运行')
})

test('@B13 keyboard sorting updates actual order and preserves hidden identities', async ({
  page,
}) => {
  await page.goto('/libraries/dnd-kit?tab=demo&example=basic')
  const app = page.getByTestId('b13-workshop')
  const handle = app.getByRole('button', { name: '拖动 技术快讯', exact: true })
  await handle.focus()
  await handle.press('Space')
  await handle.press('ArrowDown')
  await expect(page.getByRole('status').filter({ hasText: /droppable area ai/u })).toHaveCount(1)
  await handle.press('Space')
  await expect(app.locator('li[data-item-id]').first()).toHaveAttribute('data-item-id', 'ai')
  await expect(app.locator('li[data-item-id]').nth(1)).toHaveAttribute('data-item-id', 'tech')
  await expect(app.getByTestId('b13-all-order')).toContainText('news → read → later')
  await expect(app.getByTestId('b13-drag-state')).toContainText('当前没有拖动')
})

test('@B13 lock rejection and undo preserve the real array and pointer drag can be cancelled', async ({
  page,
}) => {
  await page.goto('/libraries/dnd-kit?tab=demo&example=advanced')
  const app = page.getByTestId('b13-workshop')
  const initial = await app.getByTestId('b13-all-order').textContent()
  await expect(app.getByRole('button', { name: '下移 开源趋势', exact: true })).toBeDisabled()
  await expect(app.getByTestId('b13-all-order')).toHaveText(initial ?? '')
  await app.getByRole('button', { name: '下移 技术快讯', exact: true }).click()
  await expect(app.getByTestId('b13-all-order')).not.toHaveText(initial ?? '')
  await app.getByRole('button', { name: '撤销', exact: true }).click()
  await expect(app.getByTestId('b13-all-order')).toHaveText(initial ?? '')
  const handle = app.getByRole('button', { name: '拖动 技术快讯', exact: true })
  await handle.scrollIntoViewIfNeeded()
  const box = await handle.boundingBox()
  if (!box) throw new Error('拖拽手柄未布局')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 15, box.y + box.height / 2 + 20, { steps: 6 })
  await expect(app.getByTestId('b13-drag-state')).not.toContainText('当前没有拖动')
  await page.keyboard.press('Escape')
  await page.mouse.up()
  await expect(app.getByTestId('b13-all-order')).toHaveText(initial ?? '')
})

test('@C07 real v9 row models drive numeric sorting and stable selection identities', async ({
  page,
}) => {
  await page.goto('/libraries/tanstack-table?tab=demo&example=basic')
  const app = page.getByTestId('c07-workshop')
  const rows = app.getByTestId('c07-table').locator('tbody tr[data-row-id]')
  await expect(rows).toHaveCount(18)
  await rows.first().getByRole('checkbox').check()
  const selected = await rows.first().getAttribute('data-row-id')
  const sort = app.getByRole('button', { name: /^订阅数/u })
  await sort.click()
  await expect(sort).toContainText(/[↑↓]/u)
  if ((await sort.textContent())?.includes('↑')) await sort.click()
  await expect(sort).toContainText('↓')
  await expect(rows.first()).toHaveAttribute('data-row-id', 'feed-117')
  await expect(app.getByTestId('c07-selection')).toHaveAttribute('data-selected-count', '1')
  await app.getByText('查看原始数据、行模型与选择ID', { exact: true }).click()
  const model: {
    coreIds: string[]
    sortedIds: string[]
    visibleIds: string[]
    selectedIds: string[]
  } = JSON.parse((await app.getByTestId('c07-row-model').textContent()) ?? '{}')
  expect(model.coreIds).toHaveLength(18)
  expect(model.sortedIds[0]).toBe('feed-117')
  expect(model.visibleIds).toEqual(model.sortedIds)
  expect(model.selectedIds).toEqual([selected])
})

test('@C07 application filtering and client pagination show five then one matching rows', async ({
  page,
}) => {
  await page.goto('/libraries/tanstack-table?tab=demo&example=business')
  const app = page.getByTestId('c07-workshop')
  await app.getByRole('textbox', { name: '检索RSS来源', exact: true }).fill('技术')
  await app.getByRole('button', { name: '查询', exact: true }).click()
  const rows = app.getByTestId('c07-table').locator('tbody tr[data-row-id]')
  await expect(rows).toHaveCount(5)
  await app.getByRole('button', { name: '下一页', exact: true }).click()
  await expect(rows).toHaveCount(1)
})

test('@C07 server pagination clamps after shrinking and distinguishes 503 from empty results', async ({
  page,
}) => {
  await page.goto('/libraries/tanstack-table?tab=demo&example=advanced')
  const app = page.getByTestId('c07-workshop')
  const rows = app.getByTestId('c07-table').locator('tbody tr[data-row-id]')
  await expect(rows).toHaveCount(5)
  await app.getByRole('button', { name: '下一页', exact: true }).click()
  await expect(app.getByTestId('c07-pager')).toContainText(/第\s*2\s*\/\s*4\s*页/u)
  await expect(rows).toHaveCount(5)
  await app.getByRole('button', { name: '模拟后台缩减到2条', exact: true }).click()
  await expect(rows).toHaveCount(2)
  await expect(app.getByTestId('c07-pager')).toContainText(/第\s*1\s*\/\s*1\s*页/u)
  await app.getByRole('button', { name: /^模拟服务端\s*503$/u }).click()
  await expect(app.getByTestId('c07-status')).toHaveAttribute('data-error', 'true')
  await expect(app.getByTestId('c07-status')).toContainText('503')
  await app.getByRole('button', { name: '恢复并刷新', exact: true }).click()
  await expect(rows).toHaveCount(5)
  await expect(app.getByTestId('c07-status')).toHaveAttribute('data-error', 'false')
})

for (const [entryId, slug] of [
  ['D03', 'p-limit'],
  ['B13', 'dnd-kit'],
  ['C07', 'tanstack-table'],
]) {
  test(`@${entryId} pinned README and checked homepage stay traceable`, async ({ page }) => {
    await page.goto(`/libraries/${slug}?tab=readme`)
    await expect(page.getByRole('heading', { name: '官方 README 原文', exact: true })).toBeVisible()
    await expect(page.locator('.prose')).not.toBeEmpty()
    await expect(page.getByRole('link', { name: '打开上游原文' })).toHaveAttribute(
      'href',
      /\/[a-f0-9]{40}\//u,
    )
    await expect(page.getByRole('alert')).toHaveCount(0)
  })
}
