import { expect, test } from '@playwright/test'

const KEY = 'reactloom.lab.E02.blocknote.blocks.v1'

test('@E02 actual BlockNote typing, slash menu and onChange', async ({ page }) => {
  await page.goto('/libraries/blocknote?tab=demo&example=basic')
  const app = page.getByRole('region', { name: 'BlockNote 块编辑实验', exact: true })
  const editable = app.locator('[contenteditable="true"]').first()
  await editable.click()
  await page.keyboard.press('ControlOrMeta+End')
  await page.keyboard.press('Enter')
  await page.keyboard.type('independent note')
  await expect(editable).toContainText('independent note')
  await expect(app.getByTestId('blocknote-changes')).not.toHaveText('0')
  await page.keyboard.press('Enter')
  await page.keyboard.type('/')
  await expect(page.getByRole('listbox')).toBeVisible()
  await page.getByRole('listbox').getByRole('option').first().click()
  await expect(page.getByRole('listbox')).toHaveCount(0)
  // Version-bound test handle from the installed SDK, not a product integration API.
  const lifecycle = await page.evaluateHandle(() => {
    type Editor = { onUnmount: (callback: () => void) => () => void }
    const tiptap = (
      window as Window & {
        ProseMirror?: { schema: { cached: { blockNoteEditor?: Editor } } }
      }
    ).ProseMirror
    const editor = tiptap?.schema.cached.blockNoteEditor
    if (!editor || typeof editor.onUnmount !== 'function')
      throw new Error('Missing actual BlockNote 0.56 instance for lifecycle observation')
    const observation = { unmounts: 0, dispose: () => {} }
    observation.dispose = editor.onUnmount(() => {
      observation.unmounts++
    })
    return observation
  })
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect.poll(() => lifecycle.evaluate((state) => state.unmounts)).toBe(1)
  await lifecycle.evaluate((state) => state.dispose())
  await lifecycle.dispose()
  await expect(app).toHaveCount(0)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(app.locator('[contenteditable="true"]').first()).not.toContainText(
    'independent note',
  )
  // Public unmount event plus remount evidence; not editor.destroy or every internal cleanup.
})

test('@E02 real insert/save/restore generates new IDs and rejects bad drafts unchanged', async ({
  page,
}) => {
  await page.goto('/libraries/blocknote?tab=demo&example=advanced')
  const app = page.getByRole('region', { name: 'BlockNote 块编辑实验', exact: true })
  const save = app.getByRole('button', { name: '保存会话草稿', exact: true })
  const restore = app.getByRole('button', { name: '恢复会话草稿', exact: true })
  const insert = app.getByRole('button', { name: '插入审核段落块', exact: true })
  const editable = app.locator('[contenteditable="true"]').first()
  await save.click()
  const old = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) || 'null'), KEY)
  await insert.click()
  await expect(app.getByTestId('blocknote-count')).toHaveText('3')
  await restore.click()
  await expect(app.getByTestId('blocknote-count')).toHaveText('2')
  await save.click()
  const fresh = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) || 'null'), KEY)
  expect(fresh.map((block: { id: string }) => block.id)).not.toEqual(
    old.map((block: { id: string }) => block.id),
  )
  const before = await editable.innerText()
  for (const raw of [
    '{',
    'x'.repeat(60001),
    JSON.stringify([{ type: 'heading', props: { level: 99 } }]),
    JSON.stringify([{ type: 'image', props: { url: 'https://example.test/image.png' } }]),
  ]) {
    await page.evaluate(({ key, raw }) => sessionStorage.setItem(key, raw), { key: KEY, raw })
    await restore.click()
    await expect(app.locator('p[role="status"]')).toContainText('无法恢复')
    expect(await editable.innerText()).toBe(before)
    await expect(app.getByTestId('blocknote-count')).toHaveText('2')
  }
  await save.click()
  await expect(app.locator('p[role="status"]')).toContainText('已保存')
  await insert.click()
  await restore.click()
  await expect(app.getByTestId('blocknote-count')).toHaveText('2')
  await editable.dispatchEvent('compositionstart')
  await insert.click()
  await expect(app.locator('p[role="status"]')).toContainText('请先完成输入法组合')
  await expect(app.getByTestId('blocknote-count')).toHaveText('2')
  await editable.dispatchEvent('compositionend')
  await app.getByRole('button', { name: '清除本例草稿', exact: true }).click()
  await restore.click()
  await expect(app.locator('p[role="status"]')).toContainText('没有本地草稿')
})

test('@E02 Storage access failures are visible without replacing editor content', async ({
  page,
}) => {
  await page.goto('/libraries/blocknote?tab=demo&example=business')
  const app = page.getByRole('region', { name: 'BlockNote 块编辑实验', exact: true })
  const before = await app.locator('[contenteditable="true"]').first().innerText()
  await page.evaluate((key) => {
    const set = Storage.prototype.setItem
    const get = Storage.prototype.getItem
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('test quota', 'QuotaExceededError')
      return set.call(this, name, value)
    }
    Storage.prototype.getItem = function (name) {
      if (name === key) throw new DOMException('test denied', 'SecurityError')
      return get.call(this, name)
    }
  }, KEY)
  await app.getByRole('button', { name: '保存会话草稿', exact: true }).click()
  await expect(app.locator('p[role="status"]')).toContainText('QuotaExceededError')
  await app.getByRole('button', { name: '恢复会话草稿', exact: true }).click()
  await expect(app.locator('p[role="status"]')).toContainText('SecurityError')
  expect(await app.locator('[contenteditable="true"]').first().innerText()).toBe(before)
  // Test page closes after this case; other storage keys retain original methods.
})
