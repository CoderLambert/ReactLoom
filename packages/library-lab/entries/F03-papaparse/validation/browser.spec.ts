import { Buffer } from 'node:buffer'
import { expect, test } from '@playwright/test'

test('@F03 real CSV reports, scoped level fixtures, local bytes and safe text', async ({
  page,
}) => {
  const external: string[] = []
  page.on('request', (r) => {
    if (
      !r.url().startsWith('http://127.0.0.1') &&
      !r.url().startsWith('http://localhost') &&
      !r.url().startsWith('blob:') &&
      !r.url().startsWith('data:')
    )
      external.push(r.url())
  })
  await page.goto('/libraries/papaparse?tab=demo&example=basic')
  const app = page.getByRole('region', { name: 'Papa Parse 真实 CSV 实验', exact: true })
  const parse = app.getByRole('button', { name: '解析并校验', exact: true }),
    input = app.getByRole('textbox', { name: 'CSV 输入', exact: true })
  await parse.click()
  await expect(app.getByTestId('papa-records')).toContainText('React, Loom')
  await expect(app.locator('p[role=status]')).toContainText('通过 1')
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('business')
  await expect(input).toHaveValue(/技术新闻/)
  await expect(app.getByTestId('papa-records')).toHaveCount(0)
  await parse.click()
  await expect(app.locator('p[role=status]')).toContainText('拒绝 2')
  await input.fill('title,url,note\nA,https://example.org,"=2+3\nsecond"')
  await parse.click()
  await expect(app.getByTestId('papa-export')).toContainText("'=2+3")
  for (const bad of [
    'title,url,note,note\nA,https://example.org,x,y',
    'title,url,note\nA,https://example.org,x\nB,https://example.org/z,"broken',
  ]) {
    await input.fill(bad)
    await parse.click()
    await expect(app.getByTestId('papa-records')).toHaveText('[]')
  }
  const file = app.locator('input[type=file]')
  await file.setInputFiles({
    name: 'bad.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from([0xc3, 0x28]),
  })
  await expect(app.getByRole('alert')).toBeVisible()
  await expect(app.getByTestId('papa-records')).toHaveCount(0)
  await file.setInputFiles({
    name: 'large.csv',
    mimeType: 'text/csv',
    buffer: Buffer.alloc(256001),
  })
  await expect(app.getByRole('alert')).toContainText('256,000')
  await file.setInputFiles({
    name: 'safe.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      'title,url,note\nA,https://example.org,"<img src=https://not-requested.invalid/x onerror=alert(1)>"',
    ),
  })
  await parse.click()
  await expect(app.getByTestId('papa-records')).toContainText('<img')
  await expect(app.locator('img')).toHaveCount(0)
  expect(external).toEqual([])
})

test('@F03 real Blob read completion cannot overwrite edits, reset, new level or unmount', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const probe = { hold: true, held: [] as (() => void)[] }
    Object.assign(window, { csvReadProbe: probe })
    const read = Blob.prototype.arrayBuffer
    Blob.prototype.arrayBuffer = async function () {
      const bytes = await read.call(this)
      if (probe.hold) await new Promise<void>((resolve) => probe.held.push(resolve))
      return bytes
    }
  })
  await page.goto('/libraries/papaparse?tab=demo&example=business')
  const app = page.getByRole('region', { name: 'Papa Parse 真实 CSV 实验', exact: true }),
    input = app.getByRole('textbox', { name: 'CSV 输入', exact: true })
  const file = app.locator('input[type=file]')
  const hold = async () => {
    await file.setInputFiles({
      name: 'late.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('title,url,note\nLATE,https://example.org,x'),
    })
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { csvReadProbe: { held: unknown[] } }).csvReadProbe.held.length,
        ),
      )
      .toBeGreaterThan(0)
  }
  const release = async () => {
    await page.evaluate(() => {
      const p = (window as unknown as { csvReadProbe: { held: (() => void)[] } }).csvReadProbe
      p.held.splice(0).forEach((f) => {
        f()
      })
    })
  }
  await hold()
  await input.fill('manual')
  await release()
  await expect(input).toHaveValue('manual')
  await hold()
  await app.getByRole('button', { name: '重置案例' }).click()
  await release()
  await expect(input).toHaveValue(/技术新闻/)
  await hold()
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('advanced')
  await release()
  await expect(input).toHaveValue(/危险公式/)
  await hold()
  await page.getByRole('tab', { name: '文档', exact: true }).click()
  await release()
  await expect(app).toHaveCount(0)
})
