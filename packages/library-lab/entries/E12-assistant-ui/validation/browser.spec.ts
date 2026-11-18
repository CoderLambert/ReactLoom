import { expect, test } from '@playwright/test'

const appName = 'assistant-ui真实运行时实验'
async function send(page: import('@playwright/test').Page, text: string) {
  const app = page.getByRole('region', { name: appName, exact: true })
  await app.getByRole('textbox', { name: '向本地适配器提问' }).fill(text)
  await app.getByRole('button', { name: '发送', exact: true }).click()
  return app
}
test('E12 real primitives local reply, visible cumulative stream and error recovery @E12', async ({
  page,
}) => {
  await page.goto('/libraries/assistant-ui?tab=demo&example=basic')
  let app = page.getByRole('region', { name: appName, exact: true })
  const input = app.getByRole('textbox', { name: '向本地适配器提问' })
  await input.fill('Enter不发送')
  await input.press('Enter')
  await expect(app.getByTestId('assistant-user')).toHaveCount(0)
  await send(page, 'basic source')
  await expect(app.getByTestId('assistant-text').last()).toHaveText(
    '本地演示已收到：basic source。这是确定性回复，不是模型推理。',
  )
  await send(page, '/error')
  await expect(app.getByRole('alert')).toContainText('本地模拟失败')
  await send(page, 'recovered prompt')
  await expect(app.getByTestId('assistant-text').last()).toContainText('recovered prompt')
  await expect(app.getByTestId('assistant-text').last()).not.toContainText('basic source')
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('business')
  app = page.getByRole('region', { name: appName, exact: true })
  await expect(app.getByTestId('assistant-user')).toHaveCount(0)
  await send(page, '研究任务'.repeat(30))
  const reply = app.getByTestId('assistant-text').last()
  await expect(reply).toContainText('本地研究任务')
  const first = await reply.textContent()
  await expect
    .poll(async () => (await reply.textContent())?.length ?? 0)
    .toBeGreaterThan(first?.length ?? 0)
  await expect(reply).toContainText('本示例没有检索实时新闻。')
})
type Probe = { pending: Set<number>; cleared: number; fired: number; aborts: number }
async function probe(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const p = (window as Window & { e12Probe: Probe }).e12Probe
    return { pending: p.pending.size, cleared: p.cleared, fired: p.fired, aborts: p.aborts }
  })
}
test('E12 actual stop/unmount/level change abort owned pending sleeps under controlled clock @E12', async ({
  page,
}) => {
  await page.goto('/libraries/assistant-ui?tab=demo&example=advanced')
  let app = await send(page, '首段可见校验'.repeat(12))
  await expect(app.getByTestId('assistant-text').last()).toContainText('取消与流式实验')
  await app.getByRole('button', { name: '停止响应', exact: true }).click()
  await page.clock.install()
  await page.clock.pauseAt(new Date(Date.now() + 1000))
  await page.evaluate(() => {
    const set = window.setTimeout,
      clear = window.clearTimeout,
      abort = AbortController.prototype.abort
    const p: Probe = { pending: new Set(), cleared: 0, fired: 0, aborts: 0 }
    Object.assign(window, { e12Probe: p })
    window.setTimeout = ((handler: TimerHandler, delay?: number, ...args: unknown[]) => {
      if (delay !== 450 || typeof handler !== 'function') return set(handler, delay, ...args)
      const id = set(() => {
        p.pending.delete(id)
        p.fired++
        handler(...args)
      }, delay)
      p.pending.add(id)
      return id
    }) as typeof window.setTimeout
    window.clearTimeout = (id?: number) => {
      if (id !== undefined && p.pending.delete(id)) p.cleared++
      clear(id)
    }
    AbortController.prototype.abort = function (reason?: unknown) {
      p.aborts++
      return abort.call(this, reason)
    }
  })
  await send(page, 'controlled cancel question '.repeat(5))
  await expect.poll(async () => (await probe(page)).pending).toBeGreaterThan(0)
  await page.clock.runFor(450)
  await expect(app.getByTestId('assistant-text').last()).toContainText('取消与流式实验')
  await expect.poll(async () => (await probe(page)).pending).toBeGreaterThan(0)
  const before = await probe(page)
  await app.getByRole('button', { name: '停止响应', exact: true }).click()
  await expect.poll(async () => (await probe(page)).pending).toBe(0)
  const stopped = await app.getByTestId('assistant-text').last().textContent(),
    after = await probe(page)
  expect(after.cleared).toBeGreaterThan(before.cleared)
  expect(after.aborts).toBeGreaterThan(before.aborts)
  await page.clock.runFor(1800)
  await expect(app.getByTestId('assistant-text').last()).toHaveText(stopped ?? '')
  expect((await probe(page)).fired).toBe(after.fired)
  await send(page, 'fresh response')
  await page.clock.runFor(6000)
  await expect(app.getByTestId('assistant-text').last()).toContainText('fresh response')
  await expect(app.getByTestId('assistant-text').last()).not.toContainText(
    'controlled cancel question',
  )
  await send(page, 'pending at level change')
  await expect.poll(async () => (await probe(page)).pending).toBeGreaterThan(0)
  const levelBefore = await probe(page)
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('business')
  await expect.poll(async () => (await probe(page)).pending).toBe(0)
  expect((await probe(page)).aborts).toBeGreaterThan(levelBefore.aborts)
  await expect(app.getByTestId('assistant-user')).toHaveCount(0)
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('advanced')
  app = await send(page, 'pending at unmount')
  await expect.poll(async () => (await probe(page)).pending).toBeGreaterThan(0)
  const unmountBefore = await probe(page)
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect.poll(async () => (await probe(page)).pending).toBe(0)
  const unmounted = await probe(page)
  expect(unmounted.aborts).toBeGreaterThan(unmountBefore.aborts)
  expect(unmounted.cleared).toBeGreaterThan(unmountBefore.cleared)
  await page.clock.runFor(1800)
  expect((await probe(page)).fired).toBe(unmounted.fired)
  await expect(app).toHaveCount(0)
})
