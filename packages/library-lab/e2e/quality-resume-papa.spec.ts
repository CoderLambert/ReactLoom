import { expect, test } from '@playwright/test'
import {
  holdFileReads,
  installFileReads,
  readFileProbe,
  releaseFileReads,
} from './quality-file-read-probe'

const name = 'Papa Parse 真实 CSV 实验'
const csv = (title: string) => `title,url,note\n${title},https://example.org/${title},local`
const file = (text: string) => ({
  name: 'original.csv',
  mimeType: 'text/csv',
  buffer: Buffer.from(text),
})
test('@F03 actual CSV quotes, business rejection, structural failure and multiline formula export', async ({
  page,
}) => {
  await page.goto('/libraries/papaparse?tab=demo&example=basic')
  const app = page.getByRole('region', { name, exact: true })
  const parse = app.getByRole('button', { name: '解析并校验', exact: true })
  const input = app.getByRole('textbox', { name: 'CSV 输入', exact: true })
  const accepted = app.getByTestId('papa-records'),
    exported = app.getByTestId('papa-export')
  await parse.click()
  expect(JSON.parse((await accepted.textContent()) ?? 'null')).toEqual([
    { title: 'React, Loom', url: 'https://example.org/feeds', note: '带引号 "文本" 和\n下一行' },
  ])
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('business')
  await expect(accepted).toHaveCount(0)
  await expect(input).toHaveValue(/技术新闻/)
  await parse.click()
  await expect(app.locator('p[role=status]')).toContainText('通过 1，拒绝 2')
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('advanced')
  await expect(input).toHaveValue(/=2\+3/)
  await parse.click()
  await expect(app.locator('p[role=status]')).toContainText('通过 2，拒绝 1')
  await expect(exported).toContainText("'=2+3")
  await input.fill('title,url,note\nMultiline,https://example.org/safe,"=1+\n2"')
  await parse.click()
  await expect(exported).toContainText('"\'=1+\n2"')
  for (const source of [
    'title,url,note,note\nA,https://example.org/a,x,y',
    'title,url,note\nA,https://example.org/a,"never closed',
  ]) {
    await input.fill(source)
    await parse.click()
    await expect(accepted).toHaveText('[]')
  }
  await input.fill(
    'title,url,note\nCredential,https://user:pass@example.org/a,deny\nSafe,https://example.org/b#first,allow\nDuplicate,https://example.org/b#second,deny',
  )
  await parse.click()
  await expect(app.locator('p[role=status]')).toContainText('通过 1，拒绝 2')
  expect(JSON.parse((await accepted.textContent()) ?? 'null')[0].url).toBe('https://example.org/b')
})

test('@F03 bounded fatal UTF8 file reading and level/manual/unmount discard late reads', async ({
  page,
}) => {
  await installFileReads(page, 'arrayBuffer')
  await page.goto('/libraries/papaparse?tab=demo&example=business')
  const app = page.getByRole('region', { name, exact: true })
  const picker = app.locator('input[type=file]'),
    input = app.getByRole('textbox', { name: 'CSV 输入', exact: true })
  const parse = app.getByRole('button', { name: '解析并校验', exact: true })
  await picker.setInputFiles(file(csv('chosen')))
  await expect(input).toHaveValue(csv('chosen'))
  await parse.click()
  await expect(app.getByTestId('papa-records')).toContainText('chosen')
  const before = await readFileProbe(page)
  await picker.setInputFiles(file('x'.repeat(256001)))
  await expect(app.getByRole('alert')).toContainText('256')
  expect((await readFileProbe(page)).calls).toBe(before.calls)
  await expect(app.getByTestId('papa-records')).toHaveCount(0)
  await picker.setInputFiles({
    name: 'bad.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from([0xff, 0xfe]),
  })
  await expect(app.getByRole('alert')).toContainText('读取失败')
  await holdFileReads(page)
  await picker.setInputFiles(file(csv('late')))
  await expect.poll(async () => (await readFileProbe(page)).pending).toBe(1)
  await input.fill(csv('manual'))
  await parse.click()
  await releaseFileReads(page)
  await expect(input).toHaveValue(csv('manual'))
  await expect(app.getByTestId('papa-records')).toContainText('manual')
  await holdFileReads(page)
  await picker.setInputFiles(file(csv('oldLevel')))
  await expect.poll(async () => (await readFileProbe(page)).pending).toBe(1)
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('advanced')
  await releaseFileReads(page)
  await expect(input).toHaveValue(/=2\+3/)
  await holdFileReads(page)
  await picker.setInputFiles(file(csv('unmounted')))
  await expect.poll(async () => (await readFileProbe(page)).pending).toBe(1)
  const pending = await readFileProbe(page)
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await releaseFileReads(page)
  expect((await readFileProbe(page)).returned).toBe(pending.returned + 1)
  await expect(app).toHaveCount(0)
})
