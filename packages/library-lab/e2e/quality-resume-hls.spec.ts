import { expect, type Page, test } from '@playwright/test'

const name = 'hls.js真实播放引擎'
const host = 'https://test-streams.mux.dev/'
type HlsProbe = { destroyed: number[]; media: HTMLVideoElement }
async function observe(page: Page) {
  await page.getByTestId('hls-media').evaluate((element) => {
    const probe: HlsProbe = { destroyed: [], media: element as HTMLVideoElement }
    Object.assign(window, { hlsProbe: probe })
    element.addEventListener('reactloom-e17-destroying', (event) => {
      probe.destroyed.push((event as CustomEvent<{ id: number }>).detail.id)
    })
  })
}
async function state(page: Page) {
  return page.evaluate(() => {
    const p = (window as unknown as { hlsProbe: HlsProbe }).hlsProbe
    return {
      destroyed: p.destroyed,
      paused: p.media.paused,
      src: p.media.getAttribute('src'),
      readyState: p.media.readyState,
    }
  })
}
test('@E17 opt-in actual public HLS decoding, requested quality and stop', async ({ page }) => {
  test.setTimeout(60_000)
  await page.addInitScript(() => {
    const original = URL.createObjectURL
    const p = { sources: [] as MediaSource[], closed: 0 }
    Object.assign(window, { mseProbe: p })
    URL.createObjectURL = (object) => {
      if (typeof MediaSource !== 'undefined' && object instanceof MediaSource) {
        p.sources.push(object)
        object.addEventListener('sourceclose', () => p.closed++)
      }
      return original(object)
    }
  })
  const requests: string[] = []
  page.on('request', (request) => {
    if (request.url().startsWith(host)) requests.push(request.url())
  })
  await page.goto('/libraries/hlsjs?tab=demo&example=basic')
  let app = page.getByRole('region', { name, exact: true })
  await expect(app.locator('p[role=status]')).toContainText('未加载')
  expect(requests).toEqual([])
  await observe(page)
  await app.getByRole('button', { name: '加载公开HLS测试流（外部请求）', exact: true }).click()
  await expect(app.locator('p[role=status]')).toContainText('已读取真实HLS清单', {
    timeout: 20_000,
  })
  const media = page.getByTestId('hls-media')
  await expect
    .poll(() => media.evaluate((v) => (v as HTMLVideoElement).readyState), { timeout: 20_000 })
    .toBeGreaterThanOrEqual(2)
  expect(
    await page.evaluate(() =>
      (window as unknown as { mseProbe: { sources: MediaSource[] } }).mseProbe.sources.some(
        (source) => source.readyState === 'open',
      ),
    ),
  ).toBe(true)
  await media.focus()
  await page.keyboard.press('Space')
  await expect
    .poll(() => media.evaluate((v) => (v as HTMLVideoElement).currentTime), { timeout: 10_000 })
    .toBeGreaterThan(0)
  await app.getByRole('button', { name: '停止并销毁', exact: true }).click()
  await expect.poll(async () => (await state(page)).destroyed.length).toBe(1)
  await expect
    .poll(async () => {
      const p = await state(page)
      return p.paused && p.src === null && p.readyState === 0
    })
    .toBe(true)
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('business')
  app = page.getByRole('region', { name, exact: true })
  await observe(page)
  await app.getByRole('button', { name: '加载公开HLS测试流（外部请求）', exact: true }).click()
  const quality = app.getByLabel('请求画质', { exact: true })
  await expect(quality).toBeEnabled({ timeout: 20_000 })
  await quality.selectOption('0')
  await expect(app.getByTestId('hls-level')).toContainText('请求：0')
  await expect
    .poll(() => media.evaluate((video) => (video as HTMLVideoElement).readyState), {
      timeout: 20_000,
    })
    .toBeGreaterThanOrEqual(2)
  await media.focus()
  await page.keyboard.press('Space')

  await expect(app.getByTestId('hls-level')).toContainText('SDK已切换层：0', { timeout: 20_000 })
  await expect
    .poll(() => media.evaluate((v) => (v as HTMLVideoElement).videoHeight), { timeout: 20_000 })
    .toBe(184)
  expect(requests.some((url) => url.includes('/url_2/'))).toBe(true)
  await quality.selectOption('-1')
  await expect(app.getByTestId('hls-level')).toContainText('请求：自动')
  await app.getByRole('button', { name: '停止并销毁', exact: true }).click()
  await expect.poll(async () => (await state(page)).destroyed.length).toBe(1)
  await expect
    .poll(() =>
      page.evaluate(() => {
        const p = (window as unknown as { mseProbe: { sources: MediaSource[]; closed: number } })
          .mseProbe
        return (
          p.sources.length >= 2 &&
          p.sources.every((source) => source.readyState === 'closed') &&
          p.closed >= 2
        )
      }),
    )
    .toBe(true)
  const stoppedRequests = requests.length
  await page.waitForTimeout(1500) // Bounded post-destroy request convergence, beyond the manifest retry delay.
  expect(requests).toHaveLength(stoppedRequests)
})

test('@E17 explicitly injected fatal uses actual SDK event and destroys owned engine', async ({
  page,
}) => {
  const requests: string[] = []
  page.on('request', (r) => {
    if (r.url().startsWith(host)) requests.push(r.url())
  })
  await page.goto('/libraries/hlsjs?tab=demo&example=advanced')
  const app = page.getByRole('region', { name, exact: true })
  await observe(page)
  const start = app.getByRole('button', { name: '本地诊断会话（不拉清单）', exact: true })
  await start.click()
  await expect(app.locator('p[role=status]')).toContainText('本地诊断MSE已连接')
  await app.getByRole('button', { name: '注入本地fatal（非网络测试）', exact: true }).click()
  await expect(app.locator('p[role=status]')).toContainText('本地注入fatal，非外部网络故障')
  await expect.poll(async () => (await state(page)).destroyed).toEqual([1])
  await expect
    .poll(async () => {
      const p = await state(page)
      return p.paused && p.src === null && p.readyState === 0
    })
    .toBe(true)
  await start.click()
  await expect(app.locator('p[role=status]')).toContainText('本地诊断MSE已连接')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect.poll(async () => (await state(page)).destroyed).toEqual([1, 2])
  const ended = await state(page)
  expect(ended.paused).toBe(true)
  expect(ended.src).toBeNull()
  expect(ended.readyState).toBe(0)
  expect(requests).toEqual([])
})

test('@E17 blocked network creates actual loader fatal, then a fresh session recovers', async ({
  page,
}) => {
  let attempts = 0
  await page.route(`${host}**`, (route) => {
    attempts++
    return route.abort('failed')
  })
  await page.goto('/libraries/hlsjs?tab=demo&example=advanced')
  const app = page.getByRole('region', { name, exact: true })
  await observe(page)
  await app.getByRole('button', { name: '加载公开HLS测试流（外部请求）', exact: true }).click()
  await expect(app.locator('p[role=status]')).toContainText('fatal', { timeout: 15_000 })
  await expect(app.locator('p[role=status]')).toContainText('networkError')
  expect(attempts).toBeGreaterThan(0)
  await expect.poll(async () => (await state(page)).destroyed).toEqual([1])
  await expect(app.getByLabel('请求画质', { exact: true })).toBeDisabled()
  await app.getByRole('button', { name: '本地诊断会话（不拉清单）', exact: true }).click()
  await expect(app.locator('p[role=status]')).toContainText('本地诊断MSE已连接')
  await app.getByRole('button', { name: '停止并销毁', exact: true }).click()
  await expect.poll(async () => (await state(page)).destroyed).toEqual([1, 2])
})
