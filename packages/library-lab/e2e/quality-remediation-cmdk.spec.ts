// NOT_RUN. Root integrates into its matching-candidate suite. Real cmdk/Radix/DOM/keyboard.
// Composition dispatch below is an explicit event-protocol regression, not real OS IME coverage.
import { expect, type Locator, type Page, test } from '@playwright/test'

type State = { search: string; selectedId: string; resultCount: number }
async function state(root: Locator): Promise<State> {
  return JSON.parse((await root.getByTestId('b18-sdk-state').textContent()) || 'null')
}
async function open(page: Page, level: 'basic' | 'business' | 'advanced') {
  await page.setViewportSize({ width: 1200, height: 900 })
  await page.goto(`/libraries/cmdk?tab=demo&example=${level}`)
  const app = page.getByTestId('b18-workshop')
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  await expect(app.or(run).first()).toBeVisible()
  if (await run.isVisible()) await run.click()
  await expect(app).toHaveAttribute('data-level', level)
  return app
}

test('@B18 actual cmdk filtering and active-descendant identities drive keyboard article actions', async ({
  page,
}) => {
  const app = await open(page, 'basic')
  const input = app.getByRole('combobox')
  await expect.poll(async () => (await state(app)).resultCount).toBe(3)
  await expect(app.getByRole('option')).toHaveCount(3)
  await input.focus()
  await input.press('Home')
  await expect.poll(async () => (await state(app)).selectedId).toBe('save')
  await input.press('ArrowDown')
  await expect.poll(async () => (await state(app)).selectedId).toBe('read')
  const readId = await app.getByRole('option', { name: '标记已读', exact: true }).getAttribute('id')
  if (!readId) throw new Error('SDK option has no id')
  await expect(input).toHaveAttribute('aria-activedescendant', readId)
  await input.press('Enter')
  await expect(app.getByTestId('b18-article')).toContainText('阅读状态：已读')
  await input.fill('收藏')
  await expect(app.getByRole('option')).toHaveCount(1)
  await expect
    .poll(async () => state(app))
    .toEqual({ search: '收藏', selectedId: 'save', resultCount: 1 })
  await input.press('Enter')
  await expect(input).toHaveValue('')
  await expect(app.getByTestId('b18-article')).toContainText('稍后阅读：已加入')
  await input.fill('收藏')
  await input.press('Enter')
  await expect(app.getByTestId('b18-article')).toContainText('稍后阅读：未加入')
  await input.fill('absolutely-missing-command-8842')
  await expect.poll(async () => (await state(app)).resultCount).toBe(0)
  await expect(app.getByRole('option')).toHaveCount(0)
  await expect(app.getByText('没有匹配命令，试试“阅读”或“刷新”。', { exact: true })).toBeVisible()
  const before = await app.getByTestId('b18-status').textContent()
  await input.press('Enter')
  await expect(app.getByTestId('b18-status')).toHaveText(before || '')
})

test('@B18 SDK groups and bilingual aliases expose disabled matches without executing them', async ({
  page,
}) => {
  const app = await open(page, 'business')
  const input = app.getByRole('combobox')
  await expect.poll(async () => (await state(app)).resultCount).toBe(5)
  await input.fill('RSS')
  await expect.poll(async () => (await state(app)).selectedId).toBe('refresh')
  await expect(app.getByRole('option')).toHaveCount(1)
  await expect(app.getByRole('group', { name: '阅读', exact: true })).toHaveCount(0)
  await input.press('Enter')
  await expect(app.getByTestId('b18-article')).toContainText('本地刷新次数：1')
  await input.fill('删除')
  const disabled = app.getByRole('option', { name: '删除所有订阅', exact: true })
  await expect(disabled).toHaveAttribute('aria-disabled', 'true')
  await expect.poll(async () => (await state(app)).resultCount).toBe(1)
  await expect.poll(async () => (await state(app)).selectedId).toBe('')
  const before = await app.getByTestId('b18-status').textContent()
  await input.press('Enter')
  // Use physical coordinates: Playwright correctly refuses an enabled-only locator click.
  const bounds = await disabled.boundingBox()
  if (!bounds) throw new Error('No real disabled option bounds')
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
  await expect(app.getByTestId('b18-status')).toHaveText(before || '')
  await expect(app.getByTestId('b18-article')).toContainText('本地刷新次数：1')
  await input.fill('引用')
  await app.getByRole('option', { name: '生成本地引用', exact: true }).click()
  await expect(app.getByTestId('b18-article')).toContainText(
    'NewsHub / 前端工程资讯 / 本地示例文章',
  )
})

test('@B18 real Dialog portal hotkeys focus restoration composition protocol and listener teardown', async ({
  page,
}, info) => {
  const app = await open(page, 'advanced')
  const outside = app.getByRole('textbox', { name: '面板外编辑框', exact: true })
  const trigger = app.getByRole('button', { name: '打开命令面板（Ctrl/Cmd+K）', exact: true })
  const dialog = page.getByRole('dialog', { name: '本示例的命令搜索', exact: true })
  await outside.fill('保留编辑中的内容')
  await outside.press('Control+k')
  await expect(dialog).toHaveCount(0)
  await expect(outside).toHaveValue('保留编辑中的内容')
  await trigger.focus()
  await page.keyboard.down('Control')
  await page.keyboard.down('k')
  await expect(dialog).toBeVisible()
  await page.keyboard.down('k') // Actual repeated keydown must not close the menu.
  await expect(dialog).toBeVisible()
  await page.keyboard.up('k')
  await page.keyboard.up('Control')
  const input = dialog.getByRole('combobox')
  await expect(input).toBeFocused()
  expect(await dialog.evaluate((element) => getComputedStyle(element).position)).toBe('fixed')
  expect(
    await dialog.evaluate((element) => element.closest('[data-testid="b18-workshop"]') === null),
  ).toBe(true)
  await expect(page.locator('[cmdk-overlay]')).toBeVisible()
  await info.attach('b18-real-dialog.png', {
    body: await dialog.screenshot(),
    contentType: 'image/png',
  })
  await input.fill('收藏')
  await expect.poll(async () => (await state(dialog)).selectedId).toBe('save')
  await input.dispatchEvent('compositionstart', { data: '中' })
  await input.press('Enter')
  await expect(dialog).toBeVisible()
  await expect(app.getByTestId('b18-article')).toContainText('稍后阅读：未加入')
  const commitPrevented = await input.evaluate((element) => {
    // Same-turn protocol probe avoids a flaky IPC delay across the 80ms boundary.
    element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '中' }))
    return !element.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }),
    )
  })
  expect(commitPrevented).toBe(true)
  await expect(dialog).toBeVisible()
  await page.waitForTimeout(100) // Real elapsed time; no fake clock.
  await input.press('Enter')
  await expect(dialog).toHaveCount(0)
  await expect(app.getByTestId('b18-article')).toContainText('稍后阅读：已加入')
  await expect(trigger).toBeFocused()
  const stop = page.getByRole('button', { name: '停止并卸载', exact: true })
  await stop.focus()
  await page.keyboard.press('Control+k')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('combobox').press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(stop).toBeFocused() // The actual opener, rather than an unconditional trigger focus.
  await trigger.click()
  await dialog.getByRole('combobox').press('Control+k')
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await stop.click()
  await expect(app).toHaveCount(0)
  await page.keyboard.press('Control+k')
  await expect(dialog).toHaveCount(0)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(app).toHaveAttribute('data-open', 'false')
  await expect(app.getByTestId('b18-article')).toContainText('稍后阅读：未加入')
})

test('@B18 close-control keys preserve owned palette shortcut without executing the highlighted command', async ({
  page,
}) => {
  const app = await open(page, 'advanced')
  const trigger = app.getByRole('button', { name: '打开命令面板（Ctrl/Cmd+K）', exact: true })
  const dialog = page.getByRole('dialog')
  const close = page.getByRole('button', { name: '关闭命令面板', exact: true })
  await trigger.click()
  await page.getByRole('combobox').fill('收藏')
  await close.focus()
  await close.press('Enter')
  await expect(dialog).toHaveCount(0)
  await expect(app.getByTestId('b18-article')).toContainText('稍后阅读：未加入')
  await trigger.click()
  await close.focus()
  await close.press('Control+k')
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await trigger.click()
  await close.focus()
  await close.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await expect(app.getByTestId('b18-article')).toContainText('稍后阅读：未加入')
})
