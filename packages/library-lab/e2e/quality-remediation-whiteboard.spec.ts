// Uses normal localhost preview and the actual SDK. No env/key injection, SDK mock or page.route.
import { expect, type Locator, type Page, test } from '@playwright/test'

async function mountA10(page: Page, level: 'basic' | 'business' | 'advanced') {
  await page.goto(`/libraries/tldraw?tab=demo&example=${level}`)
  await expect(page.getByTestId('a10-license-gate')).toHaveCount(0)
  const app = page.getByTestId('a10-workshop')
  await expect(app).toHaveAttribute('data-ready', 'true', { timeout: 20_000 })
  await expect(app.getByTestId('canvas')).toBeVisible()
  await app.getByText('查看当前页与保存时的形状身份', { exact: true }).click()
  return app
}

async function drawStroke(page: Page, app: Locator) {
  await app.getByTestId('tools.draw').click()
  const canvas = app.getByTestId('canvas')
  await canvas.scrollIntoViewIfNeeded()
  const box = await canvas.boundingBox()
  if (!box) throw new Error('真实 SDK canvas 未布局')
  // Upper-middle canvas, away from the bottom toolbar and right-hand style panel.
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.5, { steps: 12 })
  await page.mouse.up()
}

test('@A10 actual toolbar draws and normal localhost SDK remains available past license grace', async ({
  page,
}) => {
  const app = await mountA10(page, 'basic')
  await expect(app.getByTestId('a10-shape-count')).toHaveText('0')
  await drawStroke(page, app)
  await expect(app.getByTestId('a10-shape-count')).toHaveText('1')
  const id = (await app.getByTestId('a10-shape-ids').textContent())?.trim()
  expect(id).toMatch(/^shape:/u)
  await expect(
    app.locator(`.tl-shape[data-shape-id="${id}"]:not(.tl-shape-background)`),
  ).toHaveCount(1)
  // The installed SDK hides an invalid production editor after 5000ms.
  // This real wait observes the normal localhost path; no clock/env override bypasses the check.
  await page.waitForTimeout(5500)
  await expect(app.getByTestId('tl-license-expired')).toHaveCount(0)
  await expect(app.getByTestId('tools.draw')).toBeVisible()
  await app.getByRole('button', { name: '清空当前形状', exact: true }).click()
  await expect(app.getByTestId('a10-shape-count')).toHaveText('0')
})

test('@A10 real document save survives later edits and restores the original SDK identities', async ({
  page,
}) => {
  const app = await mountA10(page, 'business')
  await expect(app.getByTestId('a10-shape-count')).toHaveText('4')
  const initial = (await app.getByTestId('a10-shape-ids').textContent()) ?? ''
  expect(initial.trim().split('\n')).toHaveLength(4)
  await expect(app.getByRole('button', { name: '恢复已保存文档', exact: true })).toBeDisabled()
  await app.getByRole('button', { name: '保存文档到内存', exact: true }).click()
  await expect(app.getByTestId('a10-saved-shape-ids')).toHaveText(initial)
  await expect(app.getByTestId('a10-saved-document')).toContainText('当前页 4 个形状')
  await app.getByRole('button', { name: '追加4个流程节点', exact: true }).click()
  await expect(app.getByTestId('a10-shape-count')).toHaveText('8')
  await expect(app.getByTestId('a10-saved-shape-ids')).toHaveText(initial)
  await app.getByRole('button', { name: '恢复已保存文档', exact: true }).click()
  await expect(app.getByTestId('a10-shape-count')).toHaveText('4')
  await expect(app.getByTestId('a10-shape-ids')).toHaveText(initial)
  for (const id of initial.trim().split('\n')) {
    await expect(
      app.locator(`.tl-shape[data-shape-id="${id}"]:not(.tl-shape-background)`),
    ).toHaveCount(1)
  }
  await expect(app.getByTestId('a10-status')).toContainText('已恢复保存时的文档')
  await app.getByRole('button', { name: '清空当前形状', exact: true }).click()
  await expect(app.getByTestId('a10-shape-count')).toHaveText('0')
  await app.getByRole('button', { name: '恢复已保存文档', exact: true }).click()
  await expect(app.getByTestId('a10-shape-ids')).toHaveText(initial)
})

test('@A10 readonly rejects native deletion and writes; stop discards the instance snapshot', async ({
  page,
}) => {
  const app = await mountA10(page, 'advanced')
  await app.getByRole('button', { name: '保存文档到内存', exact: true }).click()
  await app.getByRole('button', { name: '有界批量创建形状', exact: true }).click()
  await expect(app.getByTestId('a10-shape-count')).toHaveText('40')
  await app.getByRole('button', { name: '有界批量创建形状', exact: true }).click()
  await expect(app.getByTestId('a10-shape-count')).toHaveText('76')
  await app.getByRole('button', { name: '有界批量创建形状', exact: true }).click()
  await expect(app.getByTestId('a10-shape-count')).toHaveText('80')
  await app.getByRole('button', { name: '切换只读', exact: true }).click()
  await expect(app).toHaveAttribute('data-readonly', 'true')
  for (const name of ['追加4个流程节点', '有界批量创建形状', '清空当前形状', '恢复已保存文档']) {
    await expect(app.getByRole('button', { name, exact: true })).toBeDisabled()
  }
  await expect(app.getByRole('button', { name: '保存文档到内存', exact: true })).toBeEnabled()
  await expect(app.getByRole('button', { name: '下载文档 JSON', exact: true })).toBeEnabled()
  // Actual SDK canvas keyboard input, not a call into a hidden test Editor.
  await app.getByTestId('canvas').click({ position: { x: 90, y: 90 } })
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Backspace')
  await expect(app.getByTestId('a10-shape-count')).toHaveText('80')
  await app.getByRole('button', { name: '退出只读', exact: true }).click()
  await app.getByRole('button', { name: '恢复已保存文档', exact: true }).click()
  await expect(app.getByTestId('a10-shape-count')).toHaveText('4')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  await expect(page.getByTestId('canvas')).toHaveCount(0)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(app).toHaveAttribute('data-ready', 'true')
  await expect(app.getByTestId('a10-shape-count')).toHaveText('4')
  await expect(app.getByTestId('a10-saved-document')).toHaveText('尚未保存文档')
  await expect(app).toHaveAttribute('data-readonly', 'false')
  await page.getByRole('tab', { name: 'Agent 指南', exact: true }).click()
  await expect(app).toHaveCount(0)
  await expect(page.getByTestId('canvas')).toHaveCount(0)
})

// Browser coverage deliberately does not claim: production license approval, IME, touch,
// screen readers, network collaboration, foreign JSON import or performance benchmarks.
// A real license error is a failure/blocker to report, never an instruction to bypass it.
