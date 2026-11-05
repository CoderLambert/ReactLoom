import { expect, test } from '@playwright/test'

// The production preview must load the pinned Monaco JSON language service, not a
// textarea imitation or a silently failing Worker/main-thread fallback.
test('@E05 real JSON language worker validates edits across stop and remount', async ({ page }) => {
  const errors: string[] = []
  const workerFallbacks: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (/could not create web worker|falling back to loading web worker/iu.test(message.text()))
      workerFallbacks.push(message.text())
  })

  await page.goto('/libraries/monaco-editor?tab=demo&example=advanced')
  await page.getByRole('button', { name: '运行当前示例' }).click()
  const region = page.getByRole('region', { name: 'Monaco Editor 真实运行示例' })
  const editor = page.getByTestId('monaco-editor-root').locator('.monaco-editor')
  const status = region.getByRole('status')
  await expect(editor).toBeVisible({ timeout: 20_000 })

  // The intentionally invalid JSON is diagnosed asynchronously by the actual
  // language service. A rendered editor alone does not prove worker readiness.
  await expect(status).toContainText(/[1-9][0-9]* 个 Monaco 诊断标记/u, {
    timeout: 20_000,
  })
  await expect.poll(() => page.workers().some((worker) => /json\.worker/iu.test(worker.url())), {
    timeout: 20_000,
  }).toBe(true)

  await editor.click()
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.insertText('{"name":"ReactLoom"}')
  await expect(status).toContainText('0 个 Monaco 诊断标记', { timeout: 20_000 })
  await expect(status).toContainText('当前 20 字符')

  // Stop must release the editor and the Lab-owned MonacoEnvironment lease.
  // Monaco can keep an idle language worker cached: its immediate termination
  // is intentionally NOT asserted or counted as verified.
  await page.getByRole('button', { name: '停止并卸载' }).click()
  await expect(region).toHaveCount(0)
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (globalThis as typeof globalThis & { MonacoEnvironment?: unknown }).MonacoEnvironment ===
          undefined,
      ),
    )
    .toBe(true)

  await page.getByRole('button', { name: '运行当前示例' }).click()
  await expect(page.getByTestId('monaco-editor-root').locator('.monaco-editor')).toBeVisible({
    timeout: 20_000,
  })
  await expect(
    page.getByRole('region', { name: 'Monaco Editor 真实运行示例' }).getByRole('status'),
  ).toContainText(/[1-9][0-9]* 个 Monaco 诊断标记/u, { timeout: 20_000 })
  expect(workerFallbacks).toEqual([])
  expect(errors).toEqual([])
})
