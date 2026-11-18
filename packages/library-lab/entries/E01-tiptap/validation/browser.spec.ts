import { expect, test } from '@playwright/test'

type EditorProbe = {
  isDestroyed: boolean
  callbacks: Record<string, unknown[]>
  off: (event: string, handler?: unknown) => unknown
}

test('E01 real editor commands, structured drafts, rejected restore and hook disposal @E01', async ({
  page,
}) => {
  await page.goto('/libraries/tiptap?tab=demo&example=basic')
  let region = page.getByRole('region', { name: 'Tiptap 编辑器实验' })
  let body = region.locator('[contenteditable="true"]')
  await expect(body).toBeVisible()
  await body.fill('editor acceptance')
  await body.press('ControlOrMeta+A')
  await page.waitForTimeout(600) // Separate typing history from the formatting command.
  await region.getByRole('button', { name: '加粗', exact: true }).click()
  await expect(body.locator('strong')).toHaveText('editor acceptance')
  await region.getByRole('button', { name: '撤销', exact: true }).click()
  await expect(body.locator('strong')).toHaveCount(0)
  await expect(body).toHaveText('editor acceptance')
  await page.goto('/libraries/tiptap?tab=demo&example=business')
  region = page.getByRole('region', { name: 'Tiptap 编辑器实验' })
  body = region.locator('[contenteditable="true"]')
  await body.fill('session acceptance')
  await region.getByRole('button', { name: '保存草稿', exact: true }).click()
  await expect(region.getByRole('status')).toContainText('已保存')
  await body.fill('changed')
  await region.getByRole('button', { name: '恢复草稿', exact: true }).click()
  await expect(body).toHaveText('session acceptance')
  await page.goto('/libraries/tiptap?tab=demo&example=advanced')
  region = page.getByRole('region', { name: 'Tiptap 编辑器实验' })
  body = region.locator('[contenteditable="true"]')
  await expect(body).toBeVisible()
  const baseline = await body.innerHTML()
  const input = region.getByRole('textbox', { name: '待恢复 JSON' })
  for (const raw of [
    '',
    '{',
    'x'.repeat(20001),
    JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'paragraph' }] }],
    }),
  ]) {
    await input.fill(raw)
    await region.getByRole('button', { name: '校验并恢复 JSON', exact: true }).click()
    await expect(region.getByRole('status')).toContainText('当前文档保持不变')
    await expect(body).toHaveJSProperty('innerHTML', baseline)
  }
  await input.fill(
    JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'validated content' }] }],
    }),
  )
  await region.getByRole('button', { name: '校验并恢复 JSON', exact: true }).click()
  await expect(body).toHaveText('validated content')
  // Scoped temporary Storage denial; restore the original descriptor even on failure.
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    Object.defineProperty(Storage.prototype, 'setItem', {
      configurable: true,
      writable: true,
      value: function (key: string, value: string) {
        if (key === 'reactloom.lab.E01.tiptap.draft.v1')
          throw new DOMException('denied', 'QuotaExceededError')
        return original.call(this, key, value)
      },
    })
  })
  try {
    await region.getByRole('button', { name: '保存草稿', exact: true }).click()
    await expect(region.getByRole('status')).toContainText('草稿保存失败')
  } finally {
    await page.reload()
  }
  region = page.getByRole('region', { name: 'Tiptap 编辑器实验' })
  body = region.locator('[contenteditable="true"]')
  await expect(body).toBeVisible()
  const probe = await body.evaluateHandle((element) => {
    const editor = (element as HTMLElement & { editor: EditorProbe }).editor
    const state = { editor, cleanupOffCalls: 0 }
    const original = editor.off.bind(editor)
    editor.off = (event, handler) => {
      if (event === 'update' && handler) state.cleanupOffCalls++
      return original(event, handler)
    }
    return state
  })
  expect(await probe.evaluate((p) => p.editor.isDestroyed)).toBe(false)
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect.poll(() => probe.evaluate((p) => p.editor.isDestroyed)).toBe(true)
  expect(await probe.evaluate((p) => p.cleanupOffCalls)).toBeGreaterThan(0)
  expect(await probe.evaluate((p) => Object.keys(p.editor.callbacks).length)).toBe(0)
  await probe.dispose()
  // Real IME candidate selection needs manual OS input; synthetic events are not that receipt.
})
