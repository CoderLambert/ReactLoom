import { expect, test } from '@playwright/test'

test('@F07 real PDF Canvas, text layer, zoom and recovery', async ({ page }) => {
  await page.goto('/libraries/react-pdf?tab=demo&example=basic')
  const region = page.getByRole('region', { name: 'react-pdf 文档预览', exact: true })
  await region.locator('canvas').waitFor()
  await expect(region.locator('.textLayer')).toHaveCount(0)
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('business')
  await expect(region.locator('.textLayer')).toContainText('Page One')
  await region.getByRole('button', { name: '下一页', exact: true }).click()
  await expect(region.locator('.textLayer')).toContainText('Page Two')
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('advanced')
  await region.locator('canvas').waitFor()
  const before = await region
    .locator('canvas')
    .evaluate((c) => (c instanceof HTMLCanvasElement ? c.width : 0))
  await region.getByRole('combobox', { name: '缩放', exact: true }).selectOption('1.5')
  await expect
    .poll(() =>
      region.locator('canvas').evaluate((c) => (c instanceof HTMLCanvasElement ? c.width : 0)),
    )
    .toBeGreaterThan(before)
  const dimensions = await region.locator('canvas').evaluate((c) => {
    if (!(c instanceof HTMLCanvasElement)) throw new Error('not canvas')
    return { w: c.width, h: c.height }
  })
  expect(dimensions.w).toBeLessThanOrEqual(1080)
  expect(dimensions.h).toBeLessThanOrEqual(1440)
  await region.getByRole('button', { name: '载入损坏字节', exact: true }).click()
  await expect(region.getByRole('alert')).toContainText('无法解析')
  await region.getByRole('button', { name: '恢复样例', exact: true }).click()
  await expect(region.locator('.textLayer')).toContainText('Page One')
})

// Controller extension: install before mount wrappers around actual Worker constructor/terminate
// (forward to native), and File.prototype.arrayBuffer (hold one actual selected file read).
// Mount advanced: assert real worker resource and Canvas; select held valid PDF A, then
// invalid .txt/empty/>3MiB selection, release A: current document must remain unchanged.
// Repeat reset and level switch/unmount before release: no stale document or error.
// Upload tiny valid giant/tall MediaBox fixtures: actual canvas remains <=1080x1440,
// DPR fixed1 despite deviceScaleFactor2. Check textLayer geometry also fits.
// On final outer unmount observe captured actual Worker.terminate, not only removed DOM.

test('@F07 invalid selection invalidates held file and actual workers terminate', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const nativeWorker = window.Worker
    const observations = { created: 0, terminated: 0, held: false, release: () => {} }
    Object.assign(window, { __f07: observations })
    window.Worker = class extends nativeWorker {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options)
        observations.created++
      }
      override terminate() {
        observations.terminated++
        super.terminate()
      }
    }
    const original = File.prototype.arrayBuffer
    File.prototype.arrayBuffer = async function () {
      const actual = await original.call(this)
      if (this.name === 'held.pdf') {
        observations.held = true
        await new Promise<void>((resolve) => {
          observations.release = resolve
        })
      }
      return actual
    }
  })
  await page.goto('/libraries/react-pdf?tab=demo&example=advanced')
  const region = page.getByRole('region', { name: 'react-pdf 文档预览', exact: true })
  await expect(region.locator('.textLayer')).toContainText('Page One')
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, '__f07').created as number))
    .toBeGreaterThan(0)
  const input = region.getByLabel('打开本地 PDF', { exact: false })
  await input.setInputFiles({
    name: 'held.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('bad held bytes'),
  })
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, '__f07').held as boolean))
    .toBe(true)
  await input.setInputFiles({
    name: 'invalid.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('invalid'),
  })
  await expect(region.getByTestId('react-pdf-status')).toContainText('.pdf')
  await page.evaluate(() => Reflect.get(window, '__f07').release())
  await expect(region.locator('.textLayer')).toContainText('Page One')
  await expect(region.getByTestId('react-pdf-status')).toContainText('.pdf')
  const prior = await page.evaluate(() => Reflect.get(window, '__f07').terminated as number)
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('basic')
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, '__f07').terminated as number))
    .toBeGreaterThan(prior)
})
