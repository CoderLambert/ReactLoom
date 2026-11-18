// NOT_RUN. Actual replacement18.0.1 sensors; no legacy SDK import, DataTransfer or SDK callback mock.
// Programmatic reset below is an explicit business-refresh fixture during a real mouse gesture.
import { expect, type Locator, type Page, test } from '@playwright/test'

type Receipt = {
  phase: 'start' | 'end'
  draggableId: string
  mode: 'FLUID' | 'SNAP'
  source: { droppableId: string; index: number }
  destination: { droppableId: string; index: number } | null
  reason: 'DROP' | 'CANCEL' | null
  snapshotRevision: number | null
}
async function open(page: Page, level: 'basic' | 'business' | 'advanced') {
  await page.setViewportSize({ width: 1280, height: 1200 })
  await page.goto(`/libraries/react-beautiful-dnd-migration?tab=demo&example=${level}`)
  const app = page.getByTestId('b22-workshop')
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  await expect(app.or(run).first()).toBeVisible()
  if (await run.isVisible()) await run.click()
  await expect(app).toHaveAttribute('data-level', level)
  return app
}
function row(app: Locator, id: string) {
  return app.locator(`li[data-item-id="${id}"]`)
}
function handle(app: Locator, id: string) {
  return row(app, id).locator('.rl-b22-handle')
}
async function receipt(app: Locator): Promise<Receipt | null> {
  const text = (await app.getByTestId('b22-sdk-event').textContent())?.trim() || ''
  return text.startsWith('{') ? JSON.parse(text) : null
}
async function mouseDrag(
  page: Page,
  app: Locator,
  id: string,
  targetId: string,
  beforeRelease?: () => Promise<void>,
) {
  const grip = handle(app, id)
  const source = row(app, id)
  await grip.scrollIntoViewIfNeeded()
  await row(app, targetId).scrollIntoViewIfNeeded()
  const from = await grip.boundingBox(),
    to = await row(app, targetId).boundingBox()
  if (!from || !to) throw new Error('Missing real sensor endpoints')
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  try {
    await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2 + 10, { steps: 5 })
    await expect(source).toHaveAttribute('data-dragging', 'true')
    await expect.poll(async () => receipt(app)).toMatchObject({ phase: 'start', draggableId: id })
    await expect(app.locator('[data-rfd-placeholder-context-id]')).toBeVisible()
    expect(await source.evaluate((element) => getComputedStyle(element).position)).toBe('fixed')
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 })
    await page.waitForTimeout(50) // Real rAF movement, not a fake clock or injected DropResult.
    if (beforeRelease) await beforeRelease()
  } finally {
    await page.mouse.up()
  }
  await expect(source).toHaveAttribute('data-dragging', 'false')
  await expect.poll(async () => (await receipt(app))?.phase).toBe('end')
}

test('@B22 actual replacement React19 keyboard and mouse sensors preserve bindings IDs and hidden suffix', async ({
  page,
}) => {
  const app = await open(page, 'basic')
  const initialRow = await row(app, 'ai').elementHandle()
  if (!initialRow) throw new Error('No stable row')
  const ai = handle(app, 'ai')
  await ai.focus()
  await ai.press('Space')
  await expect(row(app, 'ai')).toHaveAttribute('data-dragging', 'true')
  await expect(app.locator('[data-rfd-placeholder-context-id]')).toBeVisible()
  await ai.press('ArrowDown')
  await ai.press('Space')
  await expect(app.getByTestId('b22-order')).toHaveText('frontend → ai → rss')
  expect(await receipt(app)).toMatchObject({
    phase: 'end',
    draggableId: 'ai',
    mode: 'SNAP',
    reason: 'DROP',
    source: { index: 0 },
    destination: { index: 1 },
  })
  await handle(app, 'frontend').evaluate((button) => {
    button.addEventListener(
      'mousedown',
      (event) => button.setAttribute('data-mouse-trusted', String(event.isTrusted)),
      { once: true },
    )
  })
  await mouseDrag(page, app, 'frontend', 'rss')
  await expect(app.getByTestId('b22-order')).toHaveText('ai → rss → frontend')
  await expect(app).toHaveAttribute('data-all-order', 'ai,rss,frontend,global,notes')
  await expect(handle(app, 'frontend')).toHaveAttribute('data-mouse-trusted', 'true')
  expect(await receipt(app)).toMatchObject({
    phase: 'end',
    draggableId: 'frontend',
    mode: 'FLUID',
    reason: 'DROP',
  })
  expect(await initialRow.evaluate((element) => element.isConnected)).toBe(true)
})

test('@B22 fixed slot rejection is shared by actual keyboard sensor results and native button fallback', async ({
  page,
}) => {
  const app = await open(page, 'business')
  // Keep the whole droppable visible before measuring pointer targets; avoid page auto-scroll changing the captured drop coordinates.
  await app.getByTestId('b22-list').scrollIntoViewIfNeeded()
  const initial = 'ai → frontend → rss → global → notes'
  await expect(handle(app, 'global')).toBeDisabled()
  await expect(
    row(app, 'rss').getByRole('button', { name: '下移 RSS 频道', exact: true }),
  ).toBeDisabled()
  // Real keyboard sensor proposes the exact last slot without a pointer target moving during page auto-scroll.
  const moving = handle(app, 'ai')
  await moving.focus()
  await moving.press('Space')
  await expect(row(app, 'ai')).toHaveAttribute('data-dragging', 'true')
  for (let step = 0; step < 4; step++) await moving.press('ArrowDown')
  await moving.press('Space')
  await expect.poll(async () => (await receipt(app))?.phase).toBe('end')
  expect(await receipt(app)).toMatchObject({ reason: 'DROP', destination: { index: 4 } })
  await expect(app.getByTestId('b22-order')).toHaveText(initial)
  await expect(app).toHaveAttribute('data-revision', '0')
  await expect(app.getByTestId('b22-status')).toContainText('不能被跨越')
  await mouseDrag(page, app, 'ai', 'frontend')
  await expect(app.getByTestId('b22-order')).toHaveText('frontend → ai → rss → global → notes')
  await row(app, 'ai').getByRole('button', { name: '上移 AI 模型研究', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(app.getByTestId('b22-order')).toHaveText(initial)
})

test('@B22 real cancellation undo stale business reset and SDK-owned style cleanup remain distinct', async ({
  page,
}) => {
  const app = await open(page, 'advanced')
  const initial = 'ai → frontend → rss → global → notes'
  const undo = app.getByRole('button', { name: '撤销上次排序', exact: true })
  const reset = app.getByRole('button', { name: '恢复原序', exact: true })
  await handle(app, 'ai').focus()
  await handle(app, 'ai').press('Space')
  await handle(app, 'ai').press('ArrowDown')
  await handle(app, 'ai').press('Escape')
  await expect.poll(async () => (await receipt(app))?.reason).toBe('CANCEL')
  await expect(app.getByTestId('b22-order')).toHaveText(initial)
  await expect(app).toHaveAttribute('data-revision', '0')
  await expect(undo).toBeDisabled()
  await mouseDrag(page, app, 'ai', 'rss')
  await undo.click()
  await expect(app.getByTestId('b22-order')).toHaveText(initial)
  await expect(undo).toBeDisabled()
  const revision = Number(await app.getAttribute('data-revision'))
  await mouseDrag(page, app, 'ai', 'rss', async () => {
    // Model an asynchronous authoritative business refresh while the real mouse is held.
    // This calls the real application control, never a SDK responder or fake drag result.
    await reset.evaluate((button) => {
      if (!(button instanceof HTMLButtonElement)) throw new Error('No reset control')
      button.click()
    })
  })
  expect((await receipt(app))?.reason).toBe('DROP')
  await expect(app).toHaveAttribute('data-revision', String(revision + 1))
  await expect(app.getByTestId('b22-order')).toHaveText(initial)
  await expect(app.getByTestId('b22-status')).toContainText('过期Drop')
  await expect(undo).toBeDisabled()
  const old = await handle(app, 'ai').elementHandle()
  const contextId = await handle(app, 'ai').getAttribute('data-rfd-drag-handle-context-id')
  if (!old || !contextId) throw new Error('No real SDK context before teardown')
  const ownedStyles = page.locator(
    `style[data-rfd-always="${contextId}"],style[data-rfd-dynamic="${contextId}"]`,
  )
  await expect(ownedStyles).toHaveCount(2)
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  expect(await old.evaluate((element) => element.isConnected)).toBe(false)
  await expect(ownedStyles).toHaveCount(0)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(app.getByTestId('b22-order')).toHaveText(initial)
  await handle(app, 'ai').focus()
  await handle(app, 'ai').press('Space')
  await handle(app, 'ai').press('ArrowDown')
  await handle(app, 'ai').press('Space')
  await expect(app.getByTestId('b22-order')).toHaveText('frontend → ai → rss → global → notes')
})
