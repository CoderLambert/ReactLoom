// Complete root integration proposal; author browser NOT_RUN.
// Real installed date-fns/TZDate only. No SDK mock, route replacement or fake clock.
import { expect, type Locator, type Page, test } from '@playwright/test'

type Result = {
  kind: string
  calendarDate?: string
  localNoon?: string
  instantUTC?: string
  ambiguousLocalTime?: string[]
  schedule?: { start: string; end: string; calendarDays: number; elapsedHours: number }
  spring?: { calendarDays: number; elapsedHours: number }
  fall?: { calendarDays: number; elapsedHours: number }
}
async function start(page: Page, level: 'basic' | 'business' | 'advanced') {
  await page.goto('/libraries/date-fns?tab=demo&example=' + level)
  const app = page.getByTestId('c14-workshop')
  await expect(app).toBeVisible()
  await expect(app).toHaveAttribute('data-level', level)
  return app
}
async function run(app: Locator): Promise<Result> {
  await app.getByRole('button', { name: '运行日期计算', exact: true }).click()
  await expect(app.getByTestId('date-result')).toBeVisible()
  await expect(app.getByTestId('c14-error')).toHaveCount(0)
  return JSON.parse((await app.getByTestId('date-result').textContent()) || 'null') as Result
}

test('@C14 basic real zoned noon, overflow recovery and session reset', async ({ page }) => {
  const app = await start(page, 'basic')
  await expect(app.getByLabel('增加天数', { exact: true })).toHaveCount(0)
  await expect(app.getByLabel('绝对事件时间', { exact: true })).toHaveCount(0)
  expect(await run(app)).toMatchObject({
    kind: 'civil',
    calendarDate: '2026-03-07',
    localNoon: '12:00 -05:00',
    instantUTC: '2026-03-07T17:00:00.000Z',
  })
  for (const [zone, noon, utc] of [
    ['Asia/Shanghai', '12:00 +08:00', '2026-03-07T04:00:00.000Z'],
    ['UTC', '12:00 Z', '2026-03-07T12:00:00.000Z'],
  ]) {
    await app.getByLabel('IANA 时区', { exact: true }).selectOption(zone)
    await expect(app.getByTestId('date-result')).toHaveCount(0)
    expect(await run(app)).toMatchObject({
      calendarDate: '2026-03-07',
      localNoon: noon,
      instantUTC: utc,
    })
  }
  await app.getByLabel('日历日期', { exact: true }).fill('2026-02-30')
  await app.getByRole('button', { name: '运行日期计算', exact: true }).click()
  await expect(app.getByRole('alert')).toContainText('禁止自动进位')
  await expect(app.getByTestId('date-result')).toHaveCount(0)
  await app.getByLabel('日历日期', { exact: true }).fill('0096-02-29')
  await app.getByRole('button', { name: '运行日期计算', exact: true }).click()
  await expect(app.getByRole('alert')).toContainText('1901–9999')
  await app.getByLabel('日历日期', { exact: true }).fill('1901-01-01')
  expect(await run(app)).toMatchObject({ calendarDate: '1901-01-01', localNoon: '12:00 Z' })
  await app.getByRole('button', { name: '重置当前计算', exact: true }).click()
  await expect(app.getByLabel('日历日期', { exact: true })).toHaveValue('2026-03-07')
  await expect(app.getByLabel('IANA 时区', { exact: true })).toHaveValue('America/New_York')
  await expect(app.getByTestId('date-result')).toHaveCount(0)
  await expect(app.getByRole('alert')).toHaveCount(0)
  const runButton = app.getByRole('button', { name: '运行日期计算', exact: true })
  await runButton.focus()
  await page.keyboard.press('Enter')
  await expect(app.getByTestId('date-result')).toBeVisible()
  await page.goto('/libraries/date-fns?tab=guide')
  await expect(page.getByTestId('c14-workshop')).toHaveCount(0)
  const fresh = await start(page, 'basic')
  await expect(fresh.getByTestId('date-result')).toHaveCount(0)
})

test('@C14 business real calendar day vs elapsed hours and result boundary', async ({ page }) => {
  const app = await start(page, 'business')
  expect((await run(app)).schedule).toMatchObject({
    start: '2026-03-07 12:00 -05:00',
    end: '2026-03-08 12:00 -04:00',
    calendarDays: 1,
    elapsedHours: 23,
  })
  await app.getByLabel('增加天数', { exact: true }).selectOption('3')
  await expect(app.getByTestId('date-result')).toHaveCount(0)
  expect((await run(app)).schedule).toMatchObject({ calendarDays: 3, elapsedHours: 71 })
  await app.getByLabel('增加天数', { exact: true }).selectOption('1')
  await app.getByLabel('日历日期', { exact: true }).fill('2026-10-31')
  expect((await run(app)).schedule).toMatchObject({ calendarDays: 1, elapsedHours: 25 })
  await app.getByLabel('IANA 时区', { exact: true }).selectOption('Asia/Shanghai')
  expect((await run(app)).schedule).toMatchObject({ calendarDays: 1, elapsedHours: 24 })
  await app.getByLabel('日历日期', { exact: true }).fill('9999-12-31')
  await app.getByRole('button', { name: '运行日期计算', exact: true }).click()
  await expect(app.getByRole('alert')).toContainText('超出本例')
  await expect(app.getByTestId('date-result')).toHaveCount(0)
  await app.getByRole('button', { name: '重置当前计算', exact: true }).click()
  await expect(app.getByLabel('增加天数', { exact: true })).toHaveValue('1')
  expect((await run(app)).schedule).toMatchObject({ calendarDays: 1, elapsedHours: 23 })
})

test('@C14 advanced real DST fold, explicit-offset boundaries and responsive output', async ({
  page,
}) => {
  const app = await start(page, 'advanced')
  await expect(app.getByLabel('日历日期', { exact: true })).toHaveCount(0)
  await expect(app.getByLabel('增加天数', { exact: true })).toHaveCount(0)
  const first = await run(app)
  expect(first.spring).toMatchObject({ calendarDays: 1, elapsedHours: 23 })
  expect(first.fall).toMatchObject({ calendarDays: 1, elapsedHours: 25 })
  expect(first.instantUTC).toBe('2026-11-01T05:30:00.000Z')
  expect(first.ambiguousLocalTime).toEqual(['2026-11-01T05:30:00.000Z', '2026-11-01T06:30:00.000Z'])
  const input = app.getByLabel('绝对事件时间', { exact: true })
  await input.fill('2026-11-01T01:30:00-05:00')
  await expect(app.getByTestId('date-result')).toHaveCount(0)
  expect((await run(app)).instantUTC).toBe('2026-11-01T06:30:00.000Z')
  for (const invalid of [
    '2026-11-01T01:30:00',
    '2026-11-01T01:30:00-00:00',
    '1900-02-29T00:00:00Z',
  ]) {
    await input.fill(invalid)
    await app.getByRole('button', { name: '运行日期计算', exact: true }).click()
    await expect(app.getByRole('alert')).toBeVisible()
    await expect(app.getByTestId('date-result')).toHaveCount(0)
  }
  for (const [value, expected] of [
    ['0001-01-01T00:00:00Z', '0001-01-01T00:00:00.000Z'],
    ['0096-02-29T00:00:00+08:00', '0096-02-28T16:00:00.000Z'],
    ['9999-12-31T23:59:59.999Z', '9999-12-31T23:59:59.999Z'],
  ]) {
    await input.fill(value)
    expect((await run(app)).instantUTC).toBe(expected)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await expect
    .poll(() => app.evaluate((element) => element.scrollWidth <= element.clientWidth + 1))
    .toBe(true)
  await app.getByRole('button', { name: '重置当前计算', exact: true }).click()
  await expect(input).toHaveValue('2026-11-01T01:30:00-04:00')
  await expect(app.getByTestId('date-result')).toHaveCount(0)
})
