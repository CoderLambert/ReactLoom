import { expect, type Locator, type Page, test } from '@playwright/test'
import { withNativeVisibilityBrowser } from './native-visibility-browser'

type Reading = {
  frame: number
  totalFrames: number
  duration: number
  speed: number
  playing: boolean
  paused: boolean
  stopped: boolean
  frozen: boolean
}
async function open(page: Page, level: string) {
  await page.setViewportSize({ width: 1280, height: 1300 })
  await page.goto(`http://127.0.0.1:4319/libraries/dotlottie?tab=demo&example=${level}`)
  const app = page.getByTestId('b04-workshop')
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  await expect(app.or(run).first()).toBeVisible()
  if (await run.isVisible()) await run.click()
  await expect(app).toHaveAttribute('data-loaded', 'true', { timeout: 45_000 })
  return app
}
async function read(app: Locator): Promise<Reading> {
  await app.getByRole('button', { name: '读取播放器状态', exact: true }).click()
  return JSON.parse((await app.getByTestId('b04-reading').textContent()) ?? '{}')
}

test('@B04 real WASM decodes original JSON and owns play pause stop getters and Canvas', async ({
  page,
}, info) => {
  const wasm: { url: string; status: number }[] = []
  page.on('response', (response) => {
    if (response.url().includes('dotlottie-player.wasm'))
      wasm.push({ url: response.url(), status: response.status() })
  })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const app = await open(page, 'basic')
  const initial = await read(app)
  expect(initial.totalFrames).toBe(60)
  expect(initial.duration).toBe(2)
  expect(initial.playing).toBe(false)
  const pixels = await app.locator('canvas').evaluate((canvas) => {
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Not a Canvas element')
    const context = canvas.getContext('2d')
    if (!context) throw new Error('No real 2D renderer')
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data
    let green = 0
    for (let index = 0; index < data.length; index += 4)
      if (data[index + 3] > 0 && data[index + 1] > data[index] + 15) green++
    return green
  })
  expect(pixels).toBeGreaterThan(300)
  await app.getByRole('button', { name: '播放', exact: true }).click()
  await expect.poll(async () => (await read(app)).frame).toBeGreaterThan(2)
  expect((await read(app)).playing).toBe(true)
  await app.getByRole('button', { name: '暂停', exact: true }).click()
  const paused = await read(app)
  expect(paused.paused).toBe(true)
  await page.waitForTimeout(160)
  expect((await read(app)).frame).toBe(paused.frame)
  await app.getByRole('button', { name: '停止并回到首帧', exact: true }).click()
  await expect.poll(async () => (await read(app)).stopped).toBe(true)
  expect((await read(app)).frame).toBe(0)
  expect(
    wasm.some((response) => response.url.includes('@0.81.0/') && response.status === 200),
  ).toBe(true)
  const path = info.outputPath('b04-real-local-json.png')
  await app.locator('canvas').screenshot({ path })
  await info.attach('b04-real-local-json', { path, contentType: 'image/png' })
  await info.attach('b04-wasm-source.json', {
    body: JSON.stringify(wasm),
    contentType: 'application/json',
  })
})

test('@B04 local business result survives reduced motion and scene teardown cancels pending work', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const app = await open(page, 'business')
  await expect(app.getByRole('button', { name: '播放', exact: true })).toBeDisabled()
  await app.getByRole('button', { name: '模拟本地订阅确认', exact: true }).click()
  await expect(app.locator('p[role="status"]')).toContainText('本地处理中')
  await expect(app.locator('p[role="status"]')).toContainText('操作成功')
  expect((await read(app)).playing).toBe(false)
  expect((await read(app)).frame).toBe(0)
  await app.getByRole('button', { name: '模拟本地订阅确认', exact: true }).click()
  await expect(app.locator('p[role="status"]')).toContainText('本地处理中')
  const canvas = await app.locator('canvas').elementHandle()
  if (!canvas) throw new Error('No real Canvas')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  await expect.poll(() => canvas.evaluate((node) => node.dataset.playerDestroyed)).toBe('true')
  await page.waitForTimeout(700)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(app).toHaveAttribute('data-loaded', 'true')
  await expect(app.locator('p[role="status"]')).toContainText('尚未提交')
})

test('@B04 actual frame seek speed media changes and decoder failure recover without stale Canvas', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const app = await open(page, 'advanced')
  const slider = app.getByRole('slider', { name: '定位帧', exact: true })
  await slider.focus()
  await slider.press('Home')
  for (let index = 0; index < 30; index++) await slider.press('ArrowRight')
  expect((await read(app)).frame).toBe(30)
  await app.getByRole('combobox', { name: '速度', exact: true }).selectOption('1.5')
  expect((await read(app)).speed).toBe(1.5)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(app.locator('p[role="status"]')).toContainText('按系统偏好暂停')
  expect((await read(app)).frame).toBe(0)
  await app.getByRole('checkbox', { name: '明确允许在减少动态下播放', exact: true }).check()
  await app.getByRole('button', { name: '播放', exact: true }).click()
  await expect.poll(async () => (await read(app)).playing).toBe(true)
  const oldCanvas = await app.locator('canvas').elementHandle()
  if (!oldCanvas) throw new Error('No Canvas before data replacement')
  await app.getByRole('button', { name: '加载损坏的演示数据', exact: true }).click()
  await expect(app.getByRole('alert')).toContainText('播放器报告资源加载或渲染失败', {
    timeout: 30_000,
  })
  await expect(app).toHaveAttribute('data-loaded', 'false')
  await expect.poll(() => oldCanvas.evaluate((node) => node.dataset.playerDestroyed)).toBe('true')
  await expect(app.getByRole('button', { name: '读取播放器状态', exact: true })).toBeDisabled()
  await app.getByRole('button', { name: '恢复本地动画', exact: true }).click()
  await expect(app).toHaveAttribute('data-loaded', 'true')
  await expect(app.getByRole('alert')).toHaveCount(0)
  expect((await read(app)).totalFrames).toBe(60)
})

test('@B04 trusted native hidden tab pauses actual playback and preserves manual intent', async () => {
  await withNativeVisibilityBrowser(async (page) => {
    const app = await open(page, 'advanced')
    await app.getByRole('button', { name: '播放', exact: true }).click()
    await expect.poll(async () => (await read(app)).playing).toBe(true)
    await page.evaluate(() => {
      const events: { state: string; trusted: boolean }[] = []
      document.addEventListener('visibilitychange', (event) => {
        events.push({ state: document.visibilityState, trusted: event.isTrusted })
        document.documentElement.dataset.nativeVisibilityEvents = JSON.stringify(events)
      })
    })
    const sampleHidden = async (): Promise<Reading> => {
      await app.getByRole('button', { name: '读取播放器状态', exact: true }).evaluate((button) => {
        if (!(button instanceof HTMLButtonElement)) throw new Error('No read control')
        button.click() // Sampling actual getters without Playwright bringing the hidden tab forward.
      })
      return JSON.parse((await app.getByTestId('b04-reading').textContent()) ?? '{}')
    }
    const other = await page.context().newPage()
    try {
      await other.bringToFront()
      await expect.poll(() => page.evaluate(() => document.hidden)).toBe(true)
      await expect(app.locator('p[role="status"]')).toContainText('后台暂停')
      await expect.poll(async () => (await sampleHidden()).playing).toBe(false)
      const paused = await sampleHidden()
      await page.waitForTimeout(180)
      expect((await sampleHidden()).frame).toBe(paused.frame)
      await page.bringToFront()
      await expect.poll(async () => (await read(app)).playing).toBe(true)
      await app.getByRole('button', { name: '暂停', exact: true }).click()
      await other.bringToFront()
      await expect.poll(() => page.evaluate(() => document.hidden)).toBe(true)
      await page.bringToFront()
      expect((await read(app)).playing).toBe(false)
      const events = await page.evaluate(() =>
        JSON.parse(document.documentElement.dataset.nativeVisibilityEvents ?? '[]'),
      )
      expect(events).toEqual([
        { state: 'hidden', trusted: true },
        { state: 'visible', trusted: true },
        { state: 'hidden', trusted: true },
        { state: 'visible', trusted: true },
      ])
    } finally {
      await other.close()
    }
  })
})
