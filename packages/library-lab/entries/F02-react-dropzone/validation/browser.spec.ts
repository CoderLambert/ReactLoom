import { expect, test } from '@playwright/test'

const name = 'react-dropzone 文件选择实验'
async function drop(
  page: import('@playwright/test').Page,
  files: { name: string; type: string; text: string }[],
) {
  const transfer = await page.evaluateHandle((items) => {
    const dt = new DataTransfer()
    for (const item of items) dt.items.add(new File([item.text], item.name, { type: item.type }))
    return dt
  }, files)
  await page
    .getByRole('button', { name: '文件拖放区域', exact: true })
    .dispatchEvent('drop', { dataTransfer: transfer })
  await transfer.dispose()
}
test('@F02 actual chooser, noClick root and keyboard root paths', async ({ page }) => {
  await page.goto('/libraries/react-dropzone?tab=demo&example=basic')
  const app = page.getByRole('region', { name, exact: true }),
    root = app.getByRole('button', { name: '文件拖放区域', exact: true })
  let requested = 0
  page.on('filechooser', () => requested++)
  await root.click()
  await page.waitForTimeout(50)
  expect(requested).toBe(0)
  const first = page.waitForEvent('filechooser')
  await app.getByRole('button', { name: '选择本地文件', exact: true }).focus()
  await page.keyboard.press('Enter')
  const chooser = await first
  await chooser.setFiles({
    name: 'chosen.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('local'),
  })
  await expect(app.locator('li')).toContainText('chosen.txt')
  expect(requested).toBe(1)
  await expect(app.getByTestId('dropzone-dialog')).toContainText('已请求')
  const second = page.waitForEvent('filechooser')
  await root.focus()
  await page.keyboard.press('Space')
  await (await second).setFiles({
    name: 'keyboard.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('a,b'),
  })
  await expect(app.locator('li')).toContainText('keyboard.csv')
  expect(requested).toBe(2)
})

test('@F02 actual drop rejection codes and identical metadata keep independent rows', async ({
  page,
}) => {
  const duplicateKeys: string[] = []
  page.on('console', (message) => {
    if (/same key|unique.*key/i.test(message.text())) duplicateKeys.push(message.text())
  })
  await page.goto('/libraries/react-dropzone?tab=demo&example=advanced')
  const app = page.getByRole('region', { name, exact: true })
  await drop(page, [
    { name: 'same.txt', type: 'text/plain', text: 'one' },
    { name: 'same.txt', type: 'text/plain', text: 'two' },
  ])
  await expect(app.locator('li')).toHaveCount(2)
  await expect(app.getByTestId('dropzone-preview')).toHaveText('one')
  expect(duplicateKeys).toEqual([])
  await drop(page, [{ name: 'bad.bin', type: 'application/octet-stream', text: 'x' }])
  await expect(app.getByTestId('dropzone-status')).toContainText('file-invalid-type')
  await expect(app.locator('li')).toHaveCount(0)
  await drop(page, [{ name: 'large.txt', type: 'text/plain', text: 'x'.repeat(1025) }])
  await expect(app.getByTestId('dropzone-status')).toContainText('file-too-large')
  await drop(
    page,
    [1, 2, 3].map((i) => ({ name: `${i}.txt`, type: 'text/plain', text: 'ok' })),
  )
  await expect(app.getByTestId('dropzone-status')).toContainText('too-many-files')
  await drop(page, [{ name: 'fresh.txt', type: 'text/plain', text: 'recovered' }])
  await expect(app.getByTestId('dropzone-preview')).toHaveText('recovered')
})

test('@F02 bounded preview stale selection/clear/level/unmount reads cannot write back', async ({
  page,
}) => {
  await page.goto('/libraries/react-dropzone?tab=demo&example=business')
  let app = page.getByRole('region', { name, exact: true })
  await page.evaluate(() => {
    const original = Blob.prototype.slice
    const probe = { waiting: false, release: () => {} }
    Object.assign(window, { f02Read: probe })
    Blob.prototype.slice = function (...args) {
      const blob = original.apply(this, args)
      if (this instanceof File && this.name === 'slow.txt') {
        const buffer = blob.arrayBuffer.bind(blob)
        blob.arrayBuffer = async () => {
          const bytes = await buffer()
          return new Promise<ArrayBuffer>((resolve) => {
            probe.waiting = true
            probe.release = () => {
              probe.waiting = false
              resolve(bytes)
            }
          })
        }
      }
      return blob
    }
  })
  const input = () => app.locator('input[type=file]')
  const slow = { name: 'slow.txt', mimeType: 'text/plain', buffer: Buffer.from('old preview') }
  const waiting = async () =>
    expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as { f02Read: { waiting: boolean } }).f02Read.waiting,
        ),
      )
      .toBe(true)
  const release = () =>
    page.evaluate(() => (window as unknown as { f02Read: { release(): void } }).f02Read.release())
  await input().setInputFiles(slow)
  await waiting()
  await input().setInputFiles({
    name: 'fresh.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('latest preview'),
  })
  await expect(app.getByTestId('dropzone-preview')).toHaveText('latest preview')
  await release()
  await expect(app.getByTestId('dropzone-preview')).toHaveText('latest preview')
  await input().setInputFiles(slow)
  await waiting()
  await app.getByRole('button', { name: '清空', exact: true }).click()
  await release()
  await expect(app.getByTestId('dropzone-preview')).toHaveText('暂无预览')
  await input().setInputFiles(slow)
  await waiting()
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('advanced')
  await release()
  await expect(app.getByTestId('dropzone-preview')).toHaveText('暂无预览')
  await input().setInputFiles(slow)
  await waiting()
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await release()
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  app = page.getByRole('region', { name, exact: true })
  await expect(app.getByTestId('dropzone-preview')).toHaveText('暂无预览')
})
