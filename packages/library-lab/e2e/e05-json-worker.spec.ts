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
  await expect
    .poll(() => page.workers().some((worker) => /json\.worker/iu.test(worker.url())), {
      timeout: 20_000,
    })
    .toBe(true)

  await editor.click()
  await page.keyboard.press('ControlOrMeta+A')
  // A JSON primitive avoids Monaco's paired-quote/bracket auto-insertion
  // affecting a synthetic insertText operation in the browser harness.
  await page.keyboard.insertText('true')
  await expect(status).toContainText('当前 4 字符')
  await expect(status).toContainText('0 个 Monaco 诊断标记', { timeout: 20_000 })

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

// Inject a synchronous observer failure after Monaco allocated its real model
// and editor. This exercises the partial-initialization cleanup path, not a
// mocked SDK. A failed first mount must not poison the next worker lease.
test('@E05 failed ResizeObserver setup disposes the editor and permits a clean remount', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => {
    const host = globalThis as typeof globalThis & {
      __e05NativeObserver?: typeof ResizeObserver
      __e05InjectedFailures?: number
    }
    const NativeObserver = globalThis.ResizeObserver
    host.__e05NativeObserver = NativeObserver
    globalThis.ResizeObserver = class extends NativeObserver {
      observe(target: Element, options?: ResizeObserverOptions): void {
        if (target instanceof HTMLElement && target.dataset.testid === 'monaco-editor-root') {
          host.__e05InjectedFailures = (host.__e05InjectedFailures ?? 0) + 1
          throw new Error('E05_INJECTED_OBSERVER_FAILURE')
        }
        super.observe(target, options)
      }
    }
  })

  await page.goto('/libraries/monaco-editor?tab=demo&example=advanced')
  await page.getByRole('button', { name: '运行当前示例' }).click()
  const region = page.getByRole('region', { name: 'Monaco Editor 真实运行示例' })
  await expect(region).toContainText(
    '编辑器创建、监听或布局初始化失败：Error: E05_INJECTED_OBSERVER_FAILURE',
    { timeout: 20_000 },
  )
  expect(
    await page.evaluate(
      () =>
        (globalThis as typeof globalThis & { __e05InjectedFailures?: number })
          .__e05InjectedFailures,
    ),
  ).toBeGreaterThan(0)
  // The React host remains mounted, so DOM removal alone cannot pass this check.
  await expect(region.locator('.monaco-editor')).toHaveCount(0)
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (globalThis as typeof globalThis & { MonacoEnvironment?: unknown }).MonacoEnvironment ===
          undefined,
      ),
    )
    .toBe(true)

  await page.evaluate(() => {
    const native = (
      globalThis as typeof globalThis & {
        __e05NativeObserver?: typeof ResizeObserver
      }
    ).__e05NativeObserver
    if (!native) throw new Error('Missing original ResizeObserver')
    globalThis.ResizeObserver = native
  })
  await page.getByRole('button', { name: '停止并卸载' }).click()
  await page.getByRole('button', { name: '运行当前示例' }).click()
  await expect(region.locator('.monaco-editor')).toBeVisible({ timeout: 20_000 })
  await expect(region.getByRole('status')).toContainText(/[1-9][0-9]* 个 Monaco 诊断标记/u, {
    timeout: 20_000,
  })
  await expect
    .poll(() => page.workers().some((worker) => /json\.worker/iu.test(worker.url())))
    .toBe(true)
  expect(errors).toEqual([])
})

// This is a real Chromium Worker lifecycle assertion, not an inference from
// editor DOM or the MonacoEnvironment lease. Monaco's JSON language manager
// may cache its worker after model disposal; advance the *page clock* beyond
// its idle-check budget and observe the actual Worker being destroyed.
test('@E05 idle JSON language worker eventually terminates and starts anew', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.clock.install()
  await page.goto('/libraries/monaco-editor?tab=demo&example=advanced')
  await page.getByRole('button', { name: '运行当前示例' }).click()

  const region = page.getByRole('region', { name: 'Monaco Editor 真实运行示例' })
  await expect(region.getByRole('status')).toContainText(/[1-9][0-9]* 个 Monaco 诊断标记/u, {
    timeout: 20_000,
  })
  const firstWorker = page.workers().find((worker) => /json\.worker/iu.test(worker.url()))
  if (!firstWorker) throw new Error('Real Monaco JSON Worker did not start')

  await page.getByRole('button', { name: '停止并卸载' }).click()
  await expect(region).toHaveCount(0)
  // runFor fires each scheduled idle check, whereas fastForward invokes
  // overdue intervals at most once. The Worker must exit without an artificial
  // terminate() call or a real three-minute sleep.
  await page.clock.runFor(180_000)
  await expect.poll(() => page.workers().includes(firstWorker), { timeout: 15_000 }).toBe(false)

  await page.getByRole('button', { name: '运行当前示例' }).click()
  await expect(region.locator('.monaco-editor')).toBeVisible({ timeout: 20_000 })
  await expect(region.getByRole('status')).toContainText(/[1-9][0-9]* 个 Monaco 诊断标记/u, {
    timeout: 20_000,
  })
  await expect
    .poll(() => page.workers().some((worker) => /json\.worker/iu.test(worker.url())), {
      timeout: 20_000,
    })
    .toBe(true)
  expect(page.workers()).not.toContain(firstWorker)
  expect(errors).toEqual([])
})
