import { expect, test } from '@playwright/test'

test('@E09 basic token preservation and reset', async ({ page }) => {
  await page.goto('/libraries/shiki?tab=demo&example=basic')
  const app = page.getByRole('region', { name: 'Shiki 真实 token 示例', exact: true })
  const input = app.getByLabel('Shiki 源代码', { exact: true })
  const output = app.getByTestId('shiki-token-output')
  await input.fill('const 星 = "news";\nconsole.log(星);')
  await expect(output).toHaveText('const 星 = "news";\nconsole.log(星);')
  await expect(output.locator('span[style]').first()).toBeVisible()
  await app.getByRole('button', { name: '重置样例', exact: true }).click()
  await expect(output).toContainText('const count: number = 2;')
})

test('@E09 language switching keeps latest input and clears owned pending timer on unmount', async ({
  page,
}) => {
  await page.goto('/libraries/shiki?tab=demo&example=business')
  const app = page.getByRole('region', { name: 'Shiki 真实 token 示例', exact: true })
  await expect(app.locator('p[role="status"]')).toHaveText('真实 Shiki token 化完成')
  const input = app.getByLabel('Shiki 源代码', { exact: true })
  await input.fill('{"ready":true}')
  await app.getByLabel('高亮语言', { exact: true }).selectOption('json')
  await expect(app.getByTestId('shiki-token-output')).toHaveText('{"ready":true}')
  await input.fill('<h2>last source</h2>')
  await app.getByLabel('高亮语言', { exact: true }).selectOption('html')
  await expect(app.getByTestId('shiki-token-output')).toHaveText('<h2>last source</h2>')
  await expect(app.getByTestId('shiki-token-output').locator('h2')).toHaveCount(0)
  const clockStart = new Date()
  await page.clock.install({ time: clockStart })
  await page.clock.pauseAt(clockStart)
  await page.evaluate(() => {
    const originalSet = window.setTimeout,
      originalClear = window.clearTimeout
    const pending = new Set<number>()
    const probe = { pending, cleared: 0, fired: 0 }
    Object.assign(window, { e09TimerProbe: probe })
    window.setTimeout = ((handler: TimerHandler, delay?: number, ...args: unknown[]) => {
      if (delay !== 160 || typeof handler !== 'function')
        return originalSet(handler, delay, ...args)
      const id = originalSet(() => {
        pending.delete(id)
        probe.fired++
        handler(...args)
      }, delay)
      pending.add(id)
      return id
    }) as typeof window.setTimeout
    window.clearTimeout = (id?: Parameters<typeof window.clearTimeout>[0]) => {
      if (typeof id === 'number' && pending.delete(id)) probe.cleared++
      originalClear(id)
    }
  })
  await input.fill('const pending = 1')
  await expect(app.locator('p[role="status"]')).toHaveText('正在解析 token…')
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { e09TimerProbe: { pending: Set<number> } }).e09TimerProbe.pending
          .size,
    ),
  ).toBe(1)
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await page.clock.runFor(200)
  expect(
    await page.evaluate(() => {
      const p = (
        window as unknown as {
          e09TimerProbe: { pending: Set<number>; cleared: number; fired: number }
        }
      ).e09TimerProbe
      return { pending: p.pending.size, cleared: p.cleared, fired: p.fired }
    }),
  ).toEqual({ pending: 0, cleared: 1, fired: 0 })
  // Outer timer observation only; not evidence of canceling an already started tokenizer.
})

test('@E09 untrusted tags remain text and trigger no probe image request', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('example.invalid/e09-probe')) requests.push(request.url())
  })
  await page.goto('/libraries/shiki?tab=demo&example=advanced')
  const app = page.getByRole('region', { name: 'Shiki 真实 token 示例', exact: true })
  await page.evaluate(() => Object.assign(window, { e09Executed: false }))
  const source =
    '<script>window.e09Executed=true</script>\n<img src="https://example.invalid/e09-probe" onerror="window.e09Executed=true">'
  await app.getByLabel('Shiki 源代码', { exact: true }).fill(source)
  const output = app.getByTestId('shiki-token-output')
  await expect(output).toHaveText(source)
  await expect(output.locator('script,img,[onerror]')).toHaveCount(0)
  expect(
    await page.evaluate(() => (window as unknown as { e09Executed: boolean }).e09Executed),
  ).toBe(false)
  expect(requests).toEqual([])
})
