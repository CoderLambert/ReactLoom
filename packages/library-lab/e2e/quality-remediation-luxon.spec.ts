// Actual Luxon in real Chromium UI; author NOT_RUN. UTC context is real timezone emulation,
// not a mocked SDK/Intl/clock. Other browser/OS ICU versions remain a separate matrix.
import { expect, type Locator, type Page, test } from '@playwright/test'

test.use({ timezoneId: 'UTC' })

async function open(page: Page, level: 'basic' | 'business' | 'advanced') {
  await page.setViewportSize({ width: 1280, height: 1100 })
  await page.goto(`/libraries/luxon?tab=demo&example=${level}`)
  const app = page.getByTestId('c16-workshop')
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  await expect(app.or(run).first()).toBeVisible({ timeout: 20_000 })
  if (await run.isVisible()) await run.click()
  await expect(app).toHaveAttribute('data-level', level)
  await expect(app.getByTestId('c16-status')).toHaveText('当前输入待运行')
  expect(
    JSON.parse((await app.getByTestId('c16-environment').textContent()) ?? '{}').intl.timeZone,
  ).toBe('UTC')
  return app
}
async function run(app: Locator) {
  await app.getByRole('button', { name: '使用 Luxon 运行', exact: true }).click()
}
async function result(app: Locator) {
  await expect(app.getByTestId('luxon-result')).toBeVisible()
  return JSON.parse((await app.getByTestId('luxon-result').textContent()) ?? '{}')
}
async function candidates(app: Locator) {
  await expect(app.getByTestId('luxon-candidates')).toBeVisible()
  return JSON.parse((await app.getByTestId('luxon-candidates').textContent()) ?? '[]') as {
    offset: string
    local: string
    instant: string
  }[]
}

test('@C16 explicit source zone defines noon while display-zone conversion preserves the instant; invalid input recovers', async ({
  page,
}) => {
  const app = await open(page, 'basic')
  await run(app)
  const first = await result(app)
  expect(first.calendarDay).toBe('2026-03-07')
  expect(first.source.iso).toBe('2026-03-07T12:00:00.000-05:00')
  expect(first.display.iso).toBe('2026-03-08T01:00:00.000+08:00')
  expect(first.source.instant).toBe(first.display.instant)
  expect(first.source.epochMillis).toBe(first.display.epochMillis)
  expect(first.sameInstant).toBe(true)
  expect(first.display.formatted).toContain('2026') // Locale punctuation depends on ICU.
  await app.getByRole('combobox', { name: '显示时区', exact: true }).selectOption('UTC')
  await expect(app.getByTestId('luxon-result')).toHaveCount(0) // old calculation cannot masquerade as new inputs.
  await run(app)
  const converted = await result(app)
  expect(converted.source.epochMillis).toBe(first.source.epochMillis)
  expect(converted.display.iso).toBe('2026-03-07T17:00:00.000Z')
  await app.getByRole('combobox', { name: '时区', exact: true }).selectOption('UTC')
  await run(app)
  const reinterpreted = await result(app)
  expect(reinterpreted.source.iso).toBe('2026-03-07T12:00:00.000Z')
  expect(reinterpreted.source.epochMillis).not.toBe(first.source.epochMillis)
  const civil = app.getByRole('textbox', { name: '日历日期', exact: true })
  await civil.fill('2026-02-30')
  await run(app)
  await expect(app.getByRole('alert')).toContainText('非法日期')
  await expect(app.getByTestId('luxon-result')).toHaveCount(0)
  await civil.fill('2026-03-07')
  await expect(app.getByRole('alert')).toHaveCount(0)
  await run(app)
  expect((await result(app)).calendarDay).toBe('2026-03-07')
})

test('@C16 real calendar-day windows expose 23/25/24 elapsed hours, fixed-24-hour contrast and half-open bounds', async ({
  page,
}) => {
  const app = await open(page, 'business')
  for (const [name, hours, fixedHour] of [
    ['纽约春季窗口', 23, '13'],
    ['纽约秋季窗口', 25, '11'],
    ['纽约普通窗口', 24, '12'],
  ] as const) {
    await app.getByRole('button', { name, exact: true }).click()
    await expect(app.getByTestId('luxon-result')).toHaveCount(0)
    await run(app)
    const value = (await result(app)).schedule
    expect(value.elapsedHours).toBe(hours)
    expect(value.calendarDays).toBe(1)
    expect(value.start).toContain('T12:00:00.000')
    expect(value.end).toContain('T12:00:00.000')
    expect(value.after24Hours).toContain(`T${fixedHour}:00:00.000`)
    expect(value.containsStart).toBe(true)
    expect(value.containsEnd).toBe(false)
    expect(Date.parse(value.end) - Date.parse(value.start)).toBe(hours * 3_600_000)
    expect(Date.parse(value.end) - Date.parse(value.lastIncluded)).toBe(1)
  }
  await app.getByRole('button', { name: '纽约秋季窗口', exact: true }).click()
  await app.getByRole('combobox', { name: '时区', exact: true }).selectOption('Asia/Shanghai')
  await run(app)
  const shanghai = (await result(app)).schedule
  expect(shanghai.zone).toBe('Asia/Shanghai')
  expect(shanghai.elapsedHours).toBe(24)
  expect(shanghai.start).toBe('2026-10-31T12:00:00.000+08:00')
  expect(shanghai.end).toBe('2026-11-01T12:00:00.000+08:00')
})

test('@C16 real overlap candidates require a matching offset; gaps/malformed input reject, then recover and reset on remount', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const app = await open(page, 'advanced')
  const offset = app.getByRole('combobox', { name: '显式 UTC 偏移', exact: true })
  const wall = app.getByRole('textbox', { name: '纽约本地时间', exact: true })
  await expect(offset).toHaveValue('')
  await run(app)
  await expect(app.getByRole('alert')).toContainText('必须明确选择 UTC 偏移')
  await expect(app.getByTestId('luxon-result')).toHaveCount(0)
  expect((await candidates(app)).map((item) => item.offset).sort()).toEqual(['-04:00', '-05:00'])
  await offset.selectOption('-04:00')
  await run(app)
  const early = (await result(app)).resolved
  expect(early.instant).toBe('2026-11-01T05:30:00.000Z')
  expect(early.offset).toBe('-04:00')
  await offset.selectOption('-05:00')
  await run(app)
  const late = (await result(app)).resolved
  expect(late.instant).toBe('2026-11-01T06:30:00.000Z')
  expect(late.offset).toBe('-05:00')
  expect(Date.parse(late.instant) - Date.parse(early.instant)).toBe(3_600_000)
  await app.getByRole('button', { name: '模拟春季不存在的本地 02:30', exact: true }).click()
  await run(app)
  await expect(app.getByRole('alert')).toContainText('不存在该时刻')
  await expect(app.getByTestId('luxon-result')).toHaveCount(0)
  await expect(app.getByTestId('luxon-candidates')).toHaveCount(0)
  await wall.fill('2026-11-01T01:30Z')
  await run(app)
  await expect(app.getByRole('alert')).toContainText('YYYY-MM-DDTHH:mm')
  await wall.fill('2026-12-01T12:00')
  await offset.selectOption('-04:00')
  await run(app)
  await expect(app.getByRole('alert')).toContainText('不匹配')
  expect((await candidates(app)).map((item) => item.offset)).toEqual(['-05:00'])
  await offset.selectOption('') // a single unambiguous candidate needs no arbitrary choice.
  await run(app)
  expect((await result(app)).resolved.instant).toBe('2026-12-01T17:00:00.000Z')
  await expect(app.getByRole('alert')).toHaveCount(0)
  await page.setViewportSize({ width: 390, height: 1050 })
  const bounds = await app.boundingBox()
  if (!bounds) throw new Error('Missing actual narrow workshop')
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(391)
  for (const input of [wall, offset]) {
    const size = await input.boundingBox()
    if (!size) throw new Error('Missing actual input')
    expect(size.x + size.width).toBeLessThanOrEqual(391)
  }
  const held = await app.elementHandle()
  if (!held) throw new Error('Missing actual instance before stop')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  expect(await held.evaluate((element) => element.isConnected)).toBe(false)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(wall).toHaveValue('2026-11-01T01:30')
  await expect(offset).toHaveValue('')
  await expect(app.getByTestId('luxon-result')).toHaveCount(0)
  await run(app)
  await expect(app.getByRole('alert')).toContainText('必须明确选择 UTC 偏移')
  expect(errors).toEqual([])
})
