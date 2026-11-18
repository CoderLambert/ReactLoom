import { expect, test } from '@playwright/test'

const name = 'react-easy-crop 真实裁剪示例'
async function localPNG(page: import('@playwright/test').Page) {
  const bytes = await page.evaluate(async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 480
    const context = canvas.getContext('2d')
    if (!context) throw Error('Canvas unavailable')
    context.fillStyle = '#225588'
    context.fillRect(0, 0, 640, 480)
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(Error('PNG failed'))), 'image/png'),
    )
    return Array.from(new Uint8Array(await blob.arrayBuffer()))
  })
  return { name: 'own-fixture.png', mimeType: 'image/png', buffer: Buffer.from(bytes) }
}
test('@E14 basic geometry and business actual PNG dimensions', async ({ page }) => {
  await page.goto('/libraries/react-easy-crop?tab=demo&example=basic')
  let app = page.getByRole('region', { name, exact: true })
  await expect(app.getByTestId('crop-area')).toBeVisible()
  const first = JSON.parse(await app.getByTestId('crop-area').innerText())
  expect(first.width).toBe(first.height)
  await app.getByRole('slider').focus()
  await page.keyboard.press('End')
  await expect
    .poll(async () => JSON.parse(await app.getByTestId('crop-area').innerText()).width)
    .toBeLessThan(first.width)
  await page.goto('/libraries/react-easy-crop?tab=demo&example=business')
  app = page.getByRole('region', { name, exact: true })
  const exportButton = app.getByRole('button', { name: '裁剪并导出PNG', exact: true })
  await expect(exportButton).toBeEnabled()
  const area = JSON.parse(await app.getByTestId('crop-area').innerText())
  await exportButton.click()
  const output = app.getByRole('img', { name: '由Canvas生成的裁剪图', exact: true })
  await expect(output).toBeVisible()
  expect(
    await output.evaluate(async (element) => {
      const image = element as HTMLImageElement
      await image.decode()
      return [image.naturalWidth, image.naturalHeight]
    }),
  ).toEqual([area.width, area.height])
  expect(Math.abs(area.width / area.height - 16 / 9)).toBeLessThan(0.01)
})

test('@E14 delayed PNG cannot overwrite new geometry', async ({ page }) => {
  await page.goto('/libraries/react-easy-crop?tab=demo&example=business')
  const app = page.getByRole('region', { name, exact: true })
  await expect(app.getByRole('button', { name: '裁剪并导出PNG', exact: true })).toBeEnabled()
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.toBlob
    const probe = {
      ready: false,
      release: () => {},
      restore: () => {
        HTMLCanvasElement.prototype.toBlob = original
      },
    }
    Object.assign(window, { e14Encode: probe })
    HTMLCanvasElement.prototype.toBlob = function (callback, ...args) {
      original.call(
        this,
        (blob) => {
          probe.ready = true
          probe.release = () => callback(blob)
        },
        ...args,
      )
    }
  })
  await app.getByRole('button', { name: '裁剪并导出PNG', exact: true }).click()
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { e14Encode: { ready: boolean } }).e14Encode.ready),
    )
    .toBe(true)
  await app.getByRole('slider').focus()
  await page.keyboard.press('End')
  await page.evaluate(() => {
    const p = (window as unknown as { e14Encode: { release(): void; restore(): void } }).e14Encode
    p.restore()
    p.release()
  })
  await expect(app.getByRole('img', { name: '由Canvas生成的裁剪图', exact: true })).toHaveCount(0)
  await expect(app.getByRole('button', { name: '裁剪并导出PNG', exact: true })).toBeEnabled()
  await app.getByRole('button', { name: '裁剪并导出PNG', exact: true }).click()
  await expect(app.getByRole('img', { name: '由Canvas生成的裁剪图', exact: true })).toBeVisible()
})

test('@E14 local validation recovery and owned URL revoke', async ({ page }) => {
  await page.goto('/libraries/react-easy-crop?tab=demo&example=advanced')
  const app = page.getByRole('region', { name, exact: true })
  await expect(app.getByRole('button', { name: '裁剪并导出PNG', exact: true })).toBeEnabled()
  for (let repeat = 0; repeat < 2; repeat++) {
    await app.getByRole('button', { name: '恢复默认图片', exact: true }).click()
    await expect(app.getByRole('button', { name: '裁剪并导出PNG', exact: true })).toBeEnabled()
  }
  await app.getByRole('button', { name: '裁剪并导出PNG', exact: true }).click()
  await expect(app.getByRole('img', { name: '由Canvas生成的裁剪图', exact: true })).toBeVisible()
  await app.getByRole('button', { name: '恢复默认图片', exact: true }).click()
  const file = await localPNG(page)
  await page.evaluate(() => {
    const create = URL.createObjectURL,
      revoke = URL.revokeObjectURL
    const p = { active: new Set<string>(), created: 0, revoked: 0 }
    Object.assign(window, { e14URLs: p })
    URL.createObjectURL = function (blob) {
      const url = create.call(this, blob)
      p.active.add(url)
      p.created++
      return url
    }
    URL.revokeObjectURL = function (url) {
      if (p.active.delete(url)) p.revoked++
      return revoke.call(this, url)
    }
  })
  await app
    .getByLabel('选择本地图片', { exact: true })
    .setInputFiles({ name: 'bad.txt', mimeType: 'text/plain', buffer: Buffer.from('invalid') })
  await expect(app.getByRole('alert')).toContainText('图片检查失败')
  await expect(app.getByRole('button', { name: '裁剪并导出PNG', exact: true })).toBeEnabled()
  await page.evaluate(() => {
    const original = window.createImageBitmap
    const probe = {
      ready: false,
      release: () => {},
      restore: () => {
        window.createImageBitmap = original
      },
    }
    Object.assign(window, { e14FileCheck: probe })
    window.createImageBitmap = new Proxy(original, {
      apply(target, receiver, args) {
        return Reflect.apply(target, receiver, args).then(
          (bitmap: ImageBitmap) =>
            new Promise<ImageBitmap>((resolve) => {
              probe.ready = true
              probe.release = () => resolve(bitmap)
            }),
        )
      },
    })
  })
  await app.getByLabel('选择本地图片', { exact: true }).setInputFiles(file)
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { e14FileCheck: { ready: boolean } }).e14FileCheck.ready,
      ),
    )
    .toBe(true)
  await expect(app.getByRole('slider')).toBeDisabled()
  await page.evaluate(() => window.dispatchEvent(new Event('resize')))
  await page.evaluate(() => {
    const probe = (window as unknown as { e14FileCheck: { release(): void; restore(): void } })
      .e14FileCheck
    probe.restore()
    probe.release()
  })
  await expect(app.getByRole('button', { name: '裁剪并导出PNG', exact: true })).toBeEnabled()
  await app.getByRole('button', { name: '裁剪并导出PNG', exact: true }).click()
  await expect(app.getByRole('img', { name: '由Canvas生成的裁剪图', exact: true })).toBeVisible()
  await app.getByRole('button', { name: '恢复默认图片', exact: true }).click()
  await expect(app.getByRole('img', { name: '由Canvas生成的裁剪图', exact: true })).toHaveCount(0)
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { e14URLs: { active: Set<string> } }).e14URLs.active.size,
      ),
    )
    .toBe(0)
  await app.getByLabel('选择本地图片', { exact: true }).setInputFiles(file)
  await expect(app.getByRole('button', { name: '裁剪并导出PNG', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { e14URLs: { active: Set<string> } }).e14URLs.active.size,
      ),
    )
    .toBe(0)
})
