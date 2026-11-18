// NOT_RUN: root adopts for a matching shared build. Real MUI/DOM/keyboard; no SDK mocks.
import { expect, type Locator, type Page, test } from '@playwright/test'

type History = {
  rows: { id: string; title: string; endpoint: string; enabled: boolean }[]
  before: unknown
  nextId: number
}
async function history(app: Locator): Promise<History> {
  return JSON.parse((await app.getByTestId('b07-history').textContent()) ?? '{}')
}
async function open(page: Page, level: 'basic' | 'business' | 'advanced') {
  await page.setViewportSize({ width: 1280, height: 1600 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  // Native client navigation creates an actual prior basic entry for the modal-unmount case.
  await page.goto('/libraries/mui?tab=demo&example=basic')
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  if (await run.isVisible()) await run.click()
  if (level !== 'basic')
    await page.getByRole('combobox', { name: '学习场景', exact: true }).selectOption(level)
  const app = page.getByTestId('b07-workshop')
  await expect(app).toBeVisible()
  return app
}

test('@B07 local theme uses actual context and DOM while controlled input retains its value', async ({
  page,
}) => {
  const app = await open(page, 'basic')
  const input = app.getByRole('textbox', { name: '工作区名称', exact: true })
  await expect(input).toHaveAttribute('maxlength', '60')
  await input.fill('')
  await expect(app.getByText('请输入名称', { exact: true })).toBeVisible()
  await input.fill('  测试工作区  ')
  await expect(app.getByTestId('b07-name')).toContainText('有效名称：测试工作区')
  await app.getByText('查看实际主题', { exact: true }).click()
  const theme = async () =>
    JSON.parse((await app.getByTestId('b07-theme-state').textContent()) ?? '{}') as {
      mode: string
      paper: string
      spacing2: string
      borderRadius: number
    }
  expect(await theme()).toMatchObject({ mode: 'light', spacing2: '16px', borderRadius: 10 })
  const bodyBefore = await page.locator('body').evaluate((node) => ({
    background: getComputedStyle(node).backgroundColor,
    color: getComputedStyle(node).color,
  }))
  const paperBefore = await app
    .getByTestId('b07-preview')
    .evaluate((node) => getComputedStyle(node).backgroundColor)
  const mode = app.getByRole('switch', { name: '仅本例深色主题', exact: true })
  await mode.check()
  await expect.poll(async () => (await theme()).mode).toBe('dark')
  await expect
    .poll(() =>
      app.getByTestId('b07-preview').evaluate((node) => getComputedStyle(node).backgroundColor),
    )
    .not.toBe(paperBefore)
  expect(
    await page.locator('body').evaluate((node) => ({
      background: getComputedStyle(node).backgroundColor,
      color: getComputedStyle(node).color,
    })),
  ).toEqual(bodyBefore)
  await expect(input).toHaveValue('  测试工作区  ')
  await mode.uncheck()
  await expect.poll(async () => (await theme()).mode).toBe('light')
})

test('@B07 native table switches, one-step history, notice independence and filter empty state', async ({
  page,
}) => {
  const app = await open(page, 'business')
  await expect(app.getByRole('table', { name: 'RSS 订阅状态表', exact: true })).toBeVisible()
  await expect(app.locator('[data-testid^="b07-row-"]')).toHaveCount(3)
  const first = app.getByRole('switch', { name: '工程实践 订阅状态', exact: true })
  const second = app.getByRole('switch', { name: '设计系统 订阅状态', exact: true })
  const undo = app.getByRole('button', { name: '撤销', exact: true })
  await expect(first).toBeChecked()
  await expect(second).toBeChecked()
  await expect(undo).toBeDisabled()
  await first.uncheck()
  await expect(app.getByTestId('b07-row-s-1')).toContainText('暂停')
  const changed = await history(app)
  await page.getByRole('button', { name: '关闭通知', exact: true }).click()
  expect(await history(app)).toEqual(changed)
  await undo.click()
  await expect(first).toBeChecked()
  await expect(undo).toBeDisabled()
  await first.uncheck()
  await second.uncheck()
  await undo.click()
  await expect(first).not.toBeChecked()
  await expect(second).toBeChecked()
  await expect(undo).toBeDisabled()
  const beforeFilter = await history(app)
  const search = app.getByRole('textbox', { name: '搜索订阅', exact: true })
  await search.fill('NO_MATCH_178')
  await expect(app.getByTestId('b07-empty')).toBeVisible()
  await expect(app.getByTestId('b07-count')).toContainText('0 / 3')
  await search.fill('')
  await expect(app.locator('[data-testid^="b07-row-"]')).toHaveCount(3)
  expect(await history(app)).toEqual(beforeFilter)
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  await expect(page.locator('.MuiSnackbar-root')).toHaveCount(0)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(first).toBeChecked()
  await expect(undo).toBeDisabled()
})

test('@B07 real Dialog portal, form recovery, one-shot conflict, mobile and open-modal unmount', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const app = await open(page, 'advanced')
  const add = app.getByRole('button', { name: '新增订阅', exact: true })
  const dialog = page.getByRole('dialog', { name: '添加 RSS 订阅', exact: true })
  await add.click()
  const name = dialog.getByRole('textbox', { name: '订阅名称', exact: true })
  const url = dialog.getByRole('textbox', { name: 'HTTPS 地址', exact: true })
  await expect(name).toBeFocused()
  expect(
    await dialog.evaluate(
      (node) =>
        document.body.contains(node) &&
        !document.querySelector('[data-testid="b07-workshop"]')?.contains(node),
    ),
  ).toBe(true)
  expect(
    await dialog.evaluate((node) => {
      const title = node.getAttribute('aria-labelledby')
      const description = node.getAttribute('aria-describedby')
      return Boolean(
        title &&
          description &&
          title !== description &&
          document.getElementById(title)?.textContent?.includes('添加 RSS 订阅') &&
          document.getElementById(description)?.textContent?.includes('草稿与列表分离'),
      )
    }),
  ).toBe(true)
  for (let index = 0; index < 7; index++) {
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true)
  }
  await name.press('Enter')
  await expect(dialog.getByRole('alert')).toContainText('请修正')
  await expect(name).toHaveAttribute('aria-invalid', 'true')
  await expect(url).toHaveAttribute('aria-invalid', 'true')
  await expect(name).toBeFocused()
  await name.fill('前端动态')
  await url.fill('http://example.org/front.xml')
  await dialog.getByRole('button', { name: '保存本地记录', exact: true }).click()
  await expect(url).toBeFocused()
  await expect(dialog.getByText('请输入完整HTTPS订阅地址', { exact: true })).toBeVisible()
  expect((await history(app)).rows).toHaveLength(3)
  await url.fill('https://example.org/front.xml')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(add).toBeFocused()
  await add.click()
  await expect(name).toHaveValue('前端动态')
  await expect(url).toHaveValue('https://example.org/front.xml')
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await dialog.getByRole('button', { name: '取消', exact: true }).click()
  await app.getByRole('button', { name: '下一次保存注入409', exact: true }).click()
  await dialog.getByRole('button', { name: '保存本地记录', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('模拟409')
  await expect(name).toHaveValue('前端动态')
  await expect(url).toHaveValue('https://example.org/front.xml')
  expect((await history(app)).rows).toHaveLength(3)
  expect((await history(app)).nextId).toBe(1)
  await dialog.getByRole('button', { name: '保存本地记录', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(app.getByTestId('b07-row-local-1')).toContainText('前端动态')
  await expect(app.getByRole('button', { name: '下一次保存注入409', exact: true })).toBeFocused()
  const saved = await history(app)
  expect(saved.rows).toHaveLength(4)
  await page.getByRole('button', { name: '关闭通知', exact: true }).click()
  expect(await history(app)).toEqual(saved)
  await app.getByRole('button', { name: '撤销', exact: true }).click()
  await expect(app.getByTestId('b07-row-local-1')).toHaveCount(0)
  expect((await history(app)).nextId).toBe(2)
  await page.setViewportSize({ width: 390, height: 844 })
  const body = await page.locator('body').elementHandle()
  if (!body) throw new Error('Missing actual document body')
  const overflow = await body.evaluate((node) => node.style.overflow)
  await add.click()
  const box = await dialog.boundingBox()
  if (!box) throw new Error('Missing real dialog layout')
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(391)
  const heldDialog = await dialog.elementHandle()
  if (!heldDialog) throw new Error('Missing actual portal dialog')
  // Actual browser Back to prior basic scenario, while the modal blocks host controls.
  // No force-clicking the inert/aria-hidden host, document reload or mocked SDK cleanup.
  await page.goBack()
  await expect(app.getByRole('heading', { name: '局部主题与受控输入', exact: true })).toBeVisible()
  await expect(page.locator('.MuiDialog-root,.MuiBackdrop-root')).toHaveCount(0)
  expect(await heldDialog.evaluate((node) => node.isConnected)).toBe(false)
  expect(await body.evaluate((node) => node.isConnected)).toBe(true)
  expect(await body.evaluate((node) => node.style.overflow)).toBe(overflow)
  expect(errors).toEqual([])
})

// Remaining NOT_RUN: broader screen-reader matrix, full SSR Emotion/media hydration and
// exact Snackbar native blur/hover timing. Above uses explicit close and real unmount;
// no timeout mock or synthetic lifecycle event is counted as SDK runtime proof.
