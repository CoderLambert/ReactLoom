// Complete real UI proposal. Author browser NOT_RUN; no Day.js/DOM/clock/Intl mocks.
import { expect, type Locator, type Page, test } from '@playwright/test'

type Basic = {
  input: string
  zhCN: string
  weekday: string
  immutable: { before: string; after: string; next: string; sameReference: boolean }
}
type Window = {
  zone: string
  start: string
  end: string
  startInstant: string
  endInstant: string
  elapsedHours: number
  elapsedMs: number
}
type Advanced = {
  spring: Window
  fall: Window
  fallback: { instant: string; local: string }[]
  selectedEvent: { zone: string; wall: string; offset: string; instant: string }
}
async function open(page: Page, level: 'basic' | 'business' | 'advanced') {
  await page.goto(`/libraries/dayjs?tab=demo&example=${level}`)
  const app = page.getByTestId('c15-workshop')
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  await expect(app.or(run).first()).toBeVisible()
  if (await run.isVisible()) await run.click()
  await expect(app).toHaveAttribute('data-level', level)
  return app
}
async function calculate<T>(app: Locator): Promise<T> {
  await app.getByRole('button', { name: '使用 Day.js 运行计算', exact: true }).click()
  await expect(app.getByTestId('dayjs-result')).toBeVisible()
  return JSON.parse((await app.getByTestId('dayjs-result').textContent()) || 'null') as T
}

test('@C15 real strict parse, Chinese weekday and immutable add with clean drafts/reset', async ({
  page,
}) => {
  const app = await open(page, 'basic')
  const input = app.getByRole('textbox', { name: '日历日期', exact: true })
  await input.fill('2026-02-30')
  await app.getByRole('button', { name: '使用 Day.js 运行计算', exact: true }).click()
  await expect(app.getByRole('alert')).toContainText('拒绝自动进位')
  await expect(app.getByTestId('dayjs-result')).toHaveCount(0)
  await input.fill('2028-02-29')
  await expect(app.getByRole('alert')).toHaveCount(0)
  // Native keyboard activation of the calculation button; no synthetic submit or SDK calls.
  const run = app.getByRole('button', { name: '使用 Day.js 运行计算', exact: true })
  await run.focus()
  await page.keyboard.press('Enter')
  await expect(app.getByTestId('dayjs-result')).toBeVisible()
  const result = JSON.parse(
    (await app.getByTestId('dayjs-result').textContent()) || 'null',
  ) as Basic
  expect(result).toEqual({
    input: '2028-02-29',
    zhCN: '2028年2月29日',
    weekday: '星期二',
    immutable: {
      before: '2028-02-29',
      after: '2028-02-29',
      next: '2028-03-01',
      sameReference: false,
    },
  })
  await input.fill('2028-03-01')
  await expect(app.getByTestId('dayjs-result')).toHaveCount(0)
  await expect(app.getByTestId('c15-status')).toContainText('重新计算')
  await app.getByRole('button', { name: '重置当前目标', exact: true }).click()
  await expect(input).toHaveValue('2026-03-07')
  await expect(app.getByTestId('dayjs-result')).toHaveCount(0)
  await expect(app.getByRole('alert')).toHaveCount(0)
})

test('@C15 actual noon windows distinguish NY23/25 hours and Shanghai/UTC24 hours', async ({
  page,
}) => {
  const app = await open(page, 'business')
  const date = app.getByRole('textbox', { name: '日历日期', exact: true })
  const zone = app.getByRole('combobox', { name: 'IANA 时区', exact: true })
  const first = await calculate<{ window: Window }>(app)
  expect(first.window.zone).toBe('America/New_York')
  expect(first.window.start).toBe('2026-03-07 12:00 -05:00')
  expect(first.window.end).toBe('2026-03-08 12:00 -04:00')
  expect(first.window.elapsedHours).toBe(23)
  expect(first.window.elapsedMs).toBe(23 * 3600000)
  expect(Date.parse(first.window.endInstant) - Date.parse(first.window.startInstant)).toBe(
    23 * 3600000,
  )
  for (const target of ['Asia/Shanghai', 'UTC']) {
    await zone.selectOption(target)
    await expect(app.getByTestId('dayjs-result')).toHaveCount(0)
    const result = await calculate<{ window: Window }>(app)
    expect(result.window.zone).toBe(target)
    expect(result.window.elapsedHours).toBe(24)
    expect(result.window.elapsedMs).toBe(86400000)
    expect(Date.parse(result.window.endInstant) - Date.parse(result.window.startInstant)).toBe(
      86400000,
    )
  }
  await zone.selectOption('America/New_York')
  await date.fill('2026-10-31')
  const fall = await calculate<{ window: Window }>(app)
  expect(fall.window.start).toBe('2026-10-31 12:00 -04:00')
  expect(fall.window.end).toBe('2026-11-01 12:00 -05:00')
  expect(fall.window.elapsedHours).toBe(25)
  expect(fall.window.elapsedMs).toBe(25 * 3600000)
  await date.fill('2026-02-30')
  await app.getByRole('button', { name: '使用 Day.js 运行计算', exact: true }).click()
  await expect(app.getByRole('alert')).toBeVisible()
  await expect(app.getByTestId('dayjs-result')).toHaveCount(0)
  await date.fill('2026-03-07')
  expect((await calculate<{ window: Window }>(app)).window.elapsedHours).toBe(23)
})

test('@C15 actual offset roundtrip rejects NY gap, preserves two fold instants and owns level/unmount state', async ({
  page,
}) => {
  // A hidden invalid basic input must not poison the advanced session.
  let app = await open(page, 'basic')
  await app.getByRole('textbox', { name: '日历日期', exact: true }).fill('2026-02-30')
  await app.getByRole('button', { name: '使用 Day.js 运行计算', exact: true }).click()
  await expect(app.getByRole('alert')).toBeVisible()
  await page.getByRole('combobox', { name: '学习场景', exact: true }).selectOption('advanced')
  app = page.getByTestId('c15-workshop')
  await expect(app).toHaveAttribute('data-level', 'advanced')
  await expect(app.getByRole('alert')).toHaveCount(0)
  const early = await calculate<Advanced>(app)
  expect(early.spring.elapsedHours).toBe(23)
  expect(early.fall.elapsedHours).toBe(25)
  expect(early.fallback).toEqual([
    { instant: '2026-11-01T05:30:00Z', local: '2026-11-01 01:30 -04:00' },
    { instant: '2026-11-01T06:30:00Z', local: '2026-11-01 01:30 -05:00' },
  ])
  expect(early.selectedEvent.instant).toBe('2026-11-01T05:30:00.000Z')
  await app.getByRole('button', { name: '选择回拨后的 -05:00', exact: true }).click()
  await expect(app.getByTestId('dayjs-result')).toHaveCount(0)
  const late = await calculate<Advanced>(app)
  expect(late.selectedEvent.instant).toBe('2026-11-01T06:30:00.000Z')
  expect(late.selectedEvent.wall).toBe(early.selectedEvent.wall)
  expect(late.selectedEvent.offset).not.toBe(early.selectedEvent.offset)
  expect(Date.parse(late.selectedEvent.instant) - Date.parse(early.selectedEvent.instant)).toBe(
    3600000,
  )
  await app.getByRole('button', { name: '尝试春季不存在的 02:30', exact: true }).click()
  await app.getByRole('button', { name: '使用 Day.js 运行计算', exact: true }).click()
  await expect(app.getByRole('alert')).toContainText('墙上时间/偏移')
  await expect(app.getByTestId('dayjs-result')).toHaveCount(0)
  await app.getByRole('button', { name: '选择回拨后的 -05:00', exact: true }).click()
  await expect(app.getByRole('alert')).toHaveCount(0)
  expect((await calculate<Advanced>(app)).selectedEvent.instant).toBe('2026-11-01T06:30:00.000Z')
  await page.setViewportSize({ width: 390, height: 980 })
  expect(await app.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
  const old = await app
    .getByRole('textbox', { name: '纽约带偏移的绝对事件', exact: true })
    .elementHandle()
  if (!old) throw new Error('Missing actual input before unmount')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  expect(await old.evaluate((node) => node.isConnected)).toBe(false)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(app.getByRole('textbox', { name: '纽约带偏移的绝对事件', exact: true })).toHaveValue(
    '2026-11-01T01:30:00-04:00',
  )
  await expect(app.getByTestId('dayjs-result')).toHaveCount(0)
})

// Output comes from the same imported Day.js operations as the real UI, never helper calls from this test.
// Node disconnection proves the owned input's removal only. There are no application timers or requests.
// Full OS IME, browser/device timezone matrix, screen readers, touch and SSR hydration remain NOT_RUN.
