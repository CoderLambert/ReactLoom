import { expect, test } from '@playwright/test'
import {
  holdImageWork,
  installImageProbe,
  pngFixture,
  readImageProbe,
  releaseImageWork,
} from './quality-image-helpers'

const name = 'react-easy-crop 真实裁剪示例'
test('@E14 real crop coordinates, PNG dimensions, zoom and aspect switch', async ({ page }) => {
  await installImageProbe(page)
  await page.goto('/libraries/react-easy-crop?tab=demo&example=basic')
  const app = page.getByRole('region', { name, exact: true })
  const exportButton = app.getByRole('button', { name: '裁剪并导出PNG', exact: true })
  const area = app.getByTestId('crop-area')
  await expect(area).toBeVisible()
  const square = JSON.parse((await area.textContent()) ?? '{}')
  expect(square.width).toBe(square.height)
  await app.getByRole('slider', { name: /缩放/ }).fill('2')
  await expect
    .poll(async () => JSON.parse((await area.textContent()) ?? '{}').width)
    .toBeLessThan(square.width)
  await expect(exportButton).toHaveCount(0)
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('business')
  await expect(exportButton).toBeEnabled()
  await exportButton.click()
  const result = app.getByAltText('由Canvas生成的裁剪图')
  await expect(result).toBeVisible()
  const wide = await result.evaluate(async (image) => {
    const i = image as HTMLImageElement
    await i.decode()
    return [i.naturalWidth, i.naturalHeight]
  })
  expect(wide[0] / wide[1]).toBeCloseTo(16 / 9, 2)
  const previous = await result.getAttribute('src')
  await app.getByRole('slider', { name: /缩放/ }).fill('2')
  await expect(result).toHaveCount(0)
  await expect.poll(async () => (await readImageProbe(page)).revoked).toContain(previous)
  await exportButton.click()
  await expect(result).toBeVisible()
  expect(await result.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeLessThan(
    wide[0],
  )
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect
    .poll(async () => {
      const p = await readImageProbe(page)
      return p.created.every((url) => p.revoked.includes(url))
    })
    .toBe(true)
})

test('@E14 held real file decode recovers controls, rejects invalid file, closes after unmount', async ({
  page,
}) => {
  await installImageProbe(page)
  await page.goto('/libraries/react-easy-crop?tab=demo&example=advanced')
  const app = page.getByRole('region', { name, exact: true })
  const reset = app.getByRole('button', { name: '恢复默认图片', exact: true })
  await expect(app.getByTestId('crop-area')).toBeVisible()
  await reset.click()
  await reset.click()
  await expect(app.getByRole('button', { name: '裁剪并导出PNG', exact: true })).toBeEnabled()
  const originalArea = JSON.parse((await app.getByTestId('crop-area').textContent()) ?? '{}')
  const surface = app.locator('.reactEasyCrop_Container')
  const box = await surface.boundingBox()
  if (!box) throw new Error('Crop surface not measurable')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 - 50, box.y + box.height / 2, { steps: 5 })
  await page.mouse.up()
  await expect
    .poll(async () => JSON.parse((await app.getByTestId('crop-area').textContent()) ?? '{}').x)
    .not.toBe(originalArea.x)
  await reset.click()
  await expect(app.getByRole('button', { name: '裁剪并导出PNG', exact: true })).toBeEnabled()
  await expect
    .poll(async () => JSON.parse((await app.getByTestId('crop-area').textContent()) ?? '{}'))
    .toEqual(originalArea)
  const file = await pngFixture(page)
  await holdImageWork(page, 'holdBitmap')
  await app.getByLabel('选择本地图片', { exact: true }).setInputFiles(file)
  await expect.poll(async () => (await readImageProbe(page)).held).toBe(1)
  await expect(app.getByRole('slider', { name: /缩放/ })).toBeDisabled()
  await expect(app.getByRole('button', { name: '检查图片…', exact: true })).toBeDisabled()
  await expect(app.locator('.reactEasyCrop_Container').locator('..')).toHaveCSS(
    'pointer-events',
    'none',
  )
  await releaseImageWork(page)
  const exportButton = app.getByRole('button', { name: '裁剪并导出PNG', exact: true })
  await expect(exportButton).toBeEnabled()
  await expect.poll(async () => (await readImageProbe(page)).closed).toBe(1)
  await exportButton.click()
  await expect(app.getByAltText('由Canvas生成的裁剪图')).toBeVisible()
  await app
    .getByLabel('选择本地图片', { exact: true })
    .setInputFiles({ name: 'wrong.txt', mimeType: 'text/plain', buffer: Buffer.from('rejected') })
  await expect(app.getByRole('alert')).toContainText('图片检查失败')
  await expect(app.getByAltText('由Canvas生成的裁剪图')).toHaveCount(0)
  await holdImageWork(page, 'holdBitmap')
  await app.getByLabel('选择本地图片', { exact: true }).setInputFiles(file)
  await expect.poll(async () => (await readImageProbe(page)).held).toBe(1)
  const before = await readImageProbe(page)
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await releaseImageWork(page)
  await expect.poll(async () => (await readImageProbe(page)).closed).toBe(before.closed + 1)
  const after = await readImageProbe(page)
  expect(after.created).toEqual(before.created)
  expect(after.created.every((url) => after.revoked.includes(url))).toBe(true)
})
