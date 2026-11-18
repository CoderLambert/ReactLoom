// NOT_RUN. Root integrates against a matching shared build. Actual SDK, DOM, keyboard and listeners.
// Native listener instrumentation observes add/remove identity; it never replaces an SDK callback or result.
import { expect, type Locator, type Page, test } from '@playwright/test'

declare global {
  interface Window {
    __c06CountInputListeners: (node: EventTarget) => number
  }
}
type Snapshot = {
  value: string
  unmaskedValue: string
  typedValue: string | number
  isComplete: boolean
}
async function observeOwnedInputListeners(page: Page) {
  await page.addInitScript(() => {
    const watched = new Set([
      'keydown',
      'input',
      'beforeinput',
      'compositionend',
      'drop',
      'click',
      'focus',
      'blur',
    ])
    type Entry = { type: string; callback: EventListenerOrEventListenerObject; capture: boolean }
    const entries = new WeakMap<EventTarget, Entry[]>()
    const originalAdd = EventTarget.prototype.addEventListener
    const originalRemove = EventTarget.prototype.removeEventListener
    const capture = (options?: boolean | AddEventListenerOptions) =>
      typeof options === 'boolean' ? options : (options?.capture ?? false)
    Object.defineProperty(EventTarget.prototype, 'addEventListener', {
      configurable: true,
      writable: true,
      value: function (
        this: EventTarget,
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: boolean | AddEventListenerOptions,
      ) {
        Reflect.apply(originalAdd, this, [type, callback, options])
        if (!(this instanceof HTMLInputElement) || !watched.has(type) || !callback) return
        const list = entries.get(this) ?? []
        if (
          !list.some(
            (entry) =>
              entry.type === type &&
              entry.callback === callback &&
              entry.capture === capture(options),
          )
        ) {
          list.push({ type, callback, capture: capture(options) })
          entries.set(this, list)
        }
      },
    })
    Object.defineProperty(EventTarget.prototype, 'removeEventListener', {
      configurable: true,
      writable: true,
      value: function (
        this: EventTarget,
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: boolean | EventListenerOptions,
      ) {
        Reflect.apply(originalRemove, this, [type, callback, options])
        entries.set(
          this,
          (entries.get(this) ?? []).filter(
            (entry) =>
              !(
                entry.type === type &&
                entry.callback === callback &&
                entry.capture === capture(options)
              ),
          ),
        )
      },
    })
    window.__c06CountInputListeners = (node) => (entries.get(node) ?? []).length
  })
}
async function open(page: Page, level: 'basic' | 'business' | 'advanced') {
  await observeOwnedInputListeners(page)
  await page.setViewportSize({ width: 1280, height: 1100 })
  await page.goto(`/libraries/imask?tab=demo&example=${level}`)
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  const app = page.getByTestId('c06-workshop')
  await expect(app.or(run).first()).toBeVisible({ timeout: 20_000 })
  if (await run.isVisible()) await run.click()
  await expect(app).toHaveAttribute('data-level', level)
  await expect(app.getByTestId('c06-snapshot')).toHaveText('null')
  return app
}
async function snapshot(app: Locator): Promise<Snapshot | null> {
  return JSON.parse((await app.getByTestId('c06-snapshot').textContent()) ?? 'null')
}
async function listeners(input: Locator) {
  return input.evaluate((node) => window.__c06CountInputListeners(node))
}

test('@C06 actual Pattern values, completion, middle edits and explicit reset preserve ownership', async ({
  page,
}) => {
  const app = await open(page, 'basic')
  const input = app.getByRole('textbox', { name: '编号', exact: true })
  await expect(input).toHaveAttribute('type', 'text')
  await expect.poll(() => listeners(input)).toBeGreaterThanOrEqual(8)
  const held = await input.elementHandle()
  if (!held) throw new Error('Missing actual masked input')
  await input.pressSequentially('12345678')
  await expect(input).toHaveValue('1234-5678')
  await expect(app.getByTestId('imask-value')).toHaveText('12345678')
  expect(await snapshot(app)).toEqual({
    value: '1234-5678',
    unmaskedValue: '12345678',
    typedValue: '12345678',
    isComplete: true,
  })
  await expect(app.getByTestId('c06-events')).toHaveText(/onComplete [1-9]\d* 次/)
  await input.evaluate((node) => {
    if (!(node instanceof HTMLInputElement)) throw new Error('Expected actual input')
    node.setSelectionRange(3, 3)
  })
  await page.keyboard.press('Backspace')
  await expect(input).toHaveValue('1245-678')
  await expect(app.getByTestId('imask-value')).toHaveText('1245678')
  expect((await snapshot(app))?.isComplete).toBe(false)
  expect(
    await input.evaluate((node) => (node instanceof HTMLInputElement ? node.selectionStart : null)),
  ).toBe(2)
  await input.pressSequentially('9')
  await expect(input).toHaveValue('1294-5678')
  await expect(app.getByTestId('imask-value')).toHaveText('12945678')
  expect(await held.evaluate((node) => node.isConnected)).toBe(true)
  await app.getByRole('button', { name: '重置当前控件', exact: true }).click()
  await expect(input).toHaveValue('')
  await expect(app.getByTestId('c06-snapshot')).toHaveText('null')
  await expect(app.getByTestId('imask-value')).toHaveText('（空）')
  expect(
    await held.evaluate((node) => ({
      connected: node.isConnected,
      listeners: window.__c06CountInputListeners(node),
    })),
  ).toEqual({ connected: false, listeners: 0 })
  await expect.poll(() => listeners(input)).toBeGreaterThanOrEqual(8)
  await input.pressSequentially('87654321')
  await expect(input).toHaveValue('8765-4321')
})

test('@C06 actual Number mask normalizes display and keeps textual versus numeric values distinct', async ({
  page,
}) => {
  const app = await open(page, 'business')
  const input = app.getByRole('textbox', { name: '金额', exact: true })
  await expect(input).toHaveAttribute('inputmode', 'decimal')
  const held = await input.elementHandle()
  if (!held) throw new Error('Missing actual Number input')
  await input.pressSequentially('1234.50')
  await page.keyboard.press('Tab') // Real blur commits normalizeZeros; no synthetic model resolve.
  await expect(input).toHaveValue('1,234.5')
  await expect(app.getByTestId('imask-value')).toHaveText('1234.5')
  expect(await snapshot(app)).toMatchObject({
    value: '1,234.5',
    unmaskedValue: '1234.5',
    typedValue: 1234.5,
  })
  expect(typeof (await snapshot(app))?.typedValue).toBe('number')
  expect(await held.evaluate((node) => node.isConnected)).toBe(true)
  await app.getByRole('button', { name: '重置当前控件', exact: true }).click()
  await input.pressSequentially('0.10')
  await page.keyboard.press('Tab')
  await expect(app.getByTestId('imask-value')).toHaveText('0.1')
  expect((await snapshot(app))?.typedValue).toBe(0.1)
  // This is Number formatting, never a claim of exact accounting or a completed payment.
})

test('@C06 actual date Pattern completion differs from calendar validity, free Chinese text and owned teardown', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const app = await open(page, 'advanced')
  const input = app.getByRole('textbox', { name: '事件日期', exact: true })
  await input.pressSequentially('20260230')
  await expect(input).toHaveValue('2026-02-30')
  expect((await snapshot(app))?.isComplete).toBe(true)
  await expect(input).toHaveAttribute('aria-invalid', 'true')
  await expect(app.getByTestId('c06-date')).toContainText('格式化不等于有效日期')
  await app.getByRole('button', { name: '重置当前控件', exact: true }).click()
  await input.pressSequentially('2024')
  await expect(app.getByTestId('c06-date')).toContainText('尚未填满')
  await expect(input).toHaveAttribute('aria-invalid', 'false')
  await input.pressSequentially('0229')
  await expect(app.getByTestId('imask-value')).toHaveText('2024-02-29')
  await expect(app.getByTestId('c06-date')).toContainText('有效日历日期')
  const note = app.getByRole('textbox', { name: '中文备注', exact: true })
  await note.fill('新闻来源备注')
  await expect(note).toHaveValue('新闻来源备注')
  expect(await listeners(note)).toBe(0) // No IMask view listener was attached to this free-text field.
  await note.dispatchEvent('compositionstart', { data: '中' }) // Application protocol only, not OS IME.
  await expect(app.getByTestId('c06-ime')).toContainText('正在组合字词')
  await note.dispatchEvent('compositionend', { data: '中' })
  await expect(app.getByTestId('c06-ime')).toContainText('可以正常输入')
  await page.setViewportSize({ width: 390, height: 980 })
  expect(await app.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
  const held = await input.elementHandle()
  if (!held) throw new Error('Missing actual SDK input before unmount')
  await expect.poll(() => listeners(input)).toBeGreaterThanOrEqual(8)
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  expect(
    await held.evaluate((node) => ({
      connected: node.isConnected,
      listeners: window.__c06CountInputListeners(node),
    })),
  ).toEqual({ connected: false, listeners: 0 })
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(input).toHaveValue('')
  await expect(app.getByTestId('c06-date')).toContainText('尚未填写')
  await expect(note).toHaveValue('')
  await expect(app.getByTestId('c06-snapshot')).toHaveText('null')
  expect(errors).toEqual([])
})
// Remaining NOT_RUN: real OS IME/mobile keyboard, trusted clipboard/autofill, native undo/redo,
// SSR hydration and complete cursor-timer/listener census outside the eight observed direct view events.
// Each Playwright page owns its private instrumentation context; no SDK results or callbacks are replaced.
