import { expect, test } from '@playwright/test'

test('@C22 calendar migration rejects overflow and preserves immutable inputs', async ({
  page,
}) => {
  await page.goto('/libraries/moment-migration?tab=demo&example=basic')
  const report = page.getByTestId('calendar-report')
  await expect(report).toContainText('2026-11-02')
  await page.getByRole('button', { name: '试无效日期', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('有效日历日期')
  await expect(report).toContainText('"valid": false')
  await page.getByRole('button', { name: '恢复有效日期', exact: true }).click()
  await expect(report).toContainText('2026/11/01')
  await page.getByLabel('日历日期', { exact: true }).fill('2024-02-29')
  await expect
    .poll(async () => JSON.parse((await report.textContent()) ?? '{}'))
    .toMatchObject({
      valid: true,
      dayjsNext: '2024-03-01',
      dateFnsNext: '2024-03-01',
      originalAfterAdd: '2024-02-29',
    })
  await page.getByRole('tab', { name: '详细文档', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Moment 日期迁移工作坊' })).toHaveCount(0)
  await page.getByRole('tab', { name: '实战 Demo', exact: true }).click()
  await expect(page.getByLabel('日历日期', { exact: true })).toHaveValue('2026-11-01')
})

test('@C22 explicit instants survive display-zone changes and distinguish DST overlap', async ({
  page,
}) => {
  await page.goto('/libraries/moment-migration?tab=demo&example=business')
  const report = page.getByTestId('instant-report')
  const zone = page.getByRole('combobox', { name: '显示时区', exact: true })
  await zone.selectOption('Asia/Shanghai')
  await expect(report).toContainText('2026-11-01T05:30:00.000Z')
  await expect(report).toContainText('13:30:00')
  await zone.selectOption('America/New_York')
  for (const [button, iso] of [
    ['回拨较早 01:30', '2026-11-01T05:30:00.000Z'],
    ['回拨较晚 01:30', '2026-11-01T06:30:00.000Z'],
  ]) {
    await page.getByRole('button', { name: button, exact: true }).click()
    await expect(report).toContainText(iso)
    await expect(report).toContainText('01:30:00')
  }
  await page.getByRole('button', { name: '试缺少偏移', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('不接受无偏移')
  await page.getByLabel('带偏移 ISO 时间点', { exact: true }).fill('2026-02-30T05:30:00Z')
  await expect(report).toContainText('"valid": false')
})

test('@C22 calendar days and elapsed hours diverge across both DST transitions', async ({
  page,
}) => {
  await page.goto('/libraries/moment-migration?tab=demo&example=advanced')
  for (const [fixture, hours, clock] of [
    ['spring', 23, '13:00'],
    ['fall', 25, '11:00'],
    ['ordinary', 24, '12:00'],
  ] as const) {
    await page.getByRole('combobox', { name: '纽约排程样例', exact: true }).selectOption(fixture)
    const report = page.getByTestId('dst-report')
    await expect(report).toContainText(`"fixture": "${fixture}"`)
    const data = JSON.parse((await report.textContent()) ?? '{}')
    expect(data.calendarElapsedHours).toBe(hours)
    expect(data.elapsedHours).toBe(24)
    expect(data.calendarNext).toContain('12:00')
    expect(data.elapsedNext).toContain(clock)
    expect(data.originalAfterBoth).toBe(data.start)
  }
})
