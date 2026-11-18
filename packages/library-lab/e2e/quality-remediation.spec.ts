import { expect, test } from '@playwright/test'

// Real SDK interactions through the current production Lab; no renderer mocks.
test('@E05 editing and undo operate on the real Monaco model', async ({ page }) => {
  await page.goto('/libraries/monaco-editor?tab=demo&example=basic')
  await expect(page.getByTestId('monaco-editor-root').locator('.monaco-editor')).toBeVisible()
  const text = page.getByTestId('monaco-model-text')
  const initial = await text.textContent()
  await page.getByRole('button', { name: '插入问候调用', exact: true }).click()
  await expect(text).toContainText("console.log(greet('Ada'))")
  await page.getByRole('button', { name: '撤销', exact: true }).click()
  await expect(text).toHaveText(initial ?? '')
})

test('@E05 explicitly saved session draft survives reload and can be cleared', async ({ page }) => {
  await page.goto('/libraries/monaco-editor?tab=demo&example=business')
  const root = page.getByTestId('monaco-editor-root')
  await expect(root.locator('.monaco-editor')).toBeVisible()
  const editor = page.getByRole('textbox', { name: 'Monaco TypeScript 编辑区域', exact: true })
  await editor.press('ControlOrMeta+End')
  await editor.press('End')
  await editor.press('Enter')
  await editor.pressSequentially('// persisted draft')
  await page.getByRole('button', { name: '保存本地草稿', exact: true }).click()
  await expect(page.getByTestId('monaco-saved-draft')).toContainText('// persisted draft')
  await page.reload()
  await expect(root.locator('.monaco-editor')).toBeVisible()
  await expect(page.getByTestId('monaco-model-text')).not.toContainText('// persisted draft')
  await page.getByRole('button', { name: '恢复本地草稿', exact: true }).click()
  await expect(page.getByTestId('monaco-model-text')).toContainText('// persisted draft')
  await page.getByRole('button', { name: '清除本例草稿', exact: true }).click()
  expect(
    await page.evaluate(() => sessionStorage.getItem('reactloom-library:e05:typescript-draft:v1')),
  ).toBeNull()
})

test('@E05 JSON worker reports real markers, clears them after repair and releases its lease', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/libraries/monaco-editor?tab=demo&example=advanced')
  const root = page.getByTestId('monaco-editor-root')
  await expect(root.locator('.monaco-editor')).toBeVisible()
  await expect.poll(() => page.workers().length).toBeGreaterThan(0)
  const diagnostics = page.getByRole('region', { name: 'JSON 诊断结果' })
  await expect(diagnostics).toContainText(/第 \d+ 行，第 \d+ 列/u, { timeout: 20_000 })
  await page.getByRole('button', { name: '载入合法 JSON', exact: true }).click()
  await expect(page.getByTestId('monaco-diagnostics')).toHaveText(/^0 个 Monaco 诊断标记/u, {
    timeout: 20_000,
  })
  const editor = page.getByRole('textbox', { name: 'Monaco JSON 编辑区域', exact: true })
  await editor.press('ControlOrMeta+End')
  await editor.press('Space')
  await expect(page.getByTestId('monaco-diagnostics')).not.toContainText('等待')
  await page.getByRole('button', { name: '撤销', exact: true }).click()
  await page.getByRole('button', { name: '撤销', exact: true }).click()
  await expect(diagnostics).toContainText(/第 \d+ 行，第 \d+ 列/u, { timeout: 20_000 })
  await page.getByRole('tab', { name: '详细文档', exact: true }).click()
  await expect(root).toHaveCount(0)
  await expect
    .poll(() => page.evaluate(() => Object.hasOwn(globalThis, 'MonacoEnvironment')))
    .toBe(false)
  expect(errors).toEqual([])
})

test('@E11 cumulative deltas render incomplete syntax and finish with real Markdown', async ({
  page,
}) => {
  await page.goto('/libraries/streamdown?tab=demo&example=basic')
  const workshop = page.getByTestId('e11-workshop')
  await expect(workshop).toHaveAttribute('data-state', 'ready')
  const step = page.getByRole('button', { name: '追加下一段', exact: true })
  await step.click()
  await expect(page.getByTestId('e11-progress')).toHaveAttribute('value', '1')
  await step.click()
  const emphasis = page.getByTestId('e11-rendered').locator('[data-streamdown="strong"]')
  await expect(emphasis).toContainText('流式')
  const partial = await page.getByTestId('e11-markdown-source').textContent()
  await page.getByRole('checkbox', { name: '修复未闭合语法' }).uncheck()
  await expect(emphasis).toHaveCount(0)
  await expect(page.getByTestId('e11-markdown-source')).toHaveText(partial ?? '')
  await page.getByRole('checkbox', { name: '修复未闭合语法' }).check()
  for (let n = 0; n < 30 && !(await step.isDisabled()); n++) await step.click()
  await expect(workshop).toHaveAttribute('data-state', 'completed')
  await expect(
    page.getByTestId('e11-rendered').locator('[data-streamdown="strong"]'),
  ).not.toHaveCount(0)
  await page.getByRole('button', { name: '重置', exact: true }).click()
  await expect(workshop).toHaveAttribute('data-state', 'ready')
})

test('@E11 automatic input pauses, ends, and remounts without its old timer', async ({ page }) => {
  await page.clock.install()
  await page.goto('/libraries/streamdown?tab=demo&example=basic')
  const workshop = page.getByTestId('e11-workshop')
  await expect(workshop).toHaveAttribute('data-state', 'ready')
  await page.getByRole('button', { name: '开始自动追加', exact: true }).click()
  await page.clock.runFor(800)
  await page.getByRole('button', { name: '暂停', exact: true }).click()
  await expect(workshop).toHaveAttribute('data-state', 'paused')
  const source = await page.getByTestId('e11-markdown-source').textContent()
  await page.clock.runFor(2000)
  await expect(page.getByTestId('e11-markdown-source')).toHaveText(source ?? '')
  await page.getByRole('button', { name: '继续自动追加', exact: true }).click()
  await page.getByRole('button', { name: '提前结束', exact: true }).click()
  await expect(workshop).toHaveAttribute('data-state', 'ended')
  const ended = await page.getByTestId('e11-markdown-source').textContent()
  await page.clock.runFor(2000)
  await expect(page.getByTestId('e11-markdown-source')).toHaveText(ended ?? '')
  await page.getByRole('button', { name: '重置', exact: true }).click()
  await page.getByRole('button', { name: '开始自动追加', exact: true }).click()
  await page.getByRole('tab', { name: '详细文档', exact: true }).click()
  await expect(workshop).toHaveCount(0)
  await page.clock.runFor(2000)
  await page.getByRole('tab', { name: '实战 Demo', exact: true }).click()
  await expect(workshop).toHaveAttribute('data-state', 'ready')
})

test('@E11 business output uses GFM and blocks fixture scripts and unknown resources', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/libraries/streamdown?tab=demo&example=business')
  const step = page.getByRole('button', { name: '追加下一段', exact: true })
  await expect(step).toBeEnabled()
  for (let n = 0; n < 40 && !(await step.isDisabled()); n++) await step.click()
  const rendered = page.getByTestId('e11-rendered')
  await expect(rendered.getByRole('table').getByRole('row')).toHaveCount(3)
  await expect(rendered.getByRole('checkbox')).toHaveCount(2)
  await expect(rendered.getByRole('checkbox').first()).toBeDisabled()
  await expect(rendered.locator('script, img, a[href^="javascript:"]')).toHaveCount(0)
  await expect(rendered.locator('a[href="https://streamdown.ai/docs"]')).toHaveCount(1)
  expect(errors).toEqual([])
})

test('@E11 leaving a playing demo clears the actual owned interval', async ({ page }) => {
  await page.addInitScript(() => {
    const active = new Set<number>()
    const start = window.setInterval.bind(window)
    const stop = window.clearInterval.bind(window)
    Object.defineProperty(window, 'setInterval', {
      value: (handler: TimerHandler, delay?: number, ...args: unknown[]) => {
        const id = start(handler, delay, ...args)
        if (delay === 700) active.add(id)
        return id
      },
    })
    Object.defineProperty(window, 'clearInterval', {
      value: (id?: number) => {
        active.delete(Number(id))
        stop(id)
      },
    })
    Object.defineProperty(window, '__e11ActiveIntervals', { get: () => active.size })
  })
  await page.goto('/libraries/streamdown?tab=demo&example=basic')
  await page.getByRole('button', { name: '开始自动追加', exact: true }).click()
  const count = () => page.evaluate(() => Reflect.get(window, '__e11ActiveIntervals'))
  await expect.poll(count).toBe(1)
  await page.getByRole('tab', { name: '详细文档', exact: true }).click()
  await expect.poll(count).toBe(0)
  await page.getByRole('tab', { name: '实战 Demo', exact: true }).click()
  await expect(page.getByTestId('e11-workshop')).toHaveAttribute('data-state', 'ready')
  await expect.poll(count).toBe(0)
})

for (const [entryId, slug, root] of [
  ['E05', 'monaco-editor', 'monaco-editor-root'],
  ['E11', 'streamdown', 'e11-workshop'],
]) {
  test(`@${entryId} the actual demo fits a narrow viewport`, async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/libraries/${slug}?tab=demo`)
    await expect(page.getByTestId(root)).toBeVisible()
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      .toBe(true)
    await page.screenshot({ path: info.outputPath(`${entryId}-mobile.png`), fullPage: true })
  })
}

for (const [entryId, slug] of [
  ['E05', 'monaco-editor'],
  ['E11', 'streamdown'],
  ['F05', 'sheetjs'],
]) {
  test(`@${entryId} official original loads with a pinned upstream exit`, async ({ page }) => {
    await page.goto(`/libraries/${slug}?tab=readme`)
    await expect(page.getByRole('heading', { name: '官方 README 原文', exact: true })).toBeVisible()
    await expect(page.locator('.prose')).not.toBeEmpty()
    await expect(page.getByRole('link', { name: '打开上游原文' })).toHaveAttribute(
      'href',
      /\/[a-f0-9]{40}\//u,
    )
    await expect(page.getByRole('alert')).toHaveCount(0)
  })
}
