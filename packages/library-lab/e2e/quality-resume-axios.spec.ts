import { expect, test } from '@playwright/test'

test('@D09 unmount clears actual fixture and delayed race timers', async ({ page }) => {
  await page.goto('/libraries/axios?tab=demo&example=business')
  await expect(page.getByRole('button', { name: '先慢后快竞态' })).toBeVisible()
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') })
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'))
  await page.evaluate(() => {
    const host = window as Window & {
      __d09TimerProbe?: () => { pending: number; fired: number; scheduled: number }
    }
    const originalSet = window.setTimeout.bind(window)
    const originalClear = window.clearTimeout.bind(window)
    const pending = new Set<number>()
    let fired = 0
    let scheduled = 0
    window.setTimeout = ((handler: TimerHandler, delay?: number, ...args: unknown[]) => {
      if (typeof handler !== 'function' || ![40, 60, 340].includes(delay ?? 0))
        return originalSet(handler, delay, ...args)
      scheduled++
      const id = originalSet(() => {
        pending.delete(id)
        fired++
        handler(...args)
      }, delay)
      pending.add(id)
      return id
    }) as typeof window.setTimeout
    window.clearTimeout = ((id?: number) => {
      if (id !== undefined) pending.delete(id)
      originalClear(id)
    }) as typeof window.clearTimeout
    host.__d09TimerProbe = () => ({ pending: pending.size, fired, scheduled })
  })
  await page.getByRole('button', { name: '先慢后快竞态' }).click()
  const read = () =>
    page.evaluate(() => {
      const probe = (
        window as Window & {
          __d09TimerProbe?: () => { pending: number; fired: number; scheduled: number }
        }
      ).__d09TimerProbe
      if (!probe) throw new Error('Timer probe was not installed')
      return probe()
    })
  const before = await read()
  expect(before.pending).toBeGreaterThan(0)
  expect(before.scheduled).toBeGreaterThan(0)
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect.poll(async () => (await read()).pending).toBe(0)
  expect((await read()).fired).toBe(before.fired)
  await page.clock.runFor(450)
  expect(await read()).toEqual({ ...before, pending: 0 })
})

test('@D09 instance headers, tenant boundary, IME, race and cancellation', async ({ page }) => {
  await page.goto('/libraries/axios?tab=demo&example=basic')
  await page.getByRole('button', { name: 'GET 列表', exact: true }).click()
  await expect(page.getByTestId('axios-result')).toContainText('a1')
  await expect(page.getByRole('list').filter({ hasText: 'X-Lab-Request' })).toContainText(
    'X-Lab-Request=isolated',
  )
  await page.goto('/libraries/axios?tab=demo&example=business')
  const input = page.getByLabel('RSS标题')
  const result = page.getByTestId('axios-result')
  await input.dispatchEvent('compositionstart')
  await input.fill('React')
  await page.getByRole('button', { name: 'GET 列表', exact: true }).click()
  await expect(result).toHaveText('等待操作')
  await input.dispatchEvent('compositionend')
  await page.getByRole('button', { name: 'GET 列表', exact: true }).click()
  await expect(result).toContainText('a1')
  await page.getByRole('button', { name: '先慢后快竞态' }).click()
  await expect(result).toContainText('a1')
  await page.waitForTimeout(450)
  await expect(result).toContainText('a1')
  await expect(result).not.toContainText('a2')
  await page.getByRole('button', { name: '先慢后快竞态' }).click()
  await page.getByLabel('租户', { exact: true }).selectOption('b')
  await expect(result).toContainText('b1')
  await page.waitForTimeout(450)
  await expect(result).toContainText('b1')
  await expect(result).not.toContainText('a1')
  await page.getByRole('button', { name: '先慢后快竞态' }).click()
  await page.getByRole('button', { name: '取消请求' }).click()
  await page.waitForTimeout(450)
  await expect(result).toHaveText('请求已取消')
  await page.getByRole('tab', { name: 'Agent 指南' }).click()
  await expect(result).toHaveCount(0)
})
test('@D09 custom bounded GET retry and single POST409', async ({ page }) => {
  await page.goto('/libraries/axios?tab=demo&example=advanced')
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: 'GET 503 限定重试' }).click()
    await expect(page.getByTestId('axios-result')).toContainText('status 200')
  }
  await expect(page.locator('li').filter({ hasText: 'GET /transient → 503' })).toHaveCount(2)
  await page.getByRole('button', { name: 'POST 409 不重试' }).click()
  await expect(page.getByTestId('axios-result')).toContainText('HTTP 409')
  await expect(page.locator('li').filter({ hasText: 'POST /conflict → 409' })).toHaveCount(1)
  await page.getByRole('button', { name: '停止并卸载' }).click()
  await expect(page.getByTestId('axios-result')).toHaveCount(0)
})
