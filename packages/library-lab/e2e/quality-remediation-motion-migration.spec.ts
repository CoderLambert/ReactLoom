// Root integration proposal; NOT_RUN by author. Only modern motion/react executes.
// Real presence/DOM, native keyboard, reducer snapshots and browser media emulation. No SDK/RAF/clock mock.
import { expect, type Locator, type Page, test } from '@playwright/test'

type Level = 'basic' | 'business' | 'advanced'
async function open(page: Page, level: Level) {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.setViewportSize({ width: 1100, height: 1000 })
  await page.goto(`/libraries/react-motion-migration?tab=demo&example=${level}`)
  const app = page.getByTestId('b21-workshop')
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  await expect(app.or(run).first()).toBeVisible({ timeout: 20_000 })
  if (await run.isVisible()) await run.click()
  await expect(app).toBeVisible()
  await expect(app).toHaveAttribute('data-reduced', 'false')
  return app
}
function row(app: Locator, id: string) {
  return app.locator(`li[data-task-id="${id}"]`)
}
function liveRows(app: Locator) {
  return app.locator('li[data-task-id][data-present="true"]')
}
function add(app: Locator) {
  return app.getByRole('button', { name: '添加任务（最多24）', exact: true })
}
async function readState(app: Locator) {
  return JSON.parse((await app.getByTestId('b21-state').textContent()) ?? '{}')
}

test('@B21 modern Motion initial/exit presence, inert collapse and interrupted re-entry', async ({
  page,
}) => {
  const app = await open(page, 'basic')
  const toggle = app.locator('button[aria-controls]')
  const card = app.getByTestId('b21-details')
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(card).toHaveAttribute('data-present', 'true')
  expect(await toggle.getAttribute('aria-controls')).toBe(await card.getAttribute('id'))
  expect(await card.evaluate((node) => getComputedStyle(node).opacity)).toBe('1')
  const held = await card.elementHandle()
  if (!held) throw new Error('Missing actual modern motion.div')
  await toggle.focus()
  await page.keyboard.press('Enter')
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(app.getByTestId('b21-open')).toHaveText('业务 open：false')
  const exiting = await held.evaluate((node) => ({
    connected: node.isConnected,
    present: node.dataset.present,
    inert: node instanceof HTMLElement && node.inert,
    hidden: node.getAttribute('aria-hidden'),
  }))
  expect(exiting).toEqual({ connected: true, present: 'false', inert: true, hidden: 'true' })
  await expect(card).toHaveCount(0, { timeout: 4000 })
  await expect(app.getByTestId('b21-exits')).toContainText('1 次')
  await expect(toggle).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(card).toHaveAttribute('data-present', 'true')
  const restored = await card.elementHandle()
  if (!restored) throw new Error('Missing re-entered card')
  await toggle.click()
  await expect(card).toHaveAttribute('data-present', 'false')
  await toggle.click() // Real target reversal while the old node is exiting.
  await expect(card).toHaveAttribute('data-present', 'true')
  await expect(card).not.toHaveAttribute('aria-hidden', 'true')
  expect(
    await restored.evaluate(
      (node) => node.isConnected && node instanceof HTMLElement && !node.inert,
    ),
  ).toBe(true)
  await expect
    .poll(() => card.evaluate((node) => Number(getComputedStyle(node).opacity)))
    .toBeCloseTo(1, 2)
  await expect(app.getByTestId('b21-open')).toHaveText('业务 open：true')
})

test('@B21 stable-key list commits before real exit, disables leaving controls and restores necessary focus', async ({
  page,
}) => {
  const app = await open(page, 'business')
  await expect(liveRows(app)).toHaveCount(3)
  const notes = await row(app, 'notes').elementHandle()
  if (!notes) throw new Error('Missing stable notes DOM')
  await row(app, 'model').getByRole('button', { name: 'AI 模型设置', exact: true }).click()
  const old = await row(app, 'model').elementHandle()
  if (!old) throw new Error('Missing row before removal')
  await row(app, 'model').getByRole('button', { name: '删除 AI 模型设置', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(app).toHaveAttribute('data-order', 'rss,notes')
  await expect(app.getByTestId('b21-tasks-status')).toHaveText('选中：无；项目：2。')
  await expect(
    row(app, 'notes').getByRole('button', { name: '技术阅读笔记', exact: true }),
  ).toBeFocused()
  const leaving = await old.evaluate((node) => ({
    connected: node.isConnected,
    present: node.dataset.present,
    inert: node instanceof HTMLElement && node.inert,
    hidden: node.getAttribute('aria-hidden'),
    disabled: [...node.querySelectorAll('button')].every((button) => button.disabled),
    position: getComputedStyle(node).position,
  }))
  expect(leaving).toEqual({
    connected: true,
    present: 'false',
    inert: true,
    hidden: 'true',
    disabled: true,
    position: 'absolute',
  })
  await expect(row(app, 'model')).toHaveCount(0, { timeout: 4000 })
  expect(await notes.evaluate((node) => node.isConnected)).toBe(true)
  await add(app).click()
  await expect(app).toHaveAttribute('data-order', 'rss,notes,local-1')
  expect(await notes.evaluate((node) => node.isConnected)).toBe(true)
  // All deletions are real native keyboard actions; no invocation of a hidden exiting handler.
  while (await liveRows(app).count()) {
    const last = liveRows(app).last()
    await last.getByRole('button', { name: /^删除 / }).focus()
    await page.keyboard.press('Enter')
  }
  await expect(app.getByTestId('b21-empty')).toBeVisible()
  await expect(add(app)).toBeFocused()
  await expect(app.getByTestId('b21-tasks-status')).toHaveText('选中：无；项目：0。')
  await page.keyboard.press('Enter')
  await expect(app).toHaveAttribute('data-order', 'local-2')
  await expect(liveRows(app)).toHaveCount(1)
})

test('@B21 atomic undo, monotonic IDs, live OS policy and modern subtree unmount', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const app = await open(page, 'advanced')
  await app.getByText('查看业务事务快照', { exact: true }).click()
  const undo = app.getByRole('button', { name: '撤销上一步', exact: true })
  await row(app, 'model').getByRole('button', { name: 'AI 模型设置', exact: true }).click()
  await row(app, 'model').getByRole('button', { name: '删除 AI 模型设置', exact: true }).click()
  await expect(app).toHaveAttribute('data-order', 'rss,notes')
  await undo.click() // May reverse an actual in-flight exit of the same permanent key.
  await expect(app).toHaveAttribute('data-order', 'rss,model,notes')
  await expect(row(app, 'model')).toHaveAttribute('data-present', 'true')
  await expect(
    row(app, 'model').getByRole('button', { name: 'AI 模型设置', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(undo).toBeDisabled()
  expect((await readState(app)).selected).toBe('model')
  await add(app).click()
  await expect(row(app, 'local-1')).toHaveAttribute('data-present', 'true')
  await undo.click()
  await add(app).click()
  await expect(app).toHaveAttribute('data-order', 'rss,model,notes,local-2')
  expect((await readState(app)).nextId).toBe(2)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(app).toHaveAttribute('data-reduced', 'true')
  await expect(app.getByTestId('b21-reduced')).toContainText('时长0')
  await add(app).click()
  await expect(row(app, 'local-3')).toHaveAttribute('data-present', 'true')
  await expect
    .poll(() =>
      row(app, 'local-3').evaluate((node) => ({
        opacity: getComputedStyle(node).opacity,
        transform: getComputedStyle(node).transform,
      })),
    )
    .toEqual({ opacity: '1', transform: 'none' })
  await row(app, 'local-3').getByRole('button', { name: '删除 新任务 3', exact: true }).click()
  await expect(row(app, 'local-3')).toHaveCount(0)
  await undo.click()
  await expect(row(app, 'local-3')).toHaveAttribute('data-present', 'true')
  await page.setViewportSize({ width: 390, height: 980 })
  const bounds = await row(app, 'local-3').boundingBox()
  if (!bounds) throw new Error('Missing actual narrow row geometry')
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(391)
  while (await add(app).isEnabled()) await add(app).click()
  await expect(liveRows(app)).toHaveCount(24)
  const saturated = await readState(app)
  expect(saturated.items).toHaveLength(24)
  expect(new Set(saturated.items.map((item: { id: string }) => item.id)).size).toBe(24)
  const node = await row(app, 'model').elementHandle()
  if (!node) throw new Error('Missing owned motion row before unmount')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  expect(await node.evaluate((element) => element.isConnected)).toBe(false)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(app).toHaveAttribute('data-reduced', 'false')
  await expect(app).toHaveAttribute('data-order', 'rss,model,notes')
  await expect(liveRows(app)).toHaveCount(3)
  await expect(undo).toBeDisabled()
  expect(errors).toEqual([])
})
