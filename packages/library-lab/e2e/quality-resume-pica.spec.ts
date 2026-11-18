import { expect, test } from '@playwright/test'
import {
  holdImageWork,
  installImageProbe,
  pngFixture,
  readImageProbe,
  releaseImageWork,
} from './quality-image-helpers'

const name = 'pica 真实缩放示例'
test('@E15 actual pica PNG, local source, native comparison and owned URL cleanup', async ({
  page,
}) => {
  await installImageProbe(page)
  await page.goto('/libraries/pica?tab=demo&example=basic')
  const app = page.getByRole('region', { name, exact: true })
  const resize = app.getByRole('button', { name: '调用pica缩放', exact: true })
  const output = app.getByAltText('真实pica生成的缩小图像')
  await resize.click()
  await expect(app.locator('p[role=status]')).toContainText('480 × 300')
  await expect(output).toBeVisible()
  expect(
    await output.evaluate(async (image) => {
      const i = image as HTMLImageElement
      await i.decode()
      return [i.naturalWidth, i.naturalHeight]
    }),
  ).toEqual([480, 300])
  const old = await output.getAttribute('src')
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('business')
  await expect.poll(async () => (await readImageProbe(page)).revoked).toContain(old)
  await app.getByLabel('选择本地图片', { exact: true }).setInputFiles(await pngFixture(page))
  await app.getByLabel('目标最长边', { exact: true }).selectOption('240')
  await resize.click()
  await expect(app.locator('p[role=status]')).toContainText('240 × 180')
  expect(
    await output.evaluate(async (image) => {
      const i = image as HTMLImageElement
      await i.decode()
      return [i.naturalWidth, i.naturalHeight]
    }),
  ).toEqual([240, 180])
  expect((await readImageProbe(page)).closed).toBeGreaterThan(0)
  await app
    .getByLabel('选择本地图片', { exact: true })
    .setInputFiles({ name: 'bad.txt', mimeType: 'text/plain', buffer: Buffer.from('bad') })
  await expect(app.locator('p[role=status]')).toContainText('文件不符合限制')
  await expect(output).toHaveCount(0)
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('advanced')
  await resize.click()
  await expect(app.locator('p[role=status]')).toContainText('480 × 300')
  for (const alt of ['真实pica生成的缩小图像', '原生Canvas缩放对照图']) {
    expect(
      await app.getByAltText(alt).evaluate(async (image) => {
        const i = image as HTMLImageElement
        await i.decode()
        return [i.naturalWidth, i.naturalHeight]
      }),
    ).toEqual([480, 300])
  }
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect
    .poll(async () => {
      const p = await readImageProbe(page)
      return p.created.every((url) => p.revoked.includes(url))
    })
    .toBe(true)
})

test('@E15 cancellation and unmount ignore already-started real PNG encoding', async ({ page }) => {
  await installImageProbe(page)
  await page.goto('/libraries/pica?tab=demo&example=basic')
  const app = page.getByRole('region', { name, exact: true })
  const resize = app.getByRole('button', { name: '调用pica缩放', exact: true })
  await holdImageWork(page, 'holdBlob')
  await resize.click()
  await expect.poll(async () => (await readImageProbe(page)).held).toBe(1)
  await app.getByRole('button', { name: '取消本次处理', exact: true }).click()
  await expect(app.locator('p[role=status]')).toContainText('取消')
  await expect(resize).toBeDisabled()
  const before = await readImageProbe(page)
  await releaseImageWork(page)
  await expect(resize).toBeEnabled()
  expect((await readImageProbe(page)).created).toEqual(before.created)
  await expect(app.getByAltText('真实pica生成的缩小图像')).toHaveCount(0)
  await resize.click()
  await expect(app.getByAltText('真实pica生成的缩小图像')).toBeVisible()
  await holdImageWork(page, 'holdBlob')
  await resize.click()
  await expect.poll(async () => (await readImageProbe(page)).held).toBe(1)
  const pending = await readImageProbe(page)
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await releaseImageWork(page)
  // The canvas callback ran with its real Blob; no mounted consumer remains to publish it.
  await expect.poll(async () => (await readImageProbe(page)).held).toBe(0)
  const ended = await readImageProbe(page)
  expect(ended.created).toEqual(pending.created)
  expect(ended.created.every((url) => ended.revoked.includes(url))).toBe(true)
})
