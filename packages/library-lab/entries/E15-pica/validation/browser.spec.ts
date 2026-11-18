import { expect, test } from '@playwright/test'

type URLs = { created: string[]; revoked: string[]; active: Set<string> }
async function watchURLs(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const create = URL.createObjectURL,
      revoke = URL.revokeObjectURL
    const p: URLs = { created: [], revoked: [], active: new Set() }
    Object.assign(window, { e15URLs: p })
    URL.createObjectURL = (object: Blob | MediaSource) => {
      const url = create.call(URL, object)
      if (object instanceof Blob && object.type === 'image/png') {
        p.created.push(url)
        p.active.add(url)
      }
      return url
    }
    URL.revokeObjectURL = (url: string) => {
      if (p.active.delete(url)) p.revoked.push(url)
      return revoke.call(URL, url)
    }
  })
}
test('E15 actual resize/toBlob dimensions, local file no upscale and decode failure @E15', async ({
  page,
}) => {
  await page.goto('/libraries/pica?tab=demo&example=basic')
  let app = page.getByRole('region', { name: 'pica 真实缩放示例' })
  await expect(app.getByRole('img', { name: '真实pica生成的缩小图像' })).toHaveCount(0)
  await app.getByRole('button', { name: '调用pica缩放', exact: true }).click()
  let image = app.getByRole('img', { name: '真实pica生成的缩小图像' })
  await expect(image).toHaveJSProperty('naturalWidth', 480)
  await expect(image).toHaveJSProperty('naturalHeight', 300)
  await expect(app.getByRole('status')).toContainText('缩放完成')
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('business')
  app = page.getByRole('region', { name: 'pica 真实缩放示例' })
  const encoded = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 160
    const ctx = canvas.getContext('2d')
    if (!ctx) throw Error('Canvas')
    ctx.fillStyle = '#c02844'
    ctx.fillRect(0, 0, 320, 160)
    return canvas.toDataURL('image/png').split(',')[1]
  })
  await app.getByLabel('选择本地图片').setInputFiles({
    name: 'public-fixture.png',
    mimeType: 'image/png',
    buffer: Buffer.from(encoded, 'base64'),
  })
  await app.getByRole('button', { name: '调用pica缩放', exact: true }).click()
  image = app.getByRole('img', { name: '真实pica生成的缩小图像' })
  await expect(image).toHaveJSProperty('naturalWidth', 320)
  await expect(image).toHaveJSProperty('naturalHeight', 160)
  await app.getByLabel('选择本地图片').setInputFiles({
    name: 'broken.png',
    mimeType: 'image/png',
    buffer: Buffer.from('not an image'),
  })
  await app.getByRole('button', { name: '调用pica缩放', exact: true }).click()
  await expect(app.getByRole('status')).toContainText('失败或取消')
  await expect(image).toHaveCount(0)
})
test('E15 native comparison and owned PNG Blob URLs are revoked on replace/unmount @E15', async ({
  page,
}) => {
  await watchURLs(page)
  await page.goto('/libraries/pica?tab=demo&example=advanced')
  const app = page.getByRole('region', { name: 'pica 真实缩放示例' })
  await app.getByRole('button', { name: '调用pica缩放', exact: true }).click()
  for (const name of ['真实pica生成的缩小图像', '原生Canvas缩放对照图']) {
    const image = app.getByRole('img', { name })
    await expect(image).toHaveJSProperty('naturalWidth', 480)
    await expect(image).toHaveJSProperty('naturalHeight', 300)
  }
  await expect(app.locator('figcaption').last()).toContainText('文件体积不是视觉质量指标')
  const original = await page.evaluate(() => [
    ...(window as Window & { e15URLs: URLs }).e15URLs.active,
  ])
  expect(original).toHaveLength(2)
  await app.getByLabel('目标最长边').selectOption('240')
  await expect
    .poll(() => page.evaluate(() => (window as Window & { e15URLs: URLs }).e15URLs.active.size))
    .toBe(0)
  expect(await page.evaluate(() => (window as Window & { e15URLs: URLs }).e15URLs.revoked)).toEqual(
    expect.arrayContaining(original),
  )
  await app.getByRole('button', { name: '调用pica缩放', exact: true }).click()
  await expect(app.getByRole('img', { name: '真实pica生成的缩小图像' })).toHaveJSProperty(
    'naturalWidth',
    240,
  )
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect
    .poll(() => page.evaluate(() => (window as Window & { e15URLs: URLs }).e15URLs.active.size))
    .toBe(0)
})
type Encode = { waiting: Array<() => void>; enqueued: number; released: number }
test('E15 already-started real encoding cannot be aborted but stale result never publishes @E15', async ({
  page,
}) => {
  await watchURLs(page)
  await page.goto('/libraries/pica?tab=demo&example=advanced')
  const app = page.getByRole('region', { name: 'pica 真实缩放示例' })
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.toBlob
    const p: Encode = { waiting: [], enqueued: 0, released: 0 }
    Object.assign(window, { e15Encode: p })
    HTMLCanvasElement.prototype.toBlob = function (callback, mime, quality) {
      return original.call(
        this,
        (blob) => {
          if (this.width === 480 && this.height === 300) {
            p.enqueued++
            p.waiting.push(() => {
              p.released++
              callback(blob)
            })
          } else callback(blob)
        },
        mime,
        quality,
      )
    }
  })
  await app.getByRole('button', { name: '调用pica缩放', exact: true }).click()
  await expect
    .poll(() =>
      page.evaluate(() => (window as Window & { e15Encode: Encode }).e15Encode.waiting.length),
    )
    .toBe(1)
  await app.getByRole('button', { name: '取消本次处理', exact: true }).click()
  await expect(app.getByRole('button', { name: '调用pica缩放', exact: true })).toBeDisabled()
  await page.evaluate(() => {
    for (const release of (window as Window & { e15Encode: Encode }).e15Encode.waiting.splice(0))
      release()
  })
  await expect(app.getByRole('button', { name: '调用pica缩放', exact: true })).toBeEnabled()
  await expect(app.locator('figure')).toHaveCount(0)
  expect(await page.evaluate(() => (window as Window & { e15URLs: URLs }).e15URLs.created)).toEqual(
    [],
  )
  await app.getByLabel('目标最长边').selectOption('240')
  await app.getByRole('button', { name: '调用pica缩放', exact: true }).click()
  await expect(app.getByRole('img', { name: '真实pica生成的缩小图像' })).toHaveJSProperty(
    'naturalWidth',
    240,
  )
  await app.getByLabel('目标最长边').selectOption('480')
  await app.getByRole('button', { name: '调用pica缩放', exact: true }).click()
  await expect
    .poll(() =>
      page.evaluate(() => (window as Window & { e15Encode: Encode }).e15Encode.waiting.length),
    )
    .toBe(1)
  const created = await page.evaluate(
    () => (window as Window & { e15URLs: URLs }).e15URLs.created.length,
  )
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await page.evaluate(() => {
    for (const release of (window as Window & { e15Encode: Encode }).e15Encode.waiting.splice(0))
      release()
  })
  await expect
    .poll(() => page.evaluate(() => (window as Window & { e15Encode: Encode }).e15Encode.released))
    .toBe(2)
  await page.waitForTimeout(100) // Bounded window for already-started encoder settlement after unmount.
  expect(
    await page.evaluate(() => (window as Window & { e15URLs: URLs }).e15URLs.created.length),
  ).toBe(created)
  expect(
    await page.evaluate(() => (window as Window & { e15URLs: URLs }).e15URLs.active.size),
  ).toBe(0)
  // Holds only native encoder callbacks after actual pica.resize. This does not prove Worker termination or resize cancelToken timing.
})
