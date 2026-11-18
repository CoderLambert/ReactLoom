import { expect, test } from '@playwright/test'

const KEY = 'reactloom:library-lab:E04:config-draft:v1'
type Probe = { destroyed: boolean; state: { doc: { toString(): string } }; destroy(): void }
async function captureView(content: import('@playwright/test').Locator) {
  return content.evaluateHandle(
    (element) => (element as HTMLElement & { cmTile: { root: { view: Probe } } }).cmTile.root.view,
  )
}

test('@E04 real input, syntax spans and undo', async ({ page }) => {
  await page.goto('/libraries/codemirror6?tab=demo&example=basic')
  const app = page.getByRole('region', { name: 'CodeMirror 6 实际编辑器', exact: true })
  const content = app.locator('.cm-content')
  await expect(content.locator('span').first()).toBeVisible()
  const old = await content.innerText()
  await content.click()
  await page.keyboard.press('ControlOrMeta+End')
  await page.keyboard.type('42')
  await expect(content).toContainText('42')
  await page.keyboard.press('ControlOrMeta+z')
  expect(await content.innerText()).toBe(old)
  await expect(app.locator('.cm-editor')).toHaveCount(1)
})

test('@E04 valid draft restores; NUL/oversized drafts fail without changing text', async ({
  page,
}) => {
  await page.goto('/libraries/codemirror6?tab=demo&example=business')
  const app = page.getByRole('region', { name: 'CodeMirror 6 实际编辑器', exact: true })
  const content = app.locator('.cm-content')
  await app.getByRole('button', { name: '保存会话草稿', exact: true }).click()
  const saved = await page.evaluate((key) => sessionStorage.getItem(key), KEY)
  await content.click()
  await page.keyboard.press('ControlOrMeta+End')
  await page.keyboard.type('changed')
  await app.getByRole('button', { name: '恢复草稿', exact: true }).click()
  const probe = await captureView(content)
  expect(await probe.evaluate((v) => v.state.doc.toString())).toBe(saved)
  for (const raw of ['bad\0draft', 'x'.repeat(50001)]) {
    await page.evaluate(({ key, raw }) => sessionStorage.setItem(key, raw), { key: KEY, raw })
    await app.getByRole('button', { name: '恢复草稿', exact: true }).click()
    await expect(app.locator('p[role="status"]')).toContainText('保持不变')
    expect(await probe.evaluate((v) => v.state.doc.toString())).toBe(saved)
  }
  await page.evaluate((key) => sessionStorage.setItem(key, ''), KEY)
  await app.getByRole('button', { name: '恢复草稿', exact: true }).click()
  expect(await probe.evaluate((v) => v.state.doc.toString())).toBe('')
  await page.evaluate((key) => {
    const get = Storage.prototype.getItem
    const set = Storage.prototype.setItem
    Storage.prototype.getItem = function (name) {
      if (name === key) throw new DOMException('test denied', 'SecurityError')
      return get.call(this, name)
    }
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('test quota', 'QuotaExceededError')
      return set.call(this, name, value)
    }
  }, KEY)
  await app.getByRole('button', { name: '保存会话草稿', exact: true }).click()
  await expect(app.locator('p[role="status"]')).toContainText('QuotaExceededError')
  await app.getByRole('button', { name: '恢复草稿', exact: true }).click()
  await expect(app.locator('p[role="status"]')).toContainText('SecurityError')
  expect(await probe.evaluate((v) => v.state.doc.toString())).toBe('')
  await probe.dispose()
})

test('@E04 readonly reconfigures the same view, program reset works, outer view observes destroy', async ({
  page,
}) => {
  await page.goto('/libraries/codemirror6?tab=demo&example=advanced')
  const app = page.getByRole('region', { name: 'CodeMirror 6 实际编辑器', exact: true })
  const content = app.locator('.cm-content')
  const probe = await captureView(content)
  await content.click()
  await page.keyboard.press('ControlOrMeta+End')
  await page.keyboard.type(' added')
  const changed = await probe.evaluate((v) => v.state.doc.toString())
  await app.getByRole('checkbox', { name: '只读模式', exact: true }).check()
  await content.click()
  await page.keyboard.type('BLOCKED')
  expect(await probe.evaluate((v) => v.state.doc.toString())).toBe(changed)
  expect(await probe.evaluate((v) => v.destroyed)).toBe(false)
  const same = await content.evaluate(
    (element, old) =>
      (element as HTMLElement & { cmTile: { root: { view: Probe } } }).cmTile.root.view === old,
    probe,
  )
  expect(same).toBe(true)
  await app.getByRole('button', { name: '重置当前代码', exact: true }).click()
  expect(await probe.evaluate((v) => v.state.doc.toString())).not.toContain(' added')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect.poll(() => probe.evaluate((v) => v.destroyed)).toBe(true)
  await probe.dispose()
  // cmTile.root.view/destroyed are fixed installed-view whitebox probes, not product APIs.
})
