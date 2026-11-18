import { expect, test } from '@playwright/test'
import {
  holdFileReads,
  installFileReads,
  readFileProbe,
  releaseFileReads,
} from './quality-file-read-probe'
import { installPdfWorkers, originalPdf, pdfWorkerState } from './quality-pdf-helpers'

const name = 'react-pdf 文档预览'
test('@F07 real worker/canvas, text layer, paging, bounded geometry and corrupt recovery', async ({
  page,
}) => {
  await installPdfWorkers(page)
  await page.goto('/libraries/react-pdf?tab=demo&example=basic')
  const app = page.getByRole('region', { name, exact: true })
  const canvas = app.locator('canvas')
  await expect(app.getByTestId('react-pdf-status')).toContainText('解析成功，共2页')
  await expect(canvas).toBeVisible()
  await expect
    .poll(async () =>
      canvas.evaluate((node) => {
        const c = node as HTMLCanvasElement
        const pixels = c
          .getContext('2d')
          ?.getImageData(0, 0, Math.min(400, c.width), Math.min(300, c.height)).data
        return !!pixels?.some(
          (value, index) => index % 4 === 0 && value < 200 && pixels[index + 3] > 0,
        )
      }),
    )
    .toBe(true)
  await expect(app.locator('.react-pdf__Page__textContent')).toHaveCount(0)
  const workers = await pdfWorkerState(page)
  expect(workers.created.length).toBeGreaterThan(0)
  expect(workers.created.every((url) => url.includes('pdf.worker'))).toBe(true)
  expect(workers.actions).toContain('GetDoc')
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('business')
  await expect(app.locator('.react-pdf__Page__textContent')).toContainText('ReactLoom React PDF')
  await app.getByRole('button', { name: '下一页', exact: true }).click()
  await expect(app.locator('.react-pdf__Page__textContent')).toContainText('Page Two: evidence')
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('advanced')
  await expect(app.locator('.react-pdf__Page__textContent')).toContainText('Page One: demo')
  await app.getByRole('combobox', { name: '缩放', exact: true }).selectOption('1.5')
  await expect(app.locator('output')).toContainText('DPR 1')
  await expect.poll(() => canvas.evaluate((node) => (node as HTMLCanvasElement).width)).toBe(1080)
  await app.locator('input[type=file]').setInputFiles(originalPdf('Owned huge page', 5000, 3000))
  await expect(app.getByTestId('react-pdf-status')).toContainText('解析成功，共1页')
  await expect(canvas).toBeVisible()
  await expect
    .poll(() =>
      canvas.evaluate((node) => {
        const c = node as HTMLCanvasElement
        return c.width >= 719 && c.width <= 720 && c.height >= 431 && c.height <= 432
      }),
    )
    .toBe(true)
  await app.getByRole('combobox', { name: '缩放', exact: true }).selectOption('1.5')
  await expect
    .poll(() =>
      canvas.evaluate((node) => {
        const c = node as HTMLCanvasElement
        return c.width >= 1079 && c.width <= 1080 && c.height >= 647 && c.height <= 648
      }),
    )
    .toBe(true)
  await app.getByRole('button', { name: '载入损坏字节', exact: true }).click()
  await expect(app.getByRole('alert')).toContainText('无法解析')
  await expect(canvas).toHaveCount(0)
  await app.getByRole('button', { name: '恢复样例', exact: true }).click()
  await expect(app.getByTestId('react-pdf-status')).toContainText('解析成功，共2页')
  await expect(app.locator('.react-pdf__Page__textContent')).toContainText('Page One: demo')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect
    .poll(async () => {
      const p = await pdfWorkerState(page)
      return p.created.length > 0 && p.terminated.length === p.created.length
    })
    .toBe(true)
})

test('@F07 invalid newest selection, level reset and unmount discard held file buffers', async ({
  page,
}) => {
  await installPdfWorkers(page)
  await installFileReads(page, 'arrayBuffer')
  await page.goto('/libraries/react-pdf?tab=demo&example=advanced')
  const app = page.getByRole('region', { name, exact: true })
  const input = app.locator('input[type=file]')
  await expect(app.locator('.react-pdf__Page__textContent')).toContainText('Page One: demo')
  await holdFileReads(page)
  await input.setInputFiles(originalPdf('Late rejected selection'))
  await expect.poll(async () => (await readFileProbe(page)).pending).toBe(1)
  await input.setInputFiles({
    name: 'invalid.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('invalid selection'),
  })
  await expect(app.getByTestId('react-pdf-status')).toContainText('.pdf 文件名')
  await releaseFileReads(page)
  await expect(app.locator('.react-pdf__Page__textContent')).toContainText('Page One: demo')
  await expect(app.locator('.react-pdf__Page__textContent')).not.toContainText(
    'Late rejected selection',
  )
  await holdFileReads(page)
  await input.setInputFiles(originalPdf('Previous level'))
  await expect.poll(async () => (await readFileProbe(page)).pending).toBe(1)
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('business')
  await releaseFileReads(page)
  await expect(app.locator('.react-pdf__Page__textContent')).toContainText('Page One: demo')
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('advanced')
  await expect(app.getByTestId('react-pdf-status')).toContainText('解析成功，共2页')
  await holdFileReads(page)
  await input.setInputFiles(originalPdf('After unmount'))
  await expect.poll(async () => (await readFileProbe(page)).pending).toBe(1)
  const pending = await readFileProbe(page),
    before = await pdfWorkerState(page)
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await releaseFileReads(page)
  expect((await readFileProbe(page)).returned).toBe(pending.returned + 1)
  expect((await pdfWorkerState(page)).created).toEqual(before.created)
  await expect
    .poll(async () => {
      const p = await pdfWorkerState(page)
      return p.terminated.length === p.created.length
    })
    .toBe(true)
})
