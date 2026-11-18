// Real browser proposal: actual SDK Tree/HTML5 backend/DOM. NOT_RUN by author.
// Synthetic composition events exercise our local guard only; real OS IME remains NOT_RUN.
import { expect, type Locator, type Page, test } from '@playwright/test'

async function open(page: Page, level: 'basic' | 'business' | 'advanced') {
  await page.setViewportSize({ width: 1280, height: 1200 })
  await page.goto(`/libraries/react-arborist?tab=demo&example=${level}`)
  const app = page.getByTestId('c11-workshop')
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  await expect(app.or(run).first()).toBeVisible({ timeout: 20_000 })
  if (await run.isVisible()) await run.click()
  await expect(app).toHaveAttribute('data-level', level)
  await expect.poll(async () => (await model(app)).visibleNodes).toBeGreaterThan(0)
  return app
}
function node(app: Locator, id: string) {
  return app.locator(`[data-node-id="${id}"]`)
}
function row(app: Locator, id: string) {
  return node(app, id).locator('xpath=ancestor::*[@role="treeitem"][1]')
}
async function model(app: Locator) {
  return JSON.parse((await app.getByTestId('c11-model').textContent()) ?? '{}')
}
async function topology(app: Locator) {
  return JSON.parse((await app.getByTestId('c11-topology').textContent()) ?? '[]') as {
    id: string
    childCount: number
    firstIds: string[]
    lastId: string | null
  }[]
}
async function move(app: Locator) {
  return JSON.parse((await app.getByTestId('c11-last-move').textContent()) ?? 'null')
}

test('@C11 default SDK rows retain ARIA, keyboard focus and real selection is cleared on restore', async ({
  page,
}) => {
  const app = await open(page, 'basic')
  await expect(app.getByTestId('c11-count')).toHaveText('7')
  await expect(app.getByRole('tree', { name: '订阅目录树', exact: true })).toBeVisible()
  await expect(app.getByRole('treeitem')).toHaveCount(7)
  await node(app, 'feed-react').click()
  await expect(row(app, 'feed-react')).toHaveAttribute('aria-selected', 'true')
  await expect(app.getByTestId('c11-selection')).toHaveText('["feed-react"]')
  await page.keyboard.press('ArrowDown')
  await expect(row(app, 'feed-vite')).toBeFocused()
  await page.keyboard.press('Space')
  await expect(row(app, 'feed-vite')).toHaveAttribute('aria-selected', 'true')
  await app.getByRole('button', { name: '折叠 技术', exact: true }).click()
  await expect(row(app, 'grp-tech')).toHaveAttribute('aria-expanded', 'false')
  await expect(node(app, 'feed-react')).toHaveCount(0)
  await expect.poll(async () => (await model(app)).visibleNodes).toBe(5)
  await app.getByRole('button', { name: '展开 技术', exact: true }).click()
  await expect(node(app, 'feed-react')).toBeVisible()
  await app.getByRole('button', { name: '恢复示例树', exact: true }).click()
  await expect(app.locator('[role="treeitem"][aria-selected="true"]')).toHaveCount(0)
  await expect(app.getByTestId('c11-selection')).toHaveText('[]')
  await expect.poll(async () => (await model(app)).selectedIds).toEqual([])
})

test('@C11 real HTML5 drop and separate keyboard fallback share the move contract; rename IME and delete preserve IDs', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const app = await open(page, 'business')
  // Native browser drag/drop through the actual react-dnd HTML5 backend; no event/API mocks.
  await node(app, 'feed-react').dragTo(node(app, 'grp-business'), {
    targetPosition: { x: 90, y: 17 },
  })
  await expect.poll(async () => (await move(app))?.source).toBe('sdk')
  expect((await move(app)).parentId).toBe('grp-business')
  expect((await topology(app)).find((group) => group.id === 'grp-business')?.firstIds).toContain(
    'feed-react',
  )
  await expect(app.getByTestId('c11-count')).toHaveText('7')
  await app.getByRole('button', { name: '恢复示例树', exact: true }).click()
  await node(app, 'feed-react').click()
  const down = app.getByRole('button', { name: '同组下移一位', exact: true })
  await down.focus()
  await page.keyboard.press('Enter')
  await expect
    .poll(async () => (await topology(app))[0].firstIds)
    .toEqual(['feed-vite', 'feed-react'])
  expect((await move(app)).source).toBe('button')
  expect((await move(app)).index).toBe(2) // pre-removal slot, helper corrects to final index 1.
  await app.getByRole('button', { name: '移到商业分组', exact: true }).click()
  expect((await move(app)).source).toBe('button')
  await expect
    .poll(async () => (await topology(app)).find((group) => group.id === 'grp-business')?.firstIds)
    .toContain('feed-react')
  await app.getByRole('button', { name: '重命名所选', exact: true }).click()
  let editor = app.getByRole('textbox', { name: '重命名 React 官方博客', exact: true })
  await expect(editor).toBeFocused()
  await editor.fill('新订阅')
  await editor.dispatchEvent('compositionstart')
  await page.keyboard.down('Enter')
  await editor.dispatchEvent('compositionend', { data: '新订阅' })
  await page.keyboard.up('Enter')
  await expect(editor).toBeVisible() // candidate confirmation must not submit the name.
  await page.keyboard.press('Enter')
  await expect(editor).toHaveCount(0)
  await expect(node(app, 'feed-react')).toContainText('新订阅')
  await expect(row(app, 'feed-react')).toBeFocused()
  await app.getByRole('button', { name: '重命名所选', exact: true }).click()
  editor = app.getByRole('textbox', { name: '重命名 新订阅', exact: true })
  await editor.dispatchEvent('compositionstart')
  await editor.fill('鼠标确认后的订阅')
  await editor.dispatchEvent('compositionend', { data: '鼠标确认后的订阅' })
  await page.keyboard.press('Enter') // no confirmation Enter/keyup occurred.
  await expect(editor).toHaveCount(0)
  await expect(node(app, 'feed-react')).toContainText('鼠标确认后的订阅')
  await app.getByRole('button', { name: '重命名所选', exact: true }).click()
  editor = app.getByRole('textbox', { name: '重命名 鼠标确认后的订阅', exact: true })
  await editor.fill('取消的名称')
  await editor.press('Escape')
  await expect(editor).toHaveCount(0)
  await expect(node(app, 'feed-react')).toContainText('鼠标确认后的订阅')
  await row(app, 'feed-react').focus()
  await page.keyboard.press('Backspace') // real SDK keyboard -> onDelete -> shared business pruning.
  await expect(node(app, 'feed-react')).toHaveCount(0)
  await expect(app.getByTestId('c11-count')).toHaveText('6')
  await expect(app.getByTestId('c11-selection')).toHaveText('[]')
  await expect(row(app, 'grp-tech')).toBeFocused()
  expect(errors).toEqual([])
})

test('@C11 1807-node model uses a small real DOM, name search/IME, native deep scroll, resize and unmount', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const app = await open(page, 'advanced')
  await expect(app.getByTestId('c11-count')).toHaveText('1807')
  expect((await model(app)).visibleNodes).toBe(1807)
  expect(await app.getByRole('treeitem').count()).toBeGreaterThan(0)
  expect(await app.getByRole('treeitem').count()).toBeLessThan(40)
  const scroll = app.getByRole('tree').locator(':scope > div').first()
  await scroll.scrollIntoViewIfNeeded()
  await scroll.hover()
  await page.mouse.wheel(0, 1100)
  await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
  await app.getByRole('button', { name: '定位最后技术源', exact: true }).click()
  await expect(node(app, 'bulk-1799')).toBeInViewport()
  expect(await app.getByRole('treeitem').count()).toBeLessThan(40)
  const search = app.getByRole('textbox', { name: '节点搜索', exact: true })
  await search.fill('bulk-1799') // ID is not a name: matching must remain empty.
  await expect.poll(async () => (await model(app)).filteredMatches).toBe(0)
  await expect(app.getByRole('treeitem')).toHaveCount(0)
  await expect(app.getByRole('button', { name: '定位最后技术源', exact: true })).toBeDisabled()
  await search.fill('官方')
  await expect.poll(async () => (await model(app)).filteredMatches).toBe(2)
  await expect(app.getByRole('treeitem')).toHaveCount(3) // tech ancestor + two actual matches.
  await node(app, 'feed-react').click()
  await expect(app.getByRole('button', { name: '移到商业分组', exact: true })).toBeDisabled()
  await search.dispatchEvent('compositionstart')
  await search.fill('技术源 1800')
  await expect(app.getByTestId('c11-search')).toHaveText('官方')
  await search.dispatchEvent('compositionend', { data: '技术源 1800' })
  await expect(app.getByTestId('c11-search')).toHaveText('技术源 1800')
  await expect.poll(async () => (await model(app)).filteredMatches).toBe(1)
  await expect(node(app, 'bulk-1799')).toBeVisible()
  await app.getByRole('button', { name: '恢复示例树', exact: true }).click()
  await expect(app.getByTestId('c11-count')).toHaveText('1807')
  await expect.poll(async () => (await model(app)).visibleNodes).toBe(1807)
  await expect(app.getByTestId('c11-selection')).toHaveText('[]')
  await page.setViewportSize({ width: 390, height: 1050 })
  const bounds = await app.getByTestId('c11-tree').boundingBox()
  if (!bounds) throw new Error('Missing actual tree viewport')
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(391)
  const held = await app.getByRole('tree').elementHandle()
  if (!held) throw new Error('Missing actual tree before unmount')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  expect(await held.evaluate((element) => element.isConnected)).toBe(false)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(app.getByTestId('c11-count')).toHaveText('1807')
  await expect(app.getByTestId('c11-selection')).toHaveText('[]')
  expect(errors).toEqual([])
})
