import { expect, test } from '@playwright/test'

// ECharts 6.1.0 pins its live instance ID on the host as _echarts_instance_.
// Its real dispose() implementation clears that marker on the *same* element.
// Retain the detached host to distinguish actual SDK disposal from React DOM removal.
test('@A01 actual ECharts instance is disposed on stop and a new instance mounts', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/libraries/echarts?tab=demo&example=advanced')
  await page.getByRole('button', { name: '运行当前示例' }).click()

  const chart = page.getByRole('img', { name: /七天阅读趋势交互图表/u })
  await expect(chart.locator('canvas')).toHaveCount(1)
  const firstId = await chart.evaluate((node) => {
    ;(window as Window & { __a01DetachedHost?: Element }).__a01DetachedHost = node
    return node.getAttribute('_echarts_instance_')
  })
  expect(firstId).toMatch(/^ec_/u)

  await page.getByRole('button', { name: '停止并卸载' }).click()
  await expect(chart).toHaveCount(0)
  const disposed = await page.evaluate(() => {
    const host = (window as Window & { __a01DetachedHost?: Element }).__a01DetachedHost
    return { connected: host?.isConnected, instanceId: host?.getAttribute('_echarts_instance_') }
  })
  expect(disposed).toEqual({ connected: false, instanceId: '' })

  await page.getByRole('button', { name: '运行当前示例' }).click()
  await expect(chart.locator('canvas')).toHaveCount(1)
  const secondId = await chart.getAttribute('_echarts_instance_')
  expect(secondId).toMatch(/^ec_/u)
  expect(secondId).not.toBe(firstId)

  await page.getByRole('tab', { name: 'Agent 指南' }).click()
  await expect(chart).toHaveCount(0)
  expect(errors).toEqual([])
})
