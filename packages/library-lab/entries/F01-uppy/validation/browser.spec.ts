import { Buffer } from 'node:buffer'
import { expect, test } from '@playwright/test'

const name = 'Uppy 真实文件队列'
const textFile = (name: string, text: string) => ({
  name,
  mimeType: 'text/plain',
  buffer: Buffer.from(text),
})
test('@F01 real Uppy add/remove/restrictions and DataTransfer drop stay local', async ({
  page,
}) => {
  const external: string[] = []
  page.on('request', (r) => {
    if (/^https?:/.test(r.url()) && !r.url().startsWith('http://127.0.0.1:')) external.push(r.url())
  })
  await page.goto('/libraries/uppy?tab=demo&example=basic')
  const app = page.getByRole('region', { name, exact: true })
  const input = app.locator('input[type=file]')
  const rows = app.getByRole('list', { name: '当前队列', exact: true }).getByRole('listitem')
  // Uppy identity includes lastModified: repeat the same actual File, not two timestamped copies.
  const duplicateDrop = await page.evaluateHandle(() => {
    const transfer = new DataTransfer()
    transfer.items.add(
      new File(['original alpha'], 'a.txt', { type: 'text/plain', lastModified: 123 }),
    )
    return transfer
  })
  const dropZone = app.getByRole('group', { name: '拖拽文件加入本地队列', exact: true })
  await dropZone.dispatchEvent('drop', { dataTransfer: duplicateDrop })
  await expect(rows).toHaveCount(1)
  await dropZone.dispatchEvent('drop', { dataTransfer: duplicateDrop })
  await expect(rows).toHaveCount(1)
  await duplicateDrop.dispose()
  await input.setInputFiles(textFile('b.txt', 'beta'))
  await input.setInputFiles(textFile('c.txt', 'gamma'))
  await expect(rows).toHaveCount(3)
  await input.setInputFiles(textFile('d.txt', 'fourth'))
  await expect(rows).toHaveCount(3)
  await expect(app.locator('p[role=status]')).toContainText(/拒绝|失败|超|限制/)
  await rows.filter({ hasText: 'b.txt' }).getByRole('button', { name: '移除', exact: true }).click()
  await expect(rows).toHaveCount(2)
  await input.setInputFiles({
    name: 'bad.exe',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from('rejected'),
  })
  await expect(rows).toHaveCount(2)
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('business')
  await expect(rows).toHaveCount(0)
  const drop = await page.evaluateHandle(() => {
    const transfer = new DataTransfer()
    transfer.items.add(
      new File(['<img src=x onerror=alert(1)>\nlocal CSV text'], 'drop.csv', { type: 'text/csv' }),
    )
    return transfer
  })
  await app
    .getByRole('group', { name: '拖拽文件加入本地队列', exact: true })
    .dispatchEvent('drop', { dataTransfer: drop })
  await drop.dispose()
  await expect(rows).toHaveCount(1)
  await rows.first().getByRole('button', { name: '本地查看文本', exact: true }).click()
  await expect(app.getByTestId('uppy-preview')).toContainText('<img src=x onerror=alert(1)>')
  await expect(app.getByTestId('uppy-preview').locator('img')).toHaveCount(0)
  await app.getByRole('button', { name: '清空当前队列', exact: true }).click()
  await expect(rows).toHaveCount(0)
  await expect(app.getByTestId('uppy-preview')).not.toContainText('local CSV text')
  expect(external).toEqual([])
})

type PreviewProbe = { held: (() => void)[]; started: number; returned: number; hold: boolean }
test('@F01 bounded preview rejects bytes/UTF8/control input and ignores late reads', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const p: PreviewProbe = { held: [], started: 0, returned: 0, hold: false }
    Object.assign(window, { previewProbe: p })
    const read = Blob.prototype.arrayBuffer
    Blob.prototype.arrayBuffer = async function () {
      p.started++
      const result = await read.call(this)
      if (p.hold) await new Promise<void>((resolve) => p.held.push(resolve))
      p.returned++
      return result
    }
  })
  await page.goto('/libraries/uppy?tab=demo&example=advanced')
  const app = page.getByRole('region', { name, exact: true })
  const rows = app.getByRole('list', { name: '当前队列', exact: true }).getByRole('listitem')
  const input = app.locator('input[type=file]'),
    preview = app.getByTestId('uppy-preview')
  const clear = app.getByRole('button', { name: '清空当前队列', exact: true })
  await app.getByRole('button', { name: '演示超大文件拒绝', exact: true }).click()
  await expect(rows).toHaveCount(0)
  await input.setInputFiles(textFile('budget.txt', 'x'.repeat(12001)))
  const before = await page.evaluate(
    () => (window as unknown as { previewProbe: PreviewProbe }).previewProbe.started,
  )
  await rows.first().getByRole('button', { name: '本地查看文本', exact: true }).click()
  await expect(app.locator('p[role=status]')).toContainText('预览失败')
  expect(
    await page.evaluate(
      () => (window as unknown as { previewProbe: PreviewProbe }).previewProbe.started,
    ),
  ).toBe(before)
  await clear.click()
  for (const file of [
    textFile('control.txt', 'bad\u0000text'),
    { name: 'encoding.txt', mimeType: 'text/plain', buffer: Buffer.from([0xff, 0xfe, 0xff]) },
  ]) {
    await input.setInputFiles(file)
    await rows.first().getByRole('button', { name: '本地查看文本', exact: true }).click()
    await expect(app.locator('p[role=status]')).toContainText('预览失败')
    await clear.click()
  }
  await input.setInputFiles(textFile('bounded.txt', 'x'.repeat(8000)))
  await rows.first().getByRole('button', { name: '本地查看文本', exact: true }).click()
  await expect(preview).toHaveText('x'.repeat(4000))
  await clear.click()
  await input.setInputFiles(textFile('late.txt', 'must never overwrite current preview'))
  await page.evaluate(() => {
    ;(window as unknown as { previewProbe: PreviewProbe }).previewProbe.hold = true
  })
  await rows.first().getByRole('button', { name: '本地查看文本', exact: true }).click()
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { previewProbe: PreviewProbe }).previewProbe.held.length,
      ),
    )
    .toBe(1)
  await rows.first().getByRole('button', { name: '移除', exact: true }).click()
  await page.evaluate(() => {
    ;(window as unknown as { previewProbe: PreviewProbe }).previewProbe.hold = false
  })
  await input.setInputFiles(textFile('fresh.txt', 'new current preview'))
  await rows.first().getByRole('button', { name: '本地查看文本', exact: true }).click()
  await expect(preview).toHaveText('new current preview')
  await page.evaluate(() => {
    for (const resume of (
      window as unknown as { previewProbe: PreviewProbe }
    ).previewProbe.held.splice(0))
      resume()
  })
  await page.evaluate(() => new Promise(requestAnimationFrame))
  await expect(preview).toHaveText('new current preview')
  await page.evaluate(() => {
    ;(window as unknown as { previewProbe: PreviewProbe }).previewProbe.hold = true
  })
  await rows.first().getByRole('button', { name: '本地查看文本', exact: true }).click()
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { previewProbe: PreviewProbe }).previewProbe.held.length,
      ),
    )
    .toBe(1)
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  const returned = await page.evaluate(
    () => (window as unknown as { previewProbe: PreviewProbe }).previewProbe.returned,
  )
  await page.evaluate(() => {
    for (const resume of (
      window as unknown as { previewProbe: PreviewProbe }
    ).previewProbe.held.splice(0))
      resume()
  })
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { previewProbe: PreviewProbe }).previewProbe.returned,
      ),
    )
    .toBe(returned + 1)
  await page.evaluate(() => new Promise(requestAnimationFrame))
  await expect(app).toHaveCount(0)
})
