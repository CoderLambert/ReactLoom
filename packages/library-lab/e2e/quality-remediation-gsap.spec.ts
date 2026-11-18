// NOT_RUN. Root adopts this for a matching build. Real DOM/CSS/clock, no mocked GSAP or hidden getter.
import { expect, type Locator, type Page, test } from '@playwright/test'
import { withNativeVisibilityBrowser } from './native-visibility-browser'

type Snapshot = {
  instance: number
  kind: string
  progress: number
  time: number
  duration: number
  paused: boolean
  reversed: boolean
  labels: Record<string, number>
  children: { start: number; duration: number }[]
  targets: { name: string; x: number | string; y: number | string; opacity: number | string }[]
}
async function read(app: Locator): Promise<Snapshot | null> {
  await app.getByRole('button', { name: '读取真实动画状态', exact: true }).click()
  return JSON.parse((await app.getByTestId('b02-sdk-state').textContent()) ?? 'null')
}
async function requireState(app: Locator): Promise<Snapshot> {
  const result = await read(app)
  if (!result) throw new Error('No actual owned GSAP animation')
  return result
}
async function open(page: Page, level: 'basic' | 'advanced') {
  await page.setViewportSize({ width: 1280, height: 1600 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto(`http://127.0.0.1:4319/libraries/gsap?tab=demo&example=${level}`)
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  if (await run.isVisible()) await run.click()
  const app = page.getByRole('region', { name: 'GSAP timeline 实战', exact: true })
  await expect(app.getByTestId('b02-status')).toContainText('真实 GSAP')
  await app.getByText('查看真实动画与样式', { exact: true }).click()
  return app
}
async function seek(app: Locator, percent: number) {
  const slider = app.getByRole('slider', { name: '手动时间进度', exact: true })
  await slider.focus()
  await slider.press('Home')
  for (let i = 0; i < percent; i++) await slider.press('ArrowRight')
  await expect(slider).toHaveValue(String(percent))
}

test('@B02 Tween actual CSS maps equal time through distinct eases and keeps selectors local', async ({
  page,
}) => {
  const app = await open(page, 'basic')
  // A native DOM negative control outside the GSAP context, never a substitute animation result.
  await page.evaluate(() => {
    const peer = document.createElement('div')
    peer.id = 'b02-outside-peer'
    peer.className = 'b02-card'
    peer.style.transform = 'translateX(11px)'
    peer.style.opacity = '0.8'
    peer.textContent = 'Outside context'
    document.body.append(peer)
  })
  const easing = app.getByRole('combobox', { name: '缓动', exact: true })
  await easing.selectOption('none')
  await seek(app, 50)
  const linear = await requireState(app)
  expect(linear.kind).toBe('Tween')
  expect(linear.duration).toBe(1.2)
  expect(linear.progress).toBe(0.5)
  expect(linear.paused).toBe(true)
  expect(Number(linear.targets[0].x)).toBeCloseTo(30, 5)
  expect(Number(linear.targets[0].opacity)).toBeCloseTo(0.675, 4)
  const card = app.getByTestId('b02-card-0')
  expect(
    await card.evaluate(
      (element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41,
    ),
  ).toBeCloseTo(30, 5)
  await easing.selectOption('power2.out')
  await seek(app, 50)
  const eased = await requireState(app)
  expect(eased.progress).toBe(0.5)
  expect(Number(eased.targets[0].x)).toBeCloseTo(52.5, 5)
  expect(
    await card.evaluate(
      (element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41,
    ),
  ).toBeCloseTo(52.5, 5)
  const beforeReplay = eased.instance
  await app.getByRole('button', { name: '重播动画', exact: true }).click()
  await expect.poll(async () => (await requireState(app)).instance).toBeGreaterThan(beforeReplay)
  expect(
    await page.locator('#b02-outside-peer').evaluate((node) => ({
      transform: getComputedStyle(node).transform,
      opacity: getComputedStyle(node).opacity,
    })),
  ).toEqual({ transform: 'matrix(1, 0, 0, 1, 11, 0)', opacity: '0.8' })
  await page.locator('#b02-outside-peer').evaluate((node) => node.remove())
})

test('@B02 Timeline real labels, reverse clock, pause, media gate and context revert', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const app = await open(page, 'advanced')
  await app.getByRole('button', { name: '定位详情标签', exact: true }).click()
  const atLabel = await requireState(app)
  expect(atLabel.kind).toBe('Timeline')
  expect(atLabel.time).toBe(0.7)
  expect(atLabel.duration).toBe(1.1)
  expect(atLabel.labels).toEqual({ cards: 0, detail: 0.7 })
  expect(atLabel.children.map((child) => child.start)).toEqual([0, 0.7])
  expect(atLabel.children[0].duration).toBe(1.02)
  expect(atLabel.paused).toBe(true)
  const paused = atLabel.progress
  await page.waitForTimeout(160) // absence observation while explicitly paused, not a performance sample
  expect((await requireState(app)).progress).toBe(paused)
  await seek(app, 75)
  await app.getByRole('button', { name: '反向播放', exact: true }).click()
  await expect.poll(async () => (await requireState(app)).progress).toBeLessThan(0.75)
  expect((await requireState(app)).reversed).toBe(true)
  await app.getByRole('button', { name: '暂停', exact: true }).click()
  expect((await requireState(app)).paused).toBe(true)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(app.getByTestId('b02-status')).toContainText('不创建动画')
  await expect(app.getByTestId('b02-progress')).toHaveAttribute('value', '100')
  await expect(app.getByRole('slider', { name: '手动时间进度', exact: true })).toBeDisabled()
  await expect(app.getByRole('button', { name: '重播动画', exact: true })).toBeDisabled()
  expect(await read(app)).toBeNull()
  for (const card of await app.locator('.b02-card').all()) {
    await expect(card).toHaveCSS('opacity', '1')
    await expect(card).toHaveCSS('transform', 'none')
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(app.getByRole('button', { name: '继续', exact: true })).toBeEnabled()
  expect((await requireState(app)).paused).toBe(true) // user pause survives preference rebuild
  await app.getByRole('button', { name: '继续', exact: true }).click()
  await expect.poll(async () => (await requireState(app)).progress).toBeGreaterThan(0)
  const nodes = await app.locator('.b02-card,.b02-detail').elementHandles()
  await info.attach('b02-real-timeline.png', {
    body: await app.getByTestId('b02-stage').screenshot(),
    contentType: 'image/png',
  })
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  for (const node of nodes) {
    expect(
      await node.evaluate((element) => {
        if (!(element instanceof HTMLElement)) throw new Error('Not the real HTML animation target')
        return {
          connected: element.isConnected,
          transform: element.style.transform,
          opacity: element.style.opacity,
          reverted: element.dataset.b02Reverted,
          remaining: element.dataset.b02RemainingTweens,
        }
      }),
    ).toEqual({ connected: false, transform: '', opacity: '', reverted: 'true', remaining: '0' })
  }
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(app.getByTestId('b02-card-0')).toHaveCount(1)
  expect(errors).toEqual([])
})

test('@B02 native page visibility keeps a real manual pause', async () => {
  await withNativeVisibilityBrowser(async (page) => {
    const app = await open(page, 'advanced')
    await seek(app, 50)
    const before = await requireState(app)
    const other = await page.context().newPage()
    try {
      await other.goto('about:blank')
      await other.bringToFront()
      await expect.poll(() => page.evaluate(() => document.hidden)).toBe(true)
      await expect(app.getByTestId('b02-conditions')).toContainText('后台')
      await page.bringToFront()
      await expect(app.getByTestId('b02-conditions')).toContainText('可见')
      expect((await requireState(app)).paused).toBe(true)
      expect((await requireState(app)).progress).toBe(before.progress)
    } finally {
      await other.close()
    }
  })
})

// Native visibility may be explicitly SKIP/NOT_RUN if unsupported; it cannot satisfy a runtime PASS.
// All DOM cases are NOT_RUN until root runs against the matching build. Node targets prove neither
// CSSPlugin paint nor listener teardown. No synthetic visibility or mocked clock is used.
