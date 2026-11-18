import { expect, test } from '@playwright/test'

test('@B09 local variants compose real classes and native disabled blocks activation', async ({
  page,
}) => {
  await page.goto('/libraries/shadcn-ui?tab=demo&example=basic')
  const app = page.getByTestId('b09-workshop')
  await app.getByRole('combobox', { name: '尺寸', exact: true }).selectOption('sm')
  await expect(app.getByTestId('b09-class-output')).toContainText('px-3')
  await app.getByRole('checkbox', { name: '用 px-8 覆盖间距', exact: true }).check()
  await expect(app.getByTestId('b09-class-output')).toContainText('px-8')
  await expect(app.getByTestId('b09-class-output')).not.toContainText('px-3')
  const button = app.getByTestId('b09-button-preview')
  await expect
    .poll(() => button.evaluate((element) => getComputedStyle(element).paddingLeft))
    .toBe('32px')
  await button.focus()
  await button.press('Enter')
  await expect(app.getByTestId('b09-activation-count')).toContainText(/已触发\s*1\s*次/u)
  await app.getByRole('checkbox', { name: '禁用预览按钮', exact: true }).check()
  await expect(button).toBeDisabled()
  await expect(app.getByTestId('b09-activation-count')).toContainText(/已触发\s*1\s*次/u)
})

test('@B09 failed archiving preserves selection and retry or cancellation changes actual rows', async ({
  page,
}) => {
  await page.clock.install()
  await page.goto('/libraries/shadcn-ui?tab=demo&example=business')
  const app = page.getByTestId('b09-workshop')
  const status = app.getByTestId('b09-archive-status')
  const selected = app.getByRole('checkbox', { name: 'React 工程工具精选', exact: true })
  const failure = app.getByRole('checkbox', { name: '模拟归档失败', exact: true })
  await failure.check()
  await selected.check()
  await app.getByRole('button', { name: '归档已选 1 项', exact: true }).click()
  await page.clock.runFor(300)
  await expect(status).toHaveAttribute('data-state', 'error')
  await expect(selected).toBeChecked()
  await expect(app.getByTestId('b09-archive-count')).toContainText(/1\s*\/\s*3/u)
  await failure.uncheck()
  await app.getByRole('button', { name: '归档已选 1 项', exact: true }).click()
  await page.clock.runFor(300)
  await expect(status).toHaveAttribute('data-state', 'success')
  await expect(app.getByTestId('b09-archive-count')).toContainText(/2\s*\/\s*3/u)
  await app.getByRole('button', { name: '恢复示例文章', exact: true }).click()
  await app.getByRole('checkbox', { name: '架构复盘周报', exact: true }).check()
  await app.getByRole('button', { name: '归档已选 1 项', exact: true }).click()
  await app.getByRole('button', { name: '取消本次归档', exact: true }).click()
  await page.clock.runFor(500)
  await expect(status).toHaveAttribute('data-state', 'cancelled')
  await expect(app.getByTestId('b09-archive-count')).toContainText(/1\s*\/\s*3/u)
})

test('@B09 Slot preserves link navigation and permission removal restores non-link semantics', async ({
  page,
}) => {
  await page.goto('/libraries/shadcn-ui?tab=demo&example=advanced')
  const app = page.getByTestId('b09-workshop')
  const link = app.getByTestId('b09-slot-link')
  await expect(link).toHaveAttribute('href', '#b09-slot-target')
  await link.focus()
  await link.press('Enter')
  await expect(page).toHaveURL(/#b09-slot-target$/u)
  await app.getByRole('checkbox', { name: '允许打开示例详情', exact: true }).uncheck()
  await expect(link).toHaveAttribute('aria-disabled', 'true')
  await expect(link).not.toHaveAttribute('href')
  await expect(app.getByTestId('b09-native-disabled')).toBeDisabled()
})

test('@A06 the minimal controlled graph moves, reconnects real Handles, and resets', async ({
  page,
}) => {
  await page.goto('/libraries/react-flow?tab=demo&example=basic')
  const primer = page.getByRole('region', { name: 'React Flow 图编辑入门', exact: true })
  await expect(primer).toBeVisible()
  const state = primer.getByTestId('primer-state-json')
  const initial = await state.textContent()
  const source = primer.locator('.react-flow__node[data-id="source"]')
  const style = await source.getAttribute('style')
  await primer.getByRole('button', { name: '源节点向右移动 40', exact: true }).click()
  await expect(source).not.toHaveAttribute('style', style ?? '')
  await expect(state).not.toHaveText(initial ?? '')
  await primer.getByRole('button', { name: '清空入门连线', exact: true }).click()
  await expect(primer.locator('.react-flow__edge')).toHaveCount(0)
  await primer.locator('.rf-primer-canvas').scrollIntoViewIfNeeded()
  const from = await source.locator('[data-handleid="out"]').boundingBox()
  const to = await primer
    .locator('.react-flow__node[data-id="target"] [data-handleid="in"]')
    .boundingBox()
  if (!from || !to) throw new Error('入门图 Handle 未布局')
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 })
  await page.mouse.up()
  await expect(primer.locator('.react-flow__edge')).toHaveCount(1)
  const graph: {
    edges: { source: string; target: string; sourceHandle: string; targetHandle: string }[]
  } = JSON.parse((await state.textContent()) ?? '{}')
  expect(graph.edges[0]).toMatchObject({
    source: 'source',
    target: 'target',
    sourceHandle: 'out',
    targetHandle: 'in',
  })
  await primer.getByRole('button', { name: '重置入门图', exact: true }).click()
  await expect(state).toHaveText(initial ?? '')
  await expect(page.getByRole('region', { name: '低代码审批工作台', exact: true })).toBeVisible()
  await page.getByRole('tab', { name: '详细文档', exact: true }).click()
  await expect(primer).toHaveCount(0)
})

test('@A01 setOption updates the actual chart and table without replacing the instance', async ({
  page,
}) => {
  await page.goto('/libraries/echarts?tab=demo&example=basic')
  const app = page.getByTestId('a01-workshop')
  const chart = app.getByTestId('a01-chart')
  await expect(chart.locator('canvas')).toHaveCount(1)
  const id = await chart.getAttribute('data-instance-id')
  await expect(app.getByTestId('a01-total')).toContainText('158')
  await app.getByRole('button', { name: '周一阅读量 +5', exact: true }).click()
  await expect(app.getByTestId('a01-total')).toContainText('163')
  await expect(chart).toHaveAttribute('data-instance-id', id ?? '')
  await app.getByText('查看传入 setOption 的核心配置', { exact: true }).click()
  await expect(app.getByTestId('a01-option')).toContainText('17')
  await app.getByRole('button', { name: '复位业务数据', exact: true }).click()
  await expect(app.getByTestId('a01-total')).toContainText('158')
})

test('@A01 comparison series can actually be removed and resize preserves its instance', async ({
  page,
}) => {
  await page.goto('/libraries/echarts?tab=demo&example=business')
  const app = page.getByTestId('a01-workshop')
  await app.getByText('查看传入 setOption 的核心配置', { exact: true }).click()
  await expect(app.getByTestId('a01-option')).toContainText('previous-reads')
  await app.getByRole('checkbox', { name: '显示上周对照', exact: true }).uncheck()
  await expect(app.getByTestId('a01-option')).not.toContainText('previous-reads')
  await app.getByRole('checkbox', { name: '显示上周对照', exact: true }).check()
  await expect(app.getByTestId('a01-option')).toContainText('previous-reads')
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('advanced')
  const chart = app.getByTestId('a01-chart')
  await expect(chart.locator('canvas')).toHaveCount(1)
  const id = await chart.getAttribute('data-instance-id')
  const width = await chart.evaluate((element) => element.getBoundingClientRect().width)
  await app.getByRole('button', { name: '缩小容器，观察 resize', exact: true }).click()
  await expect
    .poll(() => chart.evaluate((element) => element.getBoundingClientRect().width))
    .toBeLessThan(width * 0.8)
  await expect(chart).toHaveAttribute('data-instance-id', id ?? '')
})

for (const [entryId, slug] of [
  ['B09', 'shadcn-ui'],
  ['A06', 'react-flow'],
  ['A01', 'echarts'],
]) {
  test(`@${entryId} official README and homepage limitation retain traceable exits`, async ({
    page,
  }) => {
    await page.goto(`/libraries/${slug}?tab=readme`)
    await expect(page.getByRole('heading', { name: '官方 README 原文', exact: true })).toBeVisible()
    await expect(page.locator('.prose')).not.toBeEmpty()
    await expect(page.getByRole('link', { name: '打开上游原文' })).toHaveAttribute(
      'href',
      /\/[a-f0-9]{40}\//u,
    )
    await page.getByRole('tab', { name: '官网预览', exact: true }).click()
    await expect(page.getByRole('link', { name: /打开官网|打开官方仓库/u })).toHaveAttribute(
      'href',
      /^https:/u,
    )
    await expect(page.locator('iframe')).toHaveCount(0)
  })
}
