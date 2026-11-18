import { expect, test } from '@playwright/test'

const KEY = 'reactloom:library-lab:E03:article:v1'
test('@E03 actual typing, JSON restore and preflight rejection keep document', async ({ page }) => {
  await page.goto('/libraries/lexical?tab=demo&example=basic')
  const basic = page.getByRole('region', { name: 'Lexical 真实编辑器', exact: true })
  await basic.getByRole('textbox', { name: 'Lexical 文档编辑区', exact: true }).fill('abc')
  await expect(basic.getByTestId('lexical-length')).toHaveText('3')
  await basic.getByRole('button', { name: '重置本文', exact: true }).click()
  await expect(basic.getByRole('textbox', { name: 'Lexical 文档编辑区', exact: true })).toHaveText(
    '新的编辑草稿',
  )
  await expect(basic.getByRole('button', { name: '保存 JSON 草稿', exact: true })).toHaveCount(0)
  await page.goto('/libraries/lexical?tab=demo&example=business')
  const app = page.getByRole('region', { name: 'Lexical 真实编辑器', exact: true })
  const editable = app.getByRole('textbox', { name: 'Lexical 文档编辑区', exact: true })
  await editable.fill('saved Lexical draft')
  await expect(app.getByTestId('lexical-length')).toHaveText('19')
  await app.getByRole('button', { name: '保存 JSON 草稿', exact: true }).click()
  await editable.fill('changed')
  await app.getByRole('button', { name: '恢复 JSON 草稿', exact: true }).click()
  await expect(editable).toHaveText('saved Lexical draft')
  for (const raw of [
    '{',
    'x'.repeat(100001),
    JSON.stringify({
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [{ type: 'text', version: 1, text: 'bad', format: 'bold' }],
          },
        ],
      },
    }),
  ]) {
    await page.evaluate(({ key, raw }) => sessionStorage.setItem(key, raw), { key: KEY, raw })
    await app.getByRole('button', { name: '恢复 JSON 草稿', exact: true }).click()
    await expect(app.getByRole('status', { name: 'Lexical操作结果' })).toContainText('恢复失败')
    await expect(editable).toHaveText('saved Lexical draft')
  }
  await editable.dispatchEvent('compositionstart', { data: '中' })
  await app.getByRole('button', { name: '重置本文', exact: true }).click()
  await expect(app.getByRole('status', { name: 'Lexical操作结果' })).toContainText(
    '请先完成输入法组合',
  )
  await expect(editable).toHaveText('saved Lexical draft')
  await editable.dispatchEvent('compositionend', { data: '中' })
  // Synthetic composition only; no claim about a native OS IME session.
})

test('@E03 selection formatting and real HistoryPlugin undo redo', async ({ page }) => {
  await page.goto('/libraries/lexical?tab=demo&example=advanced')
  const app = page.getByRole('region', { name: 'Lexical 真实编辑器', exact: true })
  const editable = app.getByRole('textbox', { name: 'Lexical 文档编辑区', exact: true })
  await editable.fill('format me')
  await editable.click()
  await page.keyboard.press('ControlOrMeta+A')
  await app.getByRole('button', { name: '加粗所选文字', exact: true }).click()
  await expect(editable.locator('.lexical-example-bold')).toHaveText('format me')
  await expect(editable.locator('.lexical-example-bold')).toHaveCSS('font-weight', '700')
  await app.getByRole('button', { name: '撤销', exact: true }).click()
  await expect(editable.locator('.lexical-example-bold')).toHaveCount(0)
  await expect(editable).toHaveText('format me')
  await app.getByRole('button', { name: '重做', exact: true }).click()
  await expect(editable.locator('.lexical-example-bold')).toHaveText('format me')
})

test('@E03 real root detaches on unmount and test observer is released', async ({ page }) => {
  await page.goto('/libraries/lexical?tab=demo&example=advanced')
  const app = page.getByRole('region', { name: 'Lexical 真实编辑器', exact: true })
  await expect(app.getByRole('textbox', { name: 'Lexical 文档编辑区' })).toBeVisible()
  await page.evaluate(() => {
    type Editor = {
      getRootElement(): HTMLElement | null
      registerRootListener(listener: (root: HTMLElement | null) => void): () => void
    }
    const root = document.querySelector('[aria-label="Lexical 文档编辑区"]') as HTMLElement & {
      __lexicalEditor?: Editor
    }
    const editor = root?.__lexicalEditor
    if (!editor || editor.getRootElement() !== root)
      throw new Error('Expected actual Lexical DOM editor handle')
    const probe = { editor, detached: 0, off: () => {} }
    probe.off = editor.registerRootListener((next) => {
      if (next === null) probe.detached++
    })
    Object.assign(window, { e03CleanupProbe: probe })
  })
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  expect(
    await page.evaluate(() => {
      const probe = (
        window as unknown as {
          e03CleanupProbe: {
            editor: { getRootElement(): HTMLElement | null }
            detached: number
            off(): void
          }
        }
      ).e03CleanupProbe
      const result = {
        rootDetached: probe.editor.getRootElement() === null,
        notifications: probe.detached,
      }
      probe.off()
      return result
    }),
  ).toEqual({ rootDetached: true, notifications: 1 })
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(app.getByRole('textbox', { name: 'Lexical 文档编辑区' })).toHaveText('')
  // This observes public root detach, not an invented editor.destroy API.
})

test('@E03 per-key Storage failures leave live text editable', async ({ page }) => {
  await page.goto('/libraries/lexical?tab=demo&example=business')
  const app = page.getByRole('region', { name: 'Lexical 真实编辑器', exact: true })
  const editable = app.getByRole('textbox', { name: 'Lexical 文档编辑区', exact: true })
  await editable.fill('live text survives')
  await page.evaluate((key) => {
    const set = Storage.prototype.setItem,
      get = Storage.prototype.getItem
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('quota', 'QuotaExceededError')
      return set.call(this, name, value)
    }
    Storage.prototype.getItem = function (name) {
      if (name === key) throw new DOMException('denied', 'SecurityError')
      return get.call(this, name)
    }
  }, KEY)
  await app.getByRole('button', { name: '保存 JSON 草稿', exact: true }).click()
  await expect(app.getByRole('status', { name: 'Lexical操作结果' })).toContainText(
    'QuotaExceededError',
  )
  await app.getByRole('button', { name: '恢复 JSON 草稿', exact: true }).click()
  await expect(app.getByRole('status', { name: 'Lexical操作结果' })).toContainText('SecurityError')
  await expect(editable).toHaveText('live text survives')
})
