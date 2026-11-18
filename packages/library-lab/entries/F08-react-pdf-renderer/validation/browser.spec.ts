import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

test('@F08 real one-page and 100-row generated PDF downloads for visual pagination inspection', async ({
  page,
}, testInfo) => {
  const external: string[] = []
  page.on('request', (request) => {
    if (
      /^https?:/.test(request.url()) &&
      !/^http:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(request.url())
    )
      external.push(request.url())
  })
  await page.goto('/libraries/react-pdf-renderer?tab=demo&example=basic')
  const app = page.getByRole('region', { name: 'React-PDF Renderer生成实验', exact: true })
  for (const level of ['basic', 'business', 'advanced']) {
    await page.getByRole('combobox', { name: '学习场景' }).selectOption(level)
    await app.getByRole('button', { name: '创建 PDF', exact: true }).click()
    await expect(app.locator('p[role=status]')).toContainText(
      level === 'basic' ? '1 行' : level === 'business' ? '3 行' : '100 行',
    )
    const pending = page.waitForEvent('download')
    await app.getByRole('link', { name: /下载PDF/ }).click()
    const file = testInfo.outputPath(`${level}-actual.pdf`)
    await (await pending).saveAs(file)
    expect((await readFile(file)).subarray(0, 5).toString()).toBe('%PDF-')
  }
  // Files must be rendered with pdftoppm by controller; signature/download alone do not prove layout.
  expect(external).toEqual([])
})

type PDFProbe = {
  created: string[]
  revoked: string[]
  blobs: Blob[]
  mode: 'normal' | 'fail-url'
}
test('@F08 actual Blob/URL observations cover replacement, policy failure and late completion after unmount', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const p: PDFProbe = { created: [], revoked: [], blobs: [], mode: 'normal' }
    Object.assign(window, { pdfProbe: p })
    const nativeBlob = window.Blob
    window.Blob = new Proxy(nativeBlob, {
      construct(target, args) {
        const blob = Reflect.construct(target, args) as Blob
        if (blob.type === 'application/pdf') {
          p.blobs.push(blob)
        }
        return blob
      },
    })
    const create = URL.createObjectURL,
      revoke = URL.revokeObjectURL
    URL.createObjectURL = (blob) => {
      if (p.mode === 'fail-url') throw Error('controlled URL creation failure')
      const url = create.call(URL, blob)
      p.created.push(url)
      return url
    }
    URL.revokeObjectURL = (url) => {
      p.revoked.push(url)
      return revoke.call(URL, url)
    }
  })
  await page.goto('/libraries/react-pdf-renderer?tab=demo&example=advanced')
  const app = page.getByRole('region', { name: 'React-PDF Renderer生成实验', exact: true })
  const generate = app.getByRole('button', { name: '创建 PDF', exact: true })
  await generate.evaluate((button) => {
    ;(button as HTMLButtonElement).click()
    ;(button as HTMLButtonElement).click()
  })
  await expect(app.getByRole('link', { name: /下载PDF/ })).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { pdfProbe: PDFProbe }).pdfProbe.blobs.length),
    )
    .toBe(1)
  const first = await app.getByRole('link', { name: /下载PDF/ }).getAttribute('href')
  await generate.click()
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { pdfProbe: PDFProbe }).pdfProbe.created.length),
    )
    .toBe(2)
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { pdfProbe: PDFProbe }).pdfProbe.revoked))
    .toContain(first)
  await app.getByRole('button', { name: '测试141行输入拒绝' }).click()
  await expect(app.locator('p[role=status]')).toContainText('Row count')
  await expect(app.getByRole('link', { name: /下载PDF/ })).toHaveCount(0)
  await generate.click()
  await expect(app.getByRole('link', { name: /下载PDF/ })).toBeVisible()
  await page.evaluate(() => {
    ;(window as unknown as { pdfProbe: PDFProbe }).pdfProbe.mode = 'fail-url'
  })
  await generate.click()
  await expect(app.locator('p[role=status]')).toContainText('URL creation failure')
  await expect(app.getByRole('link', { name: /下载PDF/ })).toHaveCount(0)
  await page.evaluate(() => {
    ;(window as unknown as { pdfProbe: PDFProbe }).pdfProbe.mode = 'normal'
  })
  await generate.evaluate((button) => {
    ;(button as HTMLButtonElement).click()
    const tab = Array.from(document.querySelectorAll<HTMLElement>('[role=tab]')).find(
      (element) => element.textContent?.trim() === '文档',
    )
    if (!tab) throw Error('Document tab absent')
    tab.click()
  })
  await expect(app).toHaveCount(0)
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { pdfProbe: PDFProbe }).pdfProbe.blobs.length),
    )
    .toBe(5)
  const state = await page.evaluate(() => {
    const p = (window as unknown as { pdfProbe: PDFProbe }).pdfProbe
    return { created: p.created, revoked: p.revoked, blobs: p.blobs.length }
  })
  expect(state.blobs).toBe(5)
  expect(state.created).toHaveLength(3)
  expect([...state.revoked].sort()).toEqual([...state.created].sort())
})
