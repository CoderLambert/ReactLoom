import { expect, type Locator, test } from '@playwright/test'

const URL_HLS = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
const appName = 'hls.js真实播放引擎'
type MediaProbe = { destroyed: number[]; pauses: number; loads: number }
async function observeMedia(video: Locator) {
  return video.evaluateHandle((element) => {
    const media = element as HTMLVideoElement
    const p: MediaProbe = { destroyed: [], pauses: 0, loads: 0 }
    const pause = media.pause.bind(media),
      load = media.load.bind(media)
    media.pause = () => {
      p.pauses++
      return pause()
    }
    media.load = () => {
      p.loads++
      return load()
    }
    media.addEventListener('reactloom-e17-destroying', (event) =>
      p.destroyed.push((event as CustomEvent<{ id: number }>).detail.id),
    )
    return p
  })
}
test('E17 EXTERNAL integration: explicit actual master manifest, quality request and media cleanup @E17', async ({
  page,
}) => {
  const requests: string[] = []
  await page.addInitScript(() => {
    const original = URL.createObjectURL
    const p = { sources: [] as MediaSource[], closed: 0 }
    Object.assign(window, { e17Mse: p })
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (typeof MediaSource !== 'undefined' && object instanceof MediaSource) {
        p.sources.push(object)
        object.addEventListener('sourceclose', () => p.closed++)
      }
      return original.call(URL, object)
    }
  })
  page.on('request', (r) => {
    if (r.url().startsWith('https://test-streams.mux.dev/')) requests.push(r.url())
  })
  await page.goto('/libraries/hlsjs?tab=demo&example=business')
  const app = page.getByRole('region', { name: appName, exact: true }),
    video = app.getByTestId('hls-media')
  await expect(app.getByRole('status')).toContainText('不会自动联网')
  expect(requests).toEqual([])
  const probe = await observeMedia(video)
  const response = page.waitForResponse((r) => r.url() === URL_HLS)
  await app.getByRole('button', { name: '加载公开HLS测试流（外部请求）', exact: true }).click()
  const master = await response
  expect(master.ok()).toBe(true)
  expect(await master.text()).toContain('#EXT-X-STREAM-INF')
  await expect(app.getByRole('status')).toContainText('已读取真实HLS清单', { timeout: 20000 })
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as Window & { e17Mse: { sources: MediaSource[] } }).e17Mse.sources.filter(
            (source) => source.readyState === 'open',
          ).length,
      ),
    )
    .toBeGreaterThan(0)
  const quality = app.getByRole('combobox', { name: '请求画质', exact: true })
  expect(await quality.locator('option').count()).toBeGreaterThan(2)
  const fixed = await quality.locator('option').last().getAttribute('value')
  if (fixed === null) throw Error('missing level value')
  await quality.selectOption(fixed)
  await expect(app.getByTestId('hls-level')).toContainText(`请求：${fixed}`)
  await quality.selectOption('-1')
  await expect(app.getByTestId('hls-level')).toContainText('请求：自动')
  // This verifies actual manifest + requested setter, not a decoded frame or bitrate switch.
  await app.getByRole('button', { name: '停止并销毁', exact: true }).click()
  await expect.poll(() => probe.evaluate((p) => p.destroyed.length)).toBe(1)
  expect(await probe.evaluate((p) => p.pauses)).toBeGreaterThan(0)
  expect(await probe.evaluate((p) => p.loads)).toBeGreaterThan(0)
  await expect(video).not.toHaveAttribute('src')
  expect(await video.evaluate((v) => (v as HTMLVideoElement).paused)).toBe(true)
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as Window & { e17Mse: { sources: MediaSource[] } }).e17Mse.sources.every(
          (source) => source.readyState === 'closed',
        ),
      ),
    )
    .toBe(true)
  expect(
    await page.evaluate(() => (window as Window & { e17Mse: { closed: number } }).e17Mse.closed),
  ).toBeGreaterThan(0)
  const stoppedRequests = requests.length
  await page.waitForTimeout(1500) // Observe convergence beyond the manifest retry delay.
  expect(requests).toHaveLength(stoppedRequests)
  await probe.dispose()
})
test('E17 CONTROLLED local SDK fatal event and retry/unmount do not request external stream @E17', async ({
  page,
}) => {
  const requests: string[] = []
  page.on('request', (r) => {
    if (r.url().includes('test-streams.mux.dev')) requests.push(r.url())
  })
  await page.goto('/libraries/hlsjs?tab=demo&example=advanced')
  const app = page.getByRole('region', { name: appName, exact: true }),
    video = app.getByTestId('hls-media')
  const probe = await observeMedia(video)
  await app.getByRole('button', { name: '本地诊断会话（不拉清单）', exact: true }).click()
  await expect(app.getByRole('status')).toContainText('本地诊断MSE已连接')
  await app.getByRole('button', { name: '注入本地fatal（非网络测试）', exact: true }).click()
  await expect(app.getByRole('status')).toContainText('本地注入fatal，非外部网络故障')
  await expect.poll(() => probe.evaluate((p) => p.destroyed.length)).toBe(1)
  await expect(video).not.toHaveAttribute('src')
  await app.getByRole('button', { name: '本地诊断会话（不拉清单）', exact: true }).click()
  await expect(app.getByRole('status')).toContainText('本地诊断MSE已连接')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect.poll(() => probe.evaluate((p) => p.destroyed.length)).toBe(2)
  expect(await probe.evaluate((p) => new Set(p.destroyed).size)).toBe(2)
  expect(await probe.evaluate((p) => p.pauses)).toBeGreaterThan(1)
  expect(await probe.evaluate((p) => p.loads)).toBeGreaterThan(1)
  expect(requests).toEqual([])
  await probe.dispose()
})
test('E17 CONTROLLED browser route abort produces actual SDK network fatal, distinct from external success @E17', async ({
  page,
}) => {
  let attempts = 0
  await page.route(URL_HLS, (route) => {
    attempts++
    return route.abort('failed')
  })
  await page.goto('/libraries/hlsjs?tab=demo&example=advanced')
  const app = page.getByRole('region', { name: appName, exact: true }),
    video = app.getByTestId('hls-media'),
    probe = await observeMedia(video)
  await app.getByRole('button', { name: '加载公开HLS测试流（外部请求）', exact: true }).click()
  await expect(app.getByRole('status')).toContainText('(fatal)', { timeout: 15000 })
  await expect(app.getByRole('status')).toContainText('manifestLoadError')
  expect(attempts).toBeGreaterThan(0)
  await expect.poll(() => probe.evaluate((p) => p.destroyed.length)).toBe(1)
  await expect(video).not.toHaveAttribute('src')
  const settled = attempts
  await page.waitForTimeout(1500)
  expect(attempts).toBe(settled)
  await expect(
    app.getByRole('button', { name: '注入本地fatal（非网络测试）', exact: true }),
  ).toBeDisabled()
  await probe.dispose()
  // Route abort is an injected network failure, never evidence the external endpoint failed.
})
