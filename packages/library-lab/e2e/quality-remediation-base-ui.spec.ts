// NOT_RUN: root integrates and executes against the matching built candidate.
// Real Base UI DOM/keyboard/native FormData; no SDK, DOM event, clock or network mock.
import { expect, type Locator, type Page, test } from '@playwright/test'

type InputReading = {
  name: string
  value: string
  checked: boolean
  indeterminate: boolean
  disabled: boolean
  tabIndex: number
}
type InputSnapshot = {
  single?: InputReading
  parent?: InputReading
  permissions?: Record<string, InputReading>
  formData?: string[]
}
async function open(page: Page, level: 'basic' | 'business' | 'advanced') {
  await page.goto(`/libraries/base-ui?tab=demo&example=${level}`)
  const app = page.getByTestId('b10-workshop')
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  await expect(app.or(run).first()).toBeVisible()
  if (await run.isVisible()) await run.click()
  await expect(app).toHaveAttribute('data-level', level)
  return app
}
async function inspect(app: Locator): Promise<InputSnapshot> {
  await app.getByRole('button', { name: '读取实际输入', exact: true }).click()
  return JSON.parse((await app.getByTestId('b10-input-reading').textContent()) || 'null')
}
async function nativeValues(app: Locator) {
  return app.locator('form').evaluate((form) => {
    if (!(form instanceof HTMLFormElement)) throw new Error('No native form')
    return new FormData(form).getAll('permissions').map(String)
  })
}
async function submit(app: Locator) {
  await app.getByRole('button', { name: '提交本地 FormData', exact: true }).click()
  return JSON.parse((await app.getByTestId('b10-form-data').textContent()) || 'null')
}

test('@B10 label clicks and real Space update the SDK control and native input without a duplicate Tab stop', async ({
  page,
}) => {
  const app = await open(page, 'basic')
  const control = app.getByRole('checkbox', { name: '接收工程更新摘要', exact: true })
  await expect(app.getByRole('checkbox')).toHaveCount(1)
  await expect(control).toHaveAttribute('aria-checked', 'false')
  await app.getByText('接收工程更新摘要', { exact: true }).click()
  await expect(control).toHaveAttribute('aria-checked', 'true')
  expect((await inspect(app)).single?.checked).toBe(true)
  await control.focus()
  await control.press('Space')
  await expect(control).toHaveAttribute('aria-checked', 'false')
  await expect(app.getByRole('status')).toContainText('未勾选')
  await control.press('Tab')
  await expect(app.getByRole('button', { name: '读取实际输入', exact: true })).toBeFocused()
  const reading = await inspect(app)
  expect(reading.single?.checked).toBe(false)
  expect(reading.single?.tabIndex).toBe(-1)
  expect(reading.single?.indeterminate).toBe(false)
  expect(reading.single?.name).toBe('')
})

test('@B10 mixed parent and three real input values produce native FormData and Enter submits without toggling', async ({
  page,
}) => {
  const app = await open(page, 'business')
  const parent = app.getByRole('checkbox', { name: '全选 / 取消全选', exact: true })
  await expect(app.getByRole('checkbox')).toHaveCount(4)
  await expect(parent).toHaveAttribute('aria-checked', 'mixed')
  const initial = await inspect(app)
  expect(initial.parent?.indeterminate).toBe(true)
  expect(initial.parent?.checked).toBe(false)
  expect(initial.parent?.name).toBe('')
  expect(initial.formData).toEqual(['read'])
  expect(initial.permissions?.read.checked).toBe(true)
  await expect(app.locator('input[name="permissions"]')).toHaveCount(3)
  await app.getByText('全选 / 取消全选', { exact: true }).click()
  await expect(parent).toHaveAttribute('aria-checked', 'true')
  expect(await submit(app)).toEqual(['read', 'comment', 'manage'])
  expect(await nativeValues(app)).toEqual(['read', 'comment', 'manage'])
  await app.getByRole('checkbox', { name: '参与评论', exact: true }).click()
  await expect(parent).toHaveAttribute('aria-checked', 'mixed')
  await expect(app.getByTestId('b10-form-data')).toHaveCount(0)
  expect(await submit(app)).toEqual(['read', 'manage'])
  await parent.click() // Mixed -> all, then all -> empty.
  await parent.click()
  await expect(parent).toHaveAttribute('aria-checked', 'false')
  await parent.focus()
  await parent.press('Enter')
  await expect(app.getByTestId('b10-form-data')).toHaveText('[]')
  await expect(parent).toHaveAttribute('aria-checked', 'false')
  expect(await nativeValues(app)).toEqual([])
})

test('@B10 lock removes stale authority, disables the actual input and leaves a complete eligible subset', async ({
  page,
}) => {
  const app = await open(page, 'advanced')
  const parent = app.getByRole('checkbox', { name: '全选 / 取消全选', exact: true })
  const manage = app.getByRole('checkbox', { name: '管理订阅', exact: true })
  const lock = app.getByRole('checkbox', { name: /锁定“管理订阅”权限/ })
  await parent.click()
  expect(await submit(app)).toEqual(['read', 'comment', 'manage'])
  await lock.check()
  await expect(app.getByTestId('b10-form-data')).toHaveCount(0)
  await expect(app.getByRole('status')).toContainText('尚未提交')
  await expect(parent).toHaveAttribute('aria-checked', 'true')
  await expect(manage).toBeDisabled()
  await expect(app.locator('input[name="permissions"][value="manage"]')).toBeDisabled()
  const disabledLabel = await app.getByText('管理订阅', { exact: true }).boundingBox()
  if (!disabledLabel) throw new Error('Disabled label is not visible')
  // Locator.click redirects labels to their disabled inputs and waits for enabled.
  // A real pointer click on the label must remain ineffective.
  await page.mouse.click(
    disabledLabel.x + disabledLabel.width / 2,
    disabledLabel.y + disabledLabel.height / 2,
  )
  await expect(manage).toHaveAttribute('aria-checked', 'false')
  const locked = await inspect(app)
  expect(locked.permissions?.manage.disabled).toBe(true)
  expect(locked.permissions?.manage.checked).toBe(false)
  expect(locked.parent?.checked).toBe(true)
  expect(locked.parent?.indeterminate).toBe(false)
  expect(await submit(app)).toEqual(['read', 'comment'])
  expect(await nativeValues(app)).toEqual(['read', 'comment'])
  await parent.click()
  await parent.click()
  expect(await nativeValues(app)).toEqual(['read', 'comment'])
  const comment = app.getByRole('checkbox', { name: '参与评论', exact: true })
  await comment.focus()
  await comment.press('Tab')
  await expect(app.getByRole('button', { name: '提交本地 FormData', exact: true })).toBeFocused()
  await lock.uncheck()
  await expect(manage).toBeEnabled()
  await expect(manage).toHaveAttribute('aria-checked', 'false')
  await manage.click()
  expect(await submit(app)).toEqual(['read', 'comment', 'manage'])
  const oldControl = await manage.elementHandle()
  if (!oldControl) throw new Error('Missing real control')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  expect(await oldControl.evaluate((node) => node.isConnected)).toBe(false)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(app.getByRole('checkbox', { name: '管理订阅', exact: true })).toHaveAttribute(
    'aria-checked',
    'false',
  )
  await expect(app.getByTestId('b10-form-data')).toHaveCount(0)
})
