import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

test('@F09 actual create merge and local stamp downloads with error recovery', async ({
  page,
}, testInfo) => {
  const external: string[] = []
  page.on('request', (r) => {
    if (/^https?:/.test(r.url()) && !/^http:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(r.url()))
      external.push(r.url())
  })
  await page.goto('/libraries/pdf-lib?tab=demo&example=basic')
  const app = page.getByRole('region', { name: 'pdf-lib 本地PDF实验', exact: true })
  let original = Buffer.alloc(0)
  for (const level of ['basic', 'business', 'advanced']) {
    await page.getByRole('combobox', { name: '学习场景' }).selectOption(level)
    await app.getByRole('button', { name: '执行PDF操作', exact: true }).click()
    await expect(app.locator('p[role=status]')).toContainText(
      level === 'business' ? '真实PDF页数 2' : '真实PDF页数 1',
    )
    const pending = page.waitForEvent('download')
    await app.getByRole('link', { name: '下载刚刚生成的PDF' }).click()
    const file = testInfo.outputPath(`${level}-actual.pdf`)
    await (await pending).saveAs(file)
    const bytes = await readFile(file)
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-')
    if (level === 'basic') original = bytes
  }
  const input = app.locator('input[type=file]')
  await input.setInputFiles({
    name: 'own-original.pdf',
    mimeType: 'application/pdf',
    buffer: original,
  })
  await expect(app.locator('p[role=status]')).toContainText('真实PDF页数 1')
  await input.setInputFiles({
    name: 'corrupt.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('not a valid PDF'),
  })
  await expect(app.locator('p[role=status]')).toContainText('失败')
  await expect(app.getByRole('link')).toHaveCount(0)
  await input.setInputFiles({
    name: 'oversize.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
  })
  await expect(app.locator('p[role=status]')).toContainText('2MiB')
  await app.getByRole('button', { name: '执行PDF操作', exact: true }).click()
  await expect(app.getByRole('link')).toBeVisible()
  expect(external).toEqual([])
  // Controller renders saved actual PDFs with pdftoppm; header/page text alone do not prove layout.
})

type Probe = { created: string[]; revoked: string[]; hold: boolean; pending: (() => void)[] }
test('@F09 real URL replacement single flight and late local read unmount cleanup', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const p: Probe = { created: [], revoked: [], hold: false, pending: [] }
    Object.assign(window, { pdfLibProbe: p })
    const create = URL.createObjectURL,
      revoke = URL.revokeObjectURL,
      read = Blob.prototype.arrayBuffer
    URL.createObjectURL = (blob) => {
      const url = create.call(URL, blob)
      p.created.push(url)
      return url
    }
    URL.revokeObjectURL = (url) => {
      p.revoked.push(url)
      return revoke.call(URL, url)
    }
    Blob.prototype.arrayBuffer = async function () {
      const bytes = await read.call(this)
      if (p.hold) await new Promise<void>((resolve) => p.pending.push(resolve))
      return bytes
    }
  })
  await page.goto('/libraries/pdf-lib?tab=demo&example=advanced')
  const app = page.getByRole('region', { name: 'pdf-lib 本地PDF实验', exact: true })
  const run = app.getByRole('button', { name: '执行PDF操作', exact: true })
  await run.evaluate((button) => {
    ;(button as HTMLButtonElement).click()
    ;(button as HTMLButtonElement).click()
  })
  await expect(app.getByRole('link')).toBeVisible()
  expect(
    await page.evaluate(
      () => (window as unknown as { pdfLibProbe: Probe }).pdfLibProbe.created.length,
    ),
  ).toBe(1)
  await run.click()
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { pdfLibProbe: Probe }).pdfLibProbe.created.length),
    )
    .toBe(2)
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { pdfLibProbe: Probe }).pdfLibProbe.revoked.length),
    )
    .toBe(1)
  await page.evaluate(() => {
    ;(window as unknown as { pdfLibProbe: Probe }).pdfLibProbe.hold = true
  })
  await app.locator('input[type=file]').setInputFiles({
    name: 'held.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 deliberately invalid after read'),
  })
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { pdfLibProbe: Probe }).pdfLibProbe.pending.length),
    )
    .toBe(1)
  await page.getByRole('tab', { name: '详细文档', exact: true }).click()
  await page.evaluate(() => {
    const p = (window as unknown as { pdfLibProbe: Probe }).pdfLibProbe
    p.pending.splice(0).forEach((done) => {
      done()
    })
  })
  await expect(app).toHaveCount(0)
  const state = await page.evaluate(() => {
    const p = (window as unknown as { pdfLibProbe: Probe }).pdfLibProbe
    return { created: p.created, revoked: p.revoked }
  })
  expect(state.created).toHaveLength(2)
  expect([...state.created].sort()).toEqual([...state.revoked].sort())
})
