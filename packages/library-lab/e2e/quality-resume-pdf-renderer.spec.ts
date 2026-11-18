import { expect, type Page, test } from '@playwright/test'

type PDFProbe = { blobs: number; created: string[]; revoked: string[] }
async function install(page: Page) {
  await page.addInitScript(() => {
    const p: PDFProbe = { blobs: 0, created: [], revoked: [] }
    Object.assign(window, { pdfProbe: p })
    window.Blob = new Proxy(window.Blob, {
      construct(target, args) {
        const blob = Reflect.construct(target, args) as Blob
        if (blob.type === 'application/pdf') p.blobs++
        return blob
      },
    })
    const create = URL.createObjectURL,
      revoke = URL.revokeObjectURL
    URL.createObjectURL = (object) => {
      const url = create(object)
      if (object instanceof Blob && object.type === 'application/pdf') p.created.push(url)
      return url
    }
    URL.revokeObjectURL = (url) => {
      p.revoked.push(url)
      revoke(url)
    }
  })
}
async function state(page: Page) {
  return page.evaluate(() => (window as unknown as { pdfProbe: PDFProbe }).pdfProbe)
}
const name = 'React-PDF Renderer生成实验'
test('@F08 real renderer creates downloadable one-row, summary and multipage PDFs', async ({
  page,
}, testInfo) => {
  await install(page)
  const external: string[] = []
  page.on('request', (request) => {
    if (/^https?:/.test(request.url()) && !request.url().startsWith('http://127.0.0.1:'))
      external.push(request.url())
  })
  await page.goto('/libraries/react-pdf-renderer?tab=demo&example=basic')
  const app = page.getByRole('region', { name, exact: true })
  expect((await state(page)).blobs).toBe(0)
  for (const [level, rows] of [
    ['basic', 1],
    ['business', 3],
    ['advanced', 100],
  ] as const) {
    if (level !== 'basic')
      await page.getByRole('combobox', { name: '学习场景' }).selectOption(level)
    await app.getByRole('button', { name: '创建 PDF', exact: true }).click()
    await expect(app.locator('p[role=status]')).toContainText(`${rows} 行报表`)
    const downloadEvent = page.waitForEvent('download')
    await app.getByRole('link', { name: /下载PDF/ }).click()
    const download = await downloadEvent
    expect(await download.failure()).toBeNull()
    await download.saveAs(testInfo.outputPath(`${level}.pdf`))
  }
  expect((await state(page)).blobs).toBe(3)
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect
    .poll(async () => {
      const p = await state(page)
      return p.created.length === 3 && p.created.every((url) => p.revoked.includes(url))
    })
    .toBe(true)
  expect(external).toEqual([])
})

test('@F08 single flight, invalid rows clear old URL and late real PDF completion is ignored', async ({
  page,
}) => {
  await install(page)
  await page.goto('/libraries/react-pdf-renderer?tab=demo&example=advanced')
  const app = page.getByRole('region', { name, exact: true })
  const create = app.getByRole('button', { name: '创建 PDF', exact: true })
  // Same-turn clicks exercise the synchronous guard before React updates disabled.
  await create.evaluate((element) => {
    ;(element as HTMLButtonElement).click()
    ;(element as HTMLButtonElement).click()
  })
  await expect(app.getByRole('link', { name: /下载PDF/ })).toBeVisible()
  expect((await state(page)).blobs).toBe(1)
  const old = await app.getByRole('link', { name: /下载PDF/ }).getAttribute('href')
  await app.getByRole('button', { name: '测试141行输入拒绝', exact: true }).click()
  await expect(app.locator('p[role=status]')).toContainText('生成失败')
  await expect(app.getByRole('link', { name: /下载PDF/ })).toHaveCount(0)
  await expect.poll(async () => (await state(page)).revoked).toContain(old)
  expect((await state(page)).blobs).toBe(1)
  const before = await state(page)
  // A controlled immediate host removal, while the real SDK's async layout continues.
  await create.evaluate((element) => {
    ;(element as HTMLButtonElement).click()
    const stop = [...document.querySelectorAll('button')].find(
      (button) => button.textContent === '停止并卸载',
    )
    if (!stop) throw new Error('Missing owned host unmount action')
    stop.click()
  })
  await expect(app).toHaveCount(0)
  await expect
    .poll(async () => (await state(page)).blobs, { timeout: 15_000 })
    .toBe(before.blobs + 1)
  await page.evaluate(() => new Promise(requestAnimationFrame))
  const after = await state(page)
  expect(after.created).toEqual(before.created)
  expect(after.created.every((url) => after.revoked.includes(url))).toBe(true)
})
