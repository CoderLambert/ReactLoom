import { expect, type Page, test } from '@playwright/test'

const path = '/libraries/react-flow?tab=demo&example=advanced'
async function open(page: Page) {
  await page.goto(path)
  return page.getByRole('region', { name: '低代码审批工作台' })
}
async function submit(page: Page, amount: string) {
  const app = page.getByRole('region', { name: '低代码审批工作台' })
  await app.getByRole('button', { name: '填写申请', exact: true }).click()
  await app.getByLabel('申请人 *', { exact: true }).fill('Ada')
  await app.getByLabel('报销金额 *', { exact: true }).fill(amount)
  await app.getByLabel('费用类型 *', { exact: true }).selectOption('差旅')
  await app.getByLabel('申请说明 *', { exact: true }).fill('客户拜访')
  await app.getByRole('button', { name: '提交申请', exact: true }).click()
}

test('@A06 configured fields render; large requests execute real branches and survive reload', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const app = await open(page)
  await expect(app.locator('.react-flow__node')).toHaveCount(5)
  await page.screenshot({ path: '.local-evidence/a06/designer.png', fullPage: true })
  await app.getByLabel('字段名称 4').fill('报销事由')
  await app.getByRole('button', { name: '发布流程', exact: true }).click()
  await app.getByRole('button', { name: '填写申请', exact: true }).click()
  await expect(app.getByLabel('报销事由 *')).toBeVisible()
  await app.getByLabel('申请人 *', { exact: true }).fill('Ada')
  await app.getByLabel('报销金额 *', { exact: true }).fill('5000')
  await app.getByLabel('费用类型 *', { exact: true }).selectOption('差旅')
  await app.getByLabel('报销事由 *').fill('客户拜访')
  await app.getByRole('button', { name: '提交申请', exact: true }).click()
  await expect(app.getByTestId('request-status')).toContainText('待审批：直属经理')
  await app.getByLabel('当前操作角色').selectOption('财务')
  await expect(app.getByRole('button', { name: '通过申请', exact: true })).toBeDisabled()
  await app.getByLabel('当前操作角色').selectOption('直属经理')
  await app.getByRole('button', { name: '通过申请', exact: true }).click()
  await expect(app.getByTestId('request-status')).toContainText('待审批：财务')
  await page.reload()
  await app.getByRole('button', { name: '工单中心', exact: true }).click()
  await expect(app.getByTestId('request-status')).toContainText('待审批：财务')
  await app.getByLabel('当前操作角色').selectOption('财务')
  await app.getByRole('button', { name: '通过申请', exact: true }).click()
  await expect(app.getByTestId('request-status')).toHaveText('审批通过')
  await expect(app.getByTestId('request-history')).toContainText('满足条件')
  await page.screenshot({ path: '.local-evidence/a06/request.png', fullPage: true })
  expect(errors).toEqual([])
})

test('@A06 small requests and rejection, old instances remain pinned to their release', async ({
  page,
}) => {
  const app = await open(page)
  await app.getByRole('button', { name: '发布流程', exact: true }).click()
  await submit(page, '200')
  await app.getByRole('button', { name: '配置流程', exact: true }).click()
  await app.getByRole('button', { name: '编辑节点 经理审核', exact: true }).click()
  await app.getByLabel('审批角色').fill('新经理')
  await app.getByRole('button', { name: '发布流程', exact: true }).click()
  await app.getByRole('button', { name: '工单中心', exact: true }).click()
  await expect(app.getByTestId('request-status')).toContainText('直属经理')
  await expect(app.getByTestId('request-version')).toContainText('v1')
  await app.getByRole('button', { name: '通过申请', exact: true }).click()
  await expect(app.getByTestId('request-status')).toHaveText('审批通过')
  await submit(page, '8000')
  await app.getByLabel('当前操作角色').selectOption('新经理')
  await app.getByLabel('审批意见').fill('缺少发票')
  await app.getByRole('button', { name: '驳回申请', exact: true }).click()
  await expect(app.getByTestId('request-status')).toHaveText('已驳回')
  await expect(app.getByTestId('request-history')).toContainText('缺少发票')
})

test('@A06 invalid connections, node deletion and corrupt import preserve existing data', async ({
  page,
}) => {
  const app = await open(page)
  await app.getByLabel('连线起点').selectOption('manager')
  await app.getByLabel('连线终点').selectOption('manager')
  await app.getByRole('button', { name: '添加连线', exact: true }).click()
  await expect(app.getByRole('alert')).toContainText('self-loop')
  await app.getByRole('button', { name: '编辑节点 财务复核', exact: true }).click()
  await app.getByRole('button', { name: '删除当前节点', exact: true }).click()
  await expect(app.locator('.react-flow__node')).toHaveCount(4)
  await app.getByRole('button', { name: '发布流程', exact: true }).click()
  await expect(app.getByRole('alert')).toContainText('出口')
  await app.getByText('JSON 配置导入 / 导出', { exact: true }).click()
  await app.getByLabel('流程 JSON').fill('{"schemaVersion":999}')
  await app.getByRole('button', { name: '导入配置', exact: true }).click()
  await expect(app.getByRole('alert')).toBeVisible()
  await expect(app.locator('.react-flow__node')).toHaveCount(4)
  await app.getByRole('button', { name: '保存工作区', exact: true }).click()
  await page.reload()
  await expect(app.locator('.react-flow__node')).toHaveCount(4)
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
})

test('@A06 a changed threshold drives execution and stale tabs cannot erase requests', async ({
  page,
  context,
}) => {
  const app = await open(page)
  await app.getByRole('button', { name: '编辑节点 大额费用判断', exact: true }).click()
  await app.getByLabel('大于等于阈值').fill('20000')
  await app.getByRole('button', { name: '发布流程', exact: true }).click()
  const stale = await context.newPage()
  const other = await open(stale)
  await expect(other.getByText('已发布 v1', { exact: true })).toBeVisible()
  await submit(page, '8000')
  await app.getByRole('button', { name: '通过申请', exact: true }).click()
  await expect(app.getByTestId('request-status')).toHaveText('审批通过')
  await other.getByRole('button', { name: '保存工作区', exact: true }).click()
  await expect(other.getByRole('alert')).toContainText('其他页面已更新')
  await stale.reload()
  await other.getByRole('button', { name: '工单中心', exact: true }).click()
  await expect(other.getByTestId('request-status')).toHaveText('审批通过')
  await stale.close()
})

test('@A06 real canvas drag and Handle reconnection persist; mobile fits the screen', async ({
  page,
}) => {
  const app = await open(page)
  const node = app.locator('.react-flow__node[data-id="manager"]')
  const before = await node.getAttribute('style')
  const title = node.locator('strong')
  await title.scrollIntoViewIfNeeded()
  const box = await title.boundingBox()
  expect(box).not.toBeNull()
  if (!box) throw new Error('节点未布局')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 20, box.y + box.height / 2 + 25, { steps: 8 })
  await page.mouse.up()
  await expect(node).not.toHaveAttribute('style', before ?? '')
  await app.getByRole('button', { name: '删除连线 e-manager-next', exact: true }).click()
  await expect(app.locator('.react-flow__edge')).toHaveCount(4)
  await app.locator('.lc-canvas').scrollIntoViewIfNeeded()
  const from = await node.locator('[data-handleid="next"]').boundingBox()
  const to = await app
    .locator('.react-flow__node[data-id="condition"] [data-handleid="in"]')
    .boundingBox()
  if (!from || !to) throw new Error('Handle 未布局')
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 })
  await page.mouse.up()
  await expect(app.locator('.react-flow__edge')).toHaveCount(5)
  await app.getByRole('button', { name: '保存工作区', exact: true }).click()
  await page.reload()
  await expect(app.locator('.react-flow__edge')).toHaveCount(5)
  await page.setViewportSize({ width: 390, height: 844 })
  expect(
    await app.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
  ).toBeTruthy()
  await page.screenshot({ path: '.local-evidence/a06/mobile.png', fullPage: true })
})
