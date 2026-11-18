// Complete root integration proposal; author browser NOT_RUN.
// Real Sonner DOM, action/close, actual 900ms/3500ms and native navigation. No SDK/RAF/clock mock.
import { expect, type Locator, type Page, test } from '@playwright/test'

type Level = 'basic' | 'business' | 'advanced'
async function open(page: Page, level: Level, viaAgent = false) {
  await page.setViewportSize({ width: 1100, height: 1000 })
  await page.goto(`/libraries/sonner?tab=${viaAgent ? 'agent' : 'demo'}&example=${level}`)
  if (viaAgent) await page.getByRole('tab', { name: '实战 Demo', exact: true }).click()
  const app = page.getByTestId('b20-workshop')
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  await expect(app.or(run).first()).toBeVisible({ timeout: 20_000 })
  if (await run.isVisible()) await run.click()
  await expect(app).toBeVisible()
  return app
}
function active(app: Locator) {
  return app.locator('[data-sonner-toast][data-removed="false"]')
}
function result(app: Locator) {
  return app.getByTestId('b20-result')
}
async function id(app: Locator) {
  const value = await app.getByTestId('b20-toast-id').textContent()
  if (!value || value === '尚未创建') throw new Error('Missing actual SDK returned id')
  return value
}
async function mountedToast(app: Locator, type?: string) {
  // Type is checked on the real element, not used to manufacture a matching node.
  await expect(active(app)).toHaveCount(1)
  await expect(active(app)).toBeVisible()
  await expect(active(app)).toHaveAttribute('data-mounted', 'true')
  if (type) await expect(active(app)).toHaveAttribute('data-type', type)
  return active(app)
}
async function waitForAutoClose(page: Page, app: Locator) {
  // Hover/interaction pauses Sonner. Move away, then wait on real DOM removal with the real clock.
  await page.mouse.move(20, 20)
  await expect(app.locator('[data-sonner-toast]')).toHaveCount(0, { timeout: 6500 })
}

test('@B20 actual notification styling, close/auto-close and durable business feedback', async ({
  page,
}) => {
  const app = await open(page, 'basic')
  const region = app.getByRole('region', { name: '本演示通知', exact: true })
  await expect(region).toHaveAttribute('aria-live', 'polite')
  await app.getByRole('button', { name: '触发订阅成功提示', exact: true }).click()
  const toast = await mountedToast(app)
  await expect(toast.getByText('已订阅：前端工程', { exact: true })).toBeVisible()
  await expect(result(app)).toHaveText('业务状态：已触发基本通知')
  const firstId = await id(app)
  expect(
    await app.locator('[data-sonner-toaster]').evaluate((node) => getComputedStyle(node).position),
  ).toBe('fixed')
  expect(await toast.evaluate((node) => getComputedStyle(node).backgroundColor)).toBe(
    'rgb(255, 255, 255)',
  )
  await toast.getByRole('button', { name: '关闭通知', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(app.locator('[data-sonner-toast]')).toHaveCount(0)
  await expect(result(app)).toHaveText('业务状态：已触发基本通知')
  expect(await id(app)).toBe(firstId) // History reading does not claim a currently active toast.
  await app.getByRole('button', { name: '触发订阅成功提示', exact: true }).click()
  await mountedToast(app)
  expect(await id(app)).not.toBe(firstId)
  await waitForAutoClose(page, app)
  await expect(result(app)).toHaveText('业务状态：已触发基本通知')
})

test('@B20 latest save action owns one undo; closing the real toast does not undo business', async ({
  page,
}) => {
  const app = await open(page, 'business')
  const save = app.getByRole('button', { name: '保存新闻并显示撤销', exact: true })
  await expect(app.getByTestId('b20-saved')).toHaveText('未保存')
  await save.click()
  await expect(app.getByTestId('b20-saved')).toHaveText('已保存')
  const firstToast = await mountedToast(app, 'success')
  await firstToast.getByRole('button', { name: '撤销', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(app.getByTestId('b20-saved')).toHaveText('未保存')
  await expect(result(app)).toHaveText('业务状态：已撤销最近一次保存')
  await expect(app.locator('[data-sonner-toast]')).toHaveCount(0)
  await save.click()
  await mountedToast(app, 'success')
  const olderId = await id(app)
  const olderNode = await active(app).elementHandle()
  if (!olderNode) throw new Error('Missing older save toast')
  await save.click()
  await expect.poll(() => olderNode.evaluate((node) => node.isConnected)).toBe(false)
  await mountedToast(app, 'success')
  expect(await id(app)).not.toBe(olderId)
  await expect(active(app).getByRole('button', { name: '撤销', exact: true })).toHaveCount(1)
  await active(app).getByRole('button', { name: '撤销', exact: true }).click()
  await expect(app.getByTestId('b20-saved')).toHaveText('未保存')
  await expect(app.locator('[data-sonner-toast]')).toHaveCount(0)
  // Guard policy covers invoking an expired closure; do not force-click an exiting hidden old action.
  await save.click()
  const finalToast = await mountedToast(app, 'success')
  await finalToast.getByRole('button', { name: '关闭通知', exact: true }).click()
  await expect(app.locator('[data-sonner-toast]')).toHaveCount(0)
  await expect(app.getByTestId('b20-saved')).toHaveText('已保存')
  await expect(result(app)).toHaveText('业务状态：新闻已加入稍后阅读')
})

test('@B20 same-id finite task outcomes, frozen input, latest-run cancel and pending unmount', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const app = await open(page, 'advanced', true)
  const run = app.getByRole('button', { name: '运行异步反馈', exact: true })
  const fail = app.getByRole('checkbox', { name: '模拟业务失败', exact: true })
  await run.click()
  const toast = await mountedToast(app, 'loading')
  const held = await toast.elementHandle()
  if (!held) throw new Error('Missing real loading element')
  const successId = await id(app)
  await fail.check() // The running task already captured false.
  await expect(result(app)).toHaveText('业务状态：任务成功', { timeout: 3000 })
  await expect(active(app)).toHaveAttribute('data-type', 'success')
  expect(await id(app)).toBe(successId)
  expect(
    await held.evaluate((node) => node.isConnected && node.getAttribute('data-type') === 'success'),
  ).toBe(true)
  await waitForAutoClose(page, app) // Regression: the old Infinity must not survive success.
  await expect(result(app)).toHaveText('业务状态：任务成功')
  await page.setViewportSize({ width: 390, height: 980 })
  await run.click()
  const failing = await mountedToast(app, 'loading')
  const failureId = await id(app)
  const failedNode = await failing.elementHandle()
  if (!failedNode) throw new Error('Missing failure loading element')
  const box = await failing.boundingBox()
  if (!box) throw new Error('Missing actual mobile toast geometry')
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(391)
  await expect(result(app)).toHaveText('业务状态：任务失败', { timeout: 3000 })
  await expect(active(app)).toHaveAttribute('data-type', 'error')
  expect(await id(app)).toBe(failureId)
  expect(
    await failedNode.evaluate(
      (node) => node.isConnected && node.getAttribute('data-type') === 'error',
    ),
  ).toBe(true)
  await waitForAutoClose(page, app) // Error must also leave its infinite loading state.
  await expect(result(app)).toHaveText('业务状态：任务失败')
  await fail.uncheck()
  await run.click()
  await mountedToast(app, 'loading')
  const replaced = await id(app)
  const replacedNode = await active(app).elementHandle()
  if (!replacedNode) throw new Error('Missing replaced loading toast')
  await fail.check()
  await run.click()
  await expect.poll(() => replacedNode.evaluate((node) => node.isConnected)).toBe(false)
  await mountedToast(app, 'loading')
  expect(await id(app)).not.toBe(replaced)
  await app.getByRole('button', { name: '取消并清理本演示', exact: true }).click()
  await expect(app.locator('[data-sonner-toast]')).toHaveCount(0)
  await page.waitForTimeout(1100) // Actual time beyond the owned 900ms, no fake timers.
  await expect(result(app)).toHaveText('业务状态：已停止并清理此演示通知')
  await run.click()
  const pending = await mountedToast(app, 'loading')
  const pendingId = await pending.getAttribute('data-testid')
  const pendingHandle = await pending.elementHandle()
  if (!pendingId || !pendingHandle) throw new Error('Missing SDK pending-toast identity')
  await page.goBack() // Same-document SPA navigation to the Agent tab mounted before Demo.
  await expect(page.getByRole('tab', { name: 'Agent 指南', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(app).toHaveCount(0)
  expect(await pendingHandle.evaluate((node) => node.isConnected)).toBe(false)
  await page.waitForTimeout(1100)
  await expect(page.getByTestId(pendingId)).toHaveCount(0)
  await page.goForward()
  const rootRun = page.getByRole('button', { name: '运行当前示例', exact: true })
  await expect(app.or(rootRun).first()).toBeVisible()
  if (await rootRun.isVisible()) await rootRun.click()
  await expect(app).toBeVisible()
  await expect(app.locator('[data-sonner-toast]')).toHaveCount(0)
  await expect(result(app)).toHaveText('业务状态：未执行')
  await expect(fail).not.toBeChecked()
  expect(errors).toEqual([])
})
