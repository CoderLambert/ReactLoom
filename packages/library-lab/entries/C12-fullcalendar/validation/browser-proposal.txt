// Root integration proposal. Author browser NOT_RUN; real FullCalendar v7 DOM/interaction only.
// protected-styles is an exported, version-bound observation dependency, not a public stability promise.
import classNames from '@fullcalendar/react/protected-styles'
import { expect, type Locator, type Page, test } from '@playwright/test'

type EventValue = { id: string; title: string; start: string; end?: string; allDay?: boolean }
type Receipt = {
  kind: string
  id: string
  from: string
  start: string
  end: string
  decision: string
}
type Counters = { dates: number; drops: number; resizes: number; reverts: number }
async function json<T>(locator: Locator): Promise<T> {
  return JSON.parse((await locator.textContent()) || 'null') as T
}
async function start(page: Page, level: 'basic' | 'business' | 'advanced') {
  await page.goto(`/libraries/fullcalendar?tab=demo&example=${level}`)
  const app = page.getByTestId('c12-workshop')
  await expect(app).toBeVisible()
  await expect(app).toHaveAttribute('data-level', level)
  await app.getByText('查看真实SDK范围、API事件和末次改期', { exact: true }).click()
  await expect
    .poll(async () => (await json<Counters>(app.getByTestId('c12-callbacks'))).dates)
    .toBeGreaterThan(0)
  return app
}
async function apiEvents(app: Locator) {
  await app.getByRole('button', { name: '读取日历API事件', exact: true }).click()
  await expect
    .poll(async () => Array.isArray(await json(app.getByTestId('c12-api-events'))))
    .toBe(true)
  return json<EventValue[]>(app.getByTestId('c12-api-events'))
}
function event(app: Locator, id: string) {
  // eventClass is applied by the real SDK; exclude its temporary drag mirrors.
  return app.locator(`.c12-event-${id}:visible:not(.${classNames.internalEventMirror})`).first()
}
async function dateX(app: Locator, date: string) {
  const candidates = await app.locator(`[data-date="${date}"]`).evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect()
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
    }),
  )
  const appBox = await app.boundingBox()
  if (!appBox) throw new Error('No actual calendar bounds')
  const cell = candidates
    .filter((rect) => rect.width > 4 && rect.width < appBox.width / 2 && rect.height > 0)
    .sort((a, b) => b.height - a.height)[0]
  if (!cell) throw new Error(`No visible real SDK date column for ${date}`)
  return cell.x + cell.width / 2
}
async function dragToDate(page: Page, app: Locator, id: string, date: string) {
  const source = event(app, id)
  await source.scrollIntoViewIfNeeded()
  const rect = await source.boundingBox()
  if (!rect) throw new Error(`Missing actual SDK event ${id}`)
  const x = rect.x + rect.width / 2
  const y = rect.y + Math.min(rect.height / 2, 12)
  const targetX = await dateX(app, date)
  await page.mouse.move(x, y)
  await page.mouse.down()
  try {
    await page.mouse.move(x + 8, y, { steps: 3 })
    await page.mouse.move(targetX, y, { steps: 20 })
  } finally {
    await page.mouse.up()
  }
}
async function resizeEnd(page: Page, app: Locator, id: string) {
  const source = event(app, id)
  await source.scrollIntoViewIfNeeded()
  await source.hover()
  const handle = source.locator(`.${classNames.internalEventResizerEnd}`).last()
  await expect(handle).toBeVisible()
  // A visible event can sit at the viewport bottom; keep the entire gesture in view.
  await handle.evaluate((element) => element.scrollIntoView({ block: 'center', inline: 'nearest' }))
  const rect = await handle.boundingBox()
  if (!rect) throw new Error('Missing real SDK end-resize handle')
  const x = rect.x + rect.width / 2
  const y = rect.y + rect.height / 2
  const viewport = page.viewportSize()
  if (!viewport || y + 75 >= viewport.height)
    throw new Error('Resize target must remain in the real viewport')
  await page.mouse.move(x, y)
  await page.mouse.down()
  try {
    await page.mouse.move(x, y + 8, { steps: 3 })
    await page.mouse.move(x, y + 75, { steps: 20 })
  } finally {
    await page.mouse.up()
  }
}

test('@C12 basic real views, exclusive all-day end and SDK model observation', async ({ page }) => {
  const app = await start(page, 'basic')
  const range = app.getByTestId('c12-range')
  await expect.poll(async () => (await json<{ view: string }>(range)).view).toBe('dayGridMonth')
  const model = await apiEvents(app)
  expect(model).toHaveLength(3)
  expect(model.find((item) => item.id === 'two-days')).toEqual(
    expect.objectContaining({ start: '2026-11-03', end: '2026-11-05', allDay: true }),
  )
  await event(app, 'rss-plan').click()
  await expect(app.getByTestId('c12-status')).toContainText('选择事件：rss-plan')
  for (const [text, view] of [
    ['周', 'timeGridWeek'],
    ['日程', 'listWeek'],
    ['月', 'dayGridMonth'],
  ]) {
    await app.getByRole('tab', { name: text, exact: true }).click()
    await expect.poll(async () => (await json<{ view: string }>(range)).view).toBe(view)
  }
  const before = await app.getByTestId('c12-events').textContent()
  // Basic is read-only: real mouse movement must not invoke the drop path.
  await dragToDate(page, app, 'rss-plan', '2026-11-02')
  expect((await json<Counters>(app.getByTestId('c12-callbacks'))).drops).toBe(0)
  await expect(app.getByTestId('c12-events')).toHaveText(before || 'missing authority')
  expect(await apiEvents(app)).toEqual(model)
  const old = await event(app, 'rss-plan').elementHandle()
  if (!old) throw new Error('Missing SDK node before reset')
  await app.getByRole('button', { name: '重置本地日历', exact: true }).click()
  await expect.poll(() => old.evaluate((element) => element.isConnected)).toBe(false)
  expect(await apiEvents(app)).toHaveLength(3)
})

test('@C12 business creates a unique all-day event and accepts real drop plus resize', async ({
  page,
}) => {
  const app = await start(page, 'business')
  await app.getByRole('textbox', { name: '标题', exact: true }).fill('')
  await app.getByRole('button', { name: '创建本地事件', exact: true }).click()
  await expect(app.getByTestId('c12-status')).toContainText('必须有效')
  expect(await apiEvents(app)).toHaveLength(3)
  await app.getByRole('textbox', { name: '标题', exact: true }).fill('  真实创建 <草稿>  ')
  await app.getByLabel('日期', { exact: true }).fill('2026-11-04')
  await app.getByRole('button', { name: '创建本地事件', exact: true }).click()
  const created = (await apiEvents(app)).find((item) => item.id === 'local-1')
  expect(created).toEqual(
    expect.objectContaining({ title: '真实创建 <草稿>', start: '2026-11-04', allDay: true }),
  )
  expect(new Set((await apiEvents(app)).map((item) => item.id)).size).toBe(4)
  await expect(event(app, 'local-1')).toContainText('真实创建 <草稿>')
  await expect(event(app, 'local-1').locator('草稿')).toHaveCount(0)
  const beforeMove = (await apiEvents(app)).find((item) => item.id === 'review')
  if (!beforeMove?.end) throw new Error('Missing actual review model')
  await dragToDate(page, app, 'review', '2026-11-03')
  await expect
    .poll(async () => (await json<Counters>(app.getByTestId('c12-callbacks'))).drops)
    .toBe(1)
  const moved = await json<Receipt>(app.getByTestId('c12-receipt'))
  expect(moved).toEqual(
    expect.objectContaining({ kind: 'drop', id: 'review', decision: 'accepted' }),
  )
  expect(Date.parse(moved.start)).not.toBe(Date.parse(beforeMove.start))
  const authority = await json<EventValue[]>(app.getByTestId('c12-events'))
  expect(authority.find((item) => item.id === 'review')?.start).toBe(moved.start)
  expect((await apiEvents(app)).find((item) => item.id === 'review')?.start).toBe(moved.start)
  const beforeResizeEnd = Date.parse(moved.end)
  await resizeEnd(page, app, 'review')
  await expect
    .poll(async () => (await json<Counters>(app.getByTestId('c12-callbacks'))).resizes)
    .toBe(1)
  const resized = await json<Receipt>(app.getByTestId('c12-receipt'))
  expect(resized).toEqual(
    expect.objectContaining({ kind: 'resize', id: 'review', decision: 'accepted' }),
  )
  expect(Date.parse(resized.end)).toBeGreaterThan(beforeResizeEnd)
  const finalModel = (await apiEvents(app)).find((item) => item.id === 'review')
  expect(finalModel?.end).toBe(resized.end)
  expect(
    (await json<EventValue[]>(app.getByTestId('c12-events'))).find((item) => item.id === 'review')
      ?.end,
  ).toBe(resized.end)
  expect((await json<Counters>(app.getByTestId('c12-callbacks'))).reverts).toBe(0)
})

test('@C12 advanced observes distinct DST instants and real rejected drop restores SDK model', async ({
  page,
}) => {
  const app = await start(page, 'advanced')
  const before = await apiEvents(app)
  const early = before.find((item) => item.id === 'fold-early')
  const late = before.find((item) => item.id === 'fold-late')
  if (!early || !late) throw new Error('Missing actual DST event models')
  expect(Date.parse(late.start) - Date.parse(early.start)).toBe(3600000)
  const authority = await app.getByTestId('c12-events').textContent()
  await dragToDate(page, app, 'fold-early', '2026-11-02')
  await expect
    .poll(async () => (await json<Counters>(app.getByTestId('c12-callbacks'))).reverts)
    .toBe(1)
  const receipt = await json<Receipt>(app.getByTestId('c12-receipt'))
  expect(receipt).toEqual(
    expect.objectContaining({ kind: 'drop', id: 'fold-early', decision: 'reverted' }),
  )
  expect(Date.parse(receipt.start)).not.toBe(Date.parse(early.start))
  await expect(app.getByTestId('c12-status')).toContainText('已调用 revert()')
  await expect(app.getByTestId('c12-events')).toHaveText(authority || 'missing authority')
  const after = await apiEvents(app)
  expect(Date.parse(after.find((item) => item.id === 'fold-early')?.start || '')).toBe(
    Date.parse(early.start),
  )
  expect(Date.parse(after.find((item) => item.id === 'fold-late')?.start || '')).toBe(
    Date.parse(late.start),
  )
  const old = await event(app, 'fold-early').elementHandle()
  if (!old) throw new Error('Missing SDK node before stop')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(page.getByTestId('c12-workshop')).toHaveCount(0)
  await expect.poll(() => old.evaluate((element) => element.isConnected)).toBe(false)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  const next = page.getByTestId('c12-workshop')
  await expect(next).toBeVisible()
  expect((await json<Counters>(next.getByTestId('c12-callbacks'))).reverts).toBe(0)
  expect(await apiEvents(next)).toHaveLength(5)
})

// No SDK/DOM replacement, direct callback invocation, handler inspection, force click or synthetic drop.
// Node disconnection proves owned node replacement only, not a census of all SDK global resources.
// Native date overflow can be rejected by the input itself; strict overflow policy is separately tested.
// Real OS IME, touch, screen-reader scheduling, SSR hydration and active-drag-unmount resource census NOT_RUN.
