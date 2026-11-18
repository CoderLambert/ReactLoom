import { expect, test } from '@playwright/test'
import {
  holdFileReads,
  installFileReads,
  readFileProbe,
  releaseFileReads,
} from './quality-file-read-probe'

const name = 'react-dropzone 文件选择实验'
const file = (name: string, text: string) => ({
  name,
  mimeType: 'text/plain',
  buffer: Buffer.from(text),
})
test('@F02 actual file dialog, root keyboard, drop and SDK rejection groups', async ({ page }) => {
  const external: string[] = []
  page.on('request', (r) => {
    if (/^https?:/.test(r.url()) && !r.url().startsWith('http://127.0.0.1:')) external.push(r.url())
  })
  await page.goto('/libraries/react-dropzone?tab=demo&example=basic')
  const app = page.getByRole('region', { name, exact: true })
  const root = app.getByRole('button', { name: '文件拖放区域', exact: true })
  let dialogRequests = 0
  page.on('filechooser', () => {
    dialogRequests++
  })
  await root.click()
  expect(dialogRequests).toBe(0)
  await expect(app.getByTestId('dropzone-dialog')).toHaveText('尚未请求文件对话框')
  let chooser = page.waitForEvent('filechooser')
  await app.getByRole('button', { name: '选择本地文件', exact: true }).click()
  await (await chooser).setFiles(file('chosen.txt', 'chosen'))
  await expect(app.getByRole('listitem')).toHaveCount(1)
  await expect(app.getByRole('listitem')).toContainText('chosen.txt')
  chooser = page.waitForEvent('filechooser')
  await root.focus()
  await root.press('Enter')
  await (await chooser).setFiles(file('keyboard.txt', 'keyboard'))
  await expect(app.getByRole('listitem')).toContainText('keyboard.txt')
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('business')
  await expect(app.getByRole('listitem')).toHaveCount(0)
  const transfer = await page.evaluateHandle(() => {
    const data = new DataTransfer()
    data.items.add(
      new File(['<script>never execute</script>\nlocal preview'], 'drop.txt', {
        type: 'text/plain',
      }),
    )
    return data
  })
  await root.dispatchEvent('dragenter', { dataTransfer: transfer })
  await root.dispatchEvent('drop', { dataTransfer: transfer })
  await transfer.dispose()
  await expect(app.getByTestId('dropzone-preview')).toContainText('<script>never execute</script>')
  await expect(app.getByTestId('dropzone-preview').locator('script')).toHaveCount(0)
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('advanced')
  const input = app.locator('input[type=file]')
  await input.setInputFiles([file('yes.txt', 'ok'), file('large.txt', 'x'.repeat(1025))])
  await expect(app.getByRole('listitem')).toHaveCount(1)
  await expect(app.getByRole('listitem')).toContainText('yes.txt')
  await expect(app.getByTestId('dropzone-status')).toContainText('file-too-large')
  await input.setInputFiles([file('a.txt', 'a'), file('b.txt', 'b'), file('c.txt', 'c')])
  await expect(app.getByRole('listitem')).toHaveCount(2)
  await expect(app.getByRole('listitem').nth(0)).toContainText('a.txt')
  await expect(app.getByRole('listitem').nth(1)).toContainText('b.txt')
  await expect(app.getByTestId('dropzone-status')).toContainText('too-many-files')
  await input.setInputFiles({
    name: 'denied.exe',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from('denied'),
  })
  await expect(app.getByTestId('dropzone-status')).toContainText('file-invalid-type')
  const sameNames = await page.evaluateHandle(() => {
    const data = new DataTransfer()
    data.items.add(new File(['A'], 'same.txt', { type: 'text/plain', lastModified: 1 }))
    data.items.add(new File(['B'], 'same.txt', { type: 'text/plain', lastModified: 1 }))
    return data
  })
  await root.dispatchEvent('drop', { dataTransfer: sameNames })
  await sameNames.dispose()
  await expect(app.getByRole('listitem')).toHaveCount(2)
  await expect(app.getByTestId('dropzone-preview')).toHaveText('A')
  expect(external).toEqual([])
})

test('@F02 preview stays bounded and late text cannot overwrite clear, level or unmount', async ({
  page,
}) => {
  await installFileReads(page, 'arrayBuffer')
  await page.goto('/libraries/react-dropzone?tab=demo&example=business')
  const app = page.getByRole('region', { name, exact: true })
  const input = app.locator('input[type=file]'),
    preview = app.getByTestId('dropzone-preview')
  await input.setInputFiles(file('bounded.txt', 'x'.repeat(9000)))
  await expect(preview).toHaveText('x'.repeat(1600))
  await holdFileReads(page)
  await input.setInputFiles(file('late.txt', 'old preview'))
  await expect.poll(async () => (await readFileProbe(page)).pending).toBe(1)
  await app.getByRole('button', { name: '清空', exact: true }).click()
  await holdFileReads(page, false)
  await input.setInputFiles(file('new.txt', 'new preview'))
  await expect(preview).toHaveText('new preview')
  await releaseFileReads(page)
  await expect(preview).toHaveText('new preview')
  await holdFileReads(page)
  await input.setInputFiles(file('level.txt', 'previous level'))
  await expect.poll(async () => (await readFileProbe(page)).pending).toBe(1)
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('advanced')
  await releaseFileReads(page)
  await expect(app.getByRole('listitem')).toHaveCount(0)
  await expect(preview).not.toContainText('previous level')
  await holdFileReads(page)
  await input.setInputFiles(file('unmounted.txt', 'late unmounted content'))
  await expect.poll(async () => (await readFileProbe(page)).pending).toBe(1)
  const pending = await readFileProbe(page)
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await releaseFileReads(page)
  expect((await readFileProbe(page)).returned).toBe(pending.returned + 1)
  await expect(app).toHaveCount(0)
})
