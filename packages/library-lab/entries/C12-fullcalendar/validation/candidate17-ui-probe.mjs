// Fixed-dist diagnosis only: actual DOM, native mouse and real SDK callbacks. No build/mock.
import assert from 'node:assert/strict'
import classNames from '@fullcalendar/react/protected-styles'
import { chromium, expect } from '@playwright/test'

const corrected = process.argv.includes('--corrected')
const browser = await chromium.launch({ headless: true })
const report = {
  corrected,
  baseURL: 'http://127.0.0.1:4319',
  viewport: { width: 1280, height: 720 },
}
try {
  const context = await browser.newContext({ viewport: report.viewport })
  const page = await context.newPage()
  const json = async (locator) => JSON.parse((await locator.textContent()) || 'null')
  async function start(level) {
    await page.goto(`${report.baseURL}/libraries/fullcalendar?tab=demo&example=${level}`)
    const app = page.getByTestId('c12-workshop')
    await expect(app).toBeVisible()
    await app.getByText('查看真实SDK范围、API事件和末次改期', { exact: true }).click()
    await expect
      .poll(async () => (await json(app.getByTestId('c12-callbacks'))).dates)
      .toBeGreaterThan(0)
    return app
  }
  const actualEvent = (app, id) =>
    app.locator(`.c12-event-${id}:visible:not(.${classNames.internalEventMirror})`).first()
  async function dateX(app, date) {
    const appBox = await app.boundingBox()
    const rects = await app.locator(`[data-date="${date}"]`).evaluateAll((nodes) =>
      nodes.map((node) => {
        const r = node.getBoundingClientRect()
        return { x: r.x, width: r.width, height: r.height }
      }),
    )
    const rect = rects
      .filter((r) => r.width > 4 && r.width < appBox.width / 2 && r.height > 0)
      .sort((a, b) => b.height - a.height)[0]
    assert.ok(rect, 'Real date column must exist')
    return rect.x + rect.width / 2
  }
  async function drag(x, y, targetX, targetY) {
    await page.mouse.move(x, y)
    await page.mouse.down()
    try {
      await page.mouse.move(x + Math.sign(targetX - x) * 8, y + Math.sign(targetY - y) * 8, {
        steps: 3,
      })
      await page.mouse.move(targetX, targetY, { steps: 20 })
    } finally {
      await page.mouse.up()
    }
  }
  let app = await start('basic')
  report.basic = {
    nodes: await app.locator('button,[role="tab"]').evaluateAll((nodes) =>
      nodes.map((node) => ({
        tag: node.tagName,
        role: node.getAttribute('role'),
        text: node.textContent,
        label: node.getAttribute('aria-label'),
      })),
    ),
    originalButtonMatches: await app.getByRole('button').filter({ hasText: /^周$/u }).count(),
    actualWeekTabMatches: await app.getByRole('tab', { name: '周', exact: true }).count(),
  }
  if (corrected) {
    report.basic.views = []
    for (const [name, view] of [
      ['周', 'timeGridWeek'],
      ['日程', 'listWeek'],
      ['月', 'dayGridMonth'],
    ]) {
      await app.getByRole('tab', { name, exact: true }).click()
      await expect.poll(async () => (await json(app.getByTestId('c12-range'))).view).toBe(view)
      report.basic.views.push((await json(app.getByTestId('c12-range'))).view)
    }
  }
  app = await start('business')
  await app.getByRole('textbox', { name: '标题', exact: true }).fill('真实创建 <草稿>')
  await app.getByLabel('日期', { exact: true }).fill('2026-11-04')
  await app.getByRole('button', { name: '创建本地事件', exact: true }).click()
  let source = actualEvent(app, 'review')
  await source.scrollIntoViewIfNeeded()
  let box = await source.boundingBox()
  await drag(
    box.x + box.width / 2,
    box.y + Math.min(box.height / 2, 12),
    await dateX(app, '2026-11-03'),
    box.y + Math.min(box.height / 2, 12),
  )
  await expect.poll(async () => (await json(app.getByTestId('c12-callbacks'))).drops).toBe(1)
  await app.getByRole('button', { name: '读取日历API事件', exact: true }).click()
  report.business = {
    before: await json(app.getByTestId('c12-api-events')),
    countersBefore: await json(app.getByTestId('c12-callbacks')),
  }
  source = actualEvent(app, 'review')
  await source.scrollIntoViewIfNeeded()
  await source.hover()
  const handle = source.locator(`.${classNames.internalEventResizerEnd}`).last()
  await expect(handle).toBeVisible()
  if (corrected)
    await handle.evaluate((node) => node.scrollIntoView({ block: 'center', inline: 'nearest' }))
  report.business.geometry = await handle.evaluate((node) => {
    const rect = node.getBoundingClientRect(),
      root = node.closest('.c12-event-review'),
      style = getComputedStyle(node)
    const parent = root.getBoundingClientRect(),
      x = rect.x + rect.width / 2,
      y = rect.y + rect.height / 2
    const hit = document.elementFromPoint(x, y)
    globalThis.c12NativeProbeEvents = []
    for (const type of ['mousedown', 'mouseup'])
      document.addEventListener(
        type,
        (event) => {
          const target = event.target
          globalThis.c12NativeProbeEvents.push({
            type,
            trusted: event.isTrusted,
            x: event.clientX,
            y: event.clientY,
            tag: target.tagName,
            class: target.className,
            event: target.closest('[data-c12-event-id],.c12-event-review')?.className,
          })
        },
        { capture: true },
      )
    return {
      handle: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        class: node.className,
        cursor: style.cursor,
      },
      event: {
        x: parent.x,
        y: parent.y,
        width: parent.width,
        height: parent.height,
        display: getComputedStyle(root).display,
        flexDirection: getComputedStyle(root).flexDirection,
      },
      centerHit: {
        tag: hit?.tagName,
        class: hit?.className,
        isHandle: hit === node || node.contains(hit),
      },
    }
  })
  box = await handle.boundingBox()
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2
  report.business.drag = { from: { x, y }, to: { x, y: y + 75 } }
  await drag(x, y, report.business.drag.to.x, report.business.drag.to.y)
  try {
    await expect
      .poll(async () => (await json(app.getByTestId('c12-callbacks'))).resizes, { timeout: 1500 })
      .toBe(1)
  } catch {
    // Capture exact red observations before asserting below.
  }
  report.business.countersAfter = await json(app.getByTestId('c12-callbacks'))
  report.business.receipt = await json(app.getByTestId('c12-receipt'))
  report.business.nativeEvents = await page.evaluate(() => globalThis.c12NativeProbeEvents)
  await app.getByRole('button', { name: '读取日历API事件', exact: true }).click()
  report.business.after = await json(app.getByTestId('c12-api-events'))
  console.log(JSON.stringify(report, null, 2))
  assert.equal(
    corrected ? report.basic.actualWeekTabMatches : report.basic.originalButtonMatches,
    1,
    'View selector must target actual accessible role',
  )
  assert.equal(report.business.countersAfter.resizes, 1, 'Actual SDK resize callback must occur')
  assert.equal(report.business.receipt.kind, 'resize')
  assert.equal(report.business.receipt.decision, 'accepted')
  assert.ok(
    Date.parse(report.business.after.find((item) => item.id === 'review').end) >
      Date.parse(report.business.before.find((item) => item.id === 'review').end),
  )
} finally {
  await browser.close()
}
