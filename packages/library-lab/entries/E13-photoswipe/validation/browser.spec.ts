import { expect, test } from '@playwright/test'

type CoreProbe = { currIndex: number; on(event: string, callback: () => void): void }

test('@E13 first core load, SVG decode/dimensions, keyboard and focus', async ({ page }) => {
  const coreRequests: string[] = []
  page.on('request', (request) => {
    if (/photoswipe\.esm/.test(request.url()) && !/lightbox/.test(request.url()))
      coreRequests.push(request.url())
  })
  await page.goto('/libraries/photoswipe?tab=demo&example=basic')
  let app = page.getByRole('region', { name: 'PhotoSwipe 真正图库示例', exact: true })
  await expect(app.locator('figure')).toHaveCount(1)
  const image = app.locator('img')
  expect(
    await image.evaluate(async (element) => {
      await (element as HTMLImageElement).decode()
      return [
        (element as HTMLImageElement).naturalWidth,
        (element as HTMLImageElement).naturalHeight,
      ]
    }),
  ).toEqual([1200, 800])
  expect(coreRequests).toEqual([])
  await app.locator('a').click()
  await expect(page.locator('.pswp')).toBeVisible()
  expect(coreRequests.length).toBeGreaterThan(0)
  await page.keyboard.press('Escape')
  await expect(page.locator('.pswp')).toHaveCount(0)
  await expect(app.locator('a')).toBeFocused()
  await page.goto('/libraries/photoswipe?tab=demo&example=business')
  app = page.getByRole('region', { name: 'PhotoSwipe 真正图库示例', exact: true })
  await expect(app.locator('figure')).toHaveCount(3)
  await app.getByRole('checkbox', { name: '显示图片说明', exact: true }).uncheck()
  await expect(app.locator('figcaption')).toHaveCount(0)
  await app.getByRole('checkbox', { name: '显示图片说明', exact: true }).check()
  await expect(app.locator('figcaption')).toHaveCount(3)
  await app.locator('a').first().click()
  await expect(page.locator('.pswp')).toBeVisible()
  await page.keyboard.press('ArrowRight')
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { pswp: CoreProbe }).pswp.currIndex))
    .toBe(1)
  await page.keyboard.press('Escape')
  await expect(page.locator('.pswp')).toHaveCount(0)
  await expect(app.locator('a').first()).toBeFocused()
})

test('@E13 collection replacement and unmount emit actual core destroy', async ({ page }) => {
  await page.goto('/libraries/photoswipe?tab=demo&example=advanced')
  const app = page.getByRole('region', { name: 'PhotoSwipe 真正图库示例', exact: true })
  await app.getByRole('button', { name: '添加第四张', exact: true }).click()
  await expect(app.locator('figure')).toHaveCount(4)
  await app.locator('a').last().click()
  await expect(page.locator('.pswp')).toBeVisible()
  await page.evaluate(() => {
    const core = (window as unknown as { pswp: CoreProbe }).pswp
    if (!core?.on) throw Error('Expected actual PhotoSwipe core')
    Object.assign(window, { e13Destroyed: 0 })
    core.on('destroy', () => {
      ;(window as unknown as { e13Destroyed: number }).e13Destroyed++
    })
  })
  // Programmatic existing-button click represents external collection changes under the modal.
  await app
    .getByRole('button', { name: '移除第四张', exact: true })
    .evaluate((button) => (button as HTMLButtonElement).click())
  await expect(app.locator('figure')).toHaveCount(3)
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { e13Destroyed: number }).e13Destroyed))
    .toBe(1)
  await expect(page.locator('.pswp')).toHaveCount(0)
  await app.locator('a').first().click()
  await expect(page.locator('.pswp')).toBeVisible()
  await page.evaluate(() => {
    const core = (window as unknown as { pswp: CoreProbe }).pswp
    core.on('destroy', () => {
      ;(window as unknown as { e13Destroyed: number }).e13Destroyed++
    })
  })
  await page
    .getByRole('button', { name: '停止并卸载', exact: true })
    .evaluate((button) => (button as HTMLButtonElement).click())
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { e13Destroyed: number }).e13Destroyed))
    .toBe(2)
  await expect(page.locator('.pswp')).toHaveCount(0)
})
