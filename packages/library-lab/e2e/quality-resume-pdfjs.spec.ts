import { expect, test } from '@playwright/test'
import {
  holdFileReads,
  installFileReads,
  readFileProbe,
  releaseFileReads,
} from './quality-file-read-probe'
import { installPdfWorkers, originalPdf, pdfWorkerState } from './quality-pdf-helpers'

const name = 'PDF.js 真实页面渲染'
test('@F06 real worker canvas, text, serialized zoom, corrupt preservation and pixel budget', async ({
  page,
}) => {
  await installPdfWorkers(page)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/libraries/pdfjs?tab=demo&example=basic')
  const app = page.getByRole('region', { name, exact: true })
  const canvas = app.locator('canvas')
  await expect(app.locator('p[role=status]')).toContainText('第 1 / 2 页渲染成功')
  expect(
    await canvas.evaluate((node) => {
      const c = node as HTMLCanvasElement
      const p = c.getContext('2d')?.getImageData(0, 0, c.width, Math.min(c.height, 300)).data
      return !!p?.some((v, i) => i % 4 === 0 && v < 200 && p[i + 3] > 0)
    }),
  ).toBe(true)
  expect((await pdfWorkerState(page)).actions).toContain('GetDoc')
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('business')
  await expect(app.getByTestId('pdf-text')).toContainText('Page One: basic render')
  await app.getByRole('button', { name: '下一页', exact: true }).click()
  await expect(app.getByTestId('pdf-text')).toContainText('Page Two: search and extract')
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('advanced')
  await expect(app.getByTestId('pdf-text')).toContainText('Page One: basic render')
  for (const scale of ['2', '0.8', '1.5', '1']) await app.getByLabel('缩放').selectOption(scale)
  await expect(app.locator('p[role=status]')).toContainText('第 1 / 2 页渲染成功')
  await app.getByRole('button', { name: '验证损坏文档不覆盖当前页' }).click()
  await expect(app.locator('p[role=status]')).toContainText('已正确捕获损坏 PDF')
  await expect(app.getByTestId('pdf-text')).toContainText('Page One: basic render')
  const input = app.locator('input[type=file]')
  await input.setInputFiles(originalPdf('Independent PDF input'))
  await expect(app.getByTestId('pdf-text')).toContainText('Independent PDF input')
  await expect(app.locator('p[role=status]')).toContainText('第 1 / 1 页渲染成功')
  await input.setInputFiles({
    name: 'broken.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('not PDF'),
  })
  await expect(app.locator('p[role=status]')).toContainText('PDF 文档解析失败，保留当前文档')
  await expect(app.getByTestId('pdf-text')).toContainText('Independent PDF input')
  await input.setInputFiles(originalPdf('Huge media box', 5000, 3000))
  await expect(app.locator('p[role=status]')).toContainText('PDF 渲染失败')
  await expect
    .poll(() =>
      canvas.evaluate((node) => [
        (node as HTMLCanvasElement).width,
        (node as HTMLCanvasElement).height,
      ]),
    )
    .toEqual([0, 0])
  await expect(app.getByTestId('pdf-text')).not.toContainText('Independent PDF input')
  await input.setInputFiles(originalPdf('Recovered PDF'))
  await expect(app.getByTestId('pdf-text')).toContainText('Recovered PDF')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect
    .poll(async () => {
      const p = await pdfWorkerState(page)
      return p.created.length > 0 && p.terminated.length === p.created.length
    })
    .toBe(true)
  expect(errors).toEqual([])
})

test('@F06 invalid newer input, level switch and unmount invalidate actual held file reads', async ({
  page,
}) => {
  await installPdfWorkers(page)
  await installFileReads(page, 'arrayBuffer')
  await page.goto('/libraries/pdfjs?tab=demo&example=advanced')
  const app = page.getByRole('region', { name, exact: true })
  const input = app.locator('input[type=file]')
  await expect(app.getByTestId('pdf-text')).toContainText('Page One: basic render')
  await holdFileReads(page)
  await input.setInputFiles(originalPdf('Discarded file'))
  await expect.poll(async () => (await readFileProbe(page)).pending).toBe(1)
  await input.setInputFiles({
    name: 'invalid.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('invalid'),
  })
  await expect(app.locator('p[role=status]')).toContainText('只接受 PDF 文件名')
  await releaseFileReads(page)
  await expect(app.getByTestId('pdf-text')).toContainText('Page One: basic render')
  await holdFileReads(page)
  await input.setInputFiles(originalPdf('Previous level'))
  await expect.poll(async () => (await readFileProbe(page)).pending).toBe(1)
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('business')
  await releaseFileReads(page)
  await expect(app.getByTestId('pdf-text')).toContainText('Page One: basic render')
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('advanced')
  await expect(app.getByTestId('pdf-text')).toContainText('Page One: basic render')
  await holdFileReads(page)
  await input.setInputFiles(originalPdf('After unmount'))
  await expect.poll(async () => (await readFileProbe(page)).pending).toBe(1)
  const before = await pdfWorkerState(page),
    read = await readFileProbe(page)
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await releaseFileReads(page)
  expect((await readFileProbe(page)).returned).toBe(read.returned + 1)
  expect((await pdfWorkerState(page)).created).toEqual(before.created)
  await expect
    .poll(async () => {
      const p = await pdfWorkerState(page)
      return p.terminated.length === p.created.length
    })
    .toBe(true)
})
