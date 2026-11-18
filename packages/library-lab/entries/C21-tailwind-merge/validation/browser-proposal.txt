// One complete real SDK experiment. Author browser NOT_RUN.
// Tailwind utility CSS comes from the existing real Tailwind 4.3.3 build, not inline style emulation.
import { expect, type Locator, type Page, test } from '@playwright/test'

async function padding(preview: Locator) {
  return preview.evaluate((element) => {
    const style = getComputedStyle(element)
    return [style.paddingLeft, style.paddingRight, style.paddingTop, style.paddingBottom]
  })
}
async function color(preview: Locator) {
  return preview.evaluate((element) => getComputedStyle(element).backgroundColor)
}
async function preset(app: Locator, id: string) {
  await app.getByLabel('实验预设', { exact: true }).selectOption(id)
}
async function live(page: Page) {
  await page.goto('/libraries/tailwind-merge?tab=demo&example=basic')
  const app = page.getByTestId('c21-workshop')
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  await expect(app.or(run).first()).toBeVisible()
  if (await run.isVisible()) await run.click()
  await expect(app).toBeVisible()
  return app
}

test('@C21 base/variants/caller produce real merge output, loaded utility styles and custom-group boundaries in one experiment', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1000 })
  const app = await live(page)
  const preview = app.getByTestId('c21-preview')
  const merged = app.getByTestId('tw-merged')
  const caller = app.getByLabel('调用者 className', { exact: true })
  await expect(merged).toHaveText('rounded-lg border px-3 py-2 bg-slate-100 pr-8')
  await expect(preview).toHaveAttribute('class', (await merged.textContent()) || '')
  await expect.poll(() => padding(preview)).toEqual(['12px', '32px', '8px', '8px'])
  const baseColor = await color(preview)
  await app.getByLabel('选中变体', { exact: true }).check()
  await expect(preview).toHaveClass(/bg-green-100/)
  await expect(preview).not.toHaveClass(/bg-slate-100/)
  await expect.poll(() => color(preview)).not.toBe(baseColor)
  const selectedColor = await color(preview)
  await app.getByLabel('卡片尺寸', { exact: true }).selectOption('comfortable')
  await expect.poll(() => padding(preview)).toEqual(['28px', '32px', '20px', '20px'])
  await caller.fill('px-1 bg-blue-100')
  await expect(merged).toHaveText('rounded-lg border py-5 px-1 bg-blue-100')
  await expect(preview).toHaveAttribute('class', (await merged.textContent()) || '')
  await expect.poll(() => padding(preview)).toEqual(['4px', '4px', '20px', '20px'])
  await expect.poll(() => color(preview)).not.toBe(selectedColor)

  await preset(app, 'same')
  await expect(app.getByTestId('tw-joined')).toHaveText('px-2 px-6')
  await expect(merged).toHaveText('px-6')
  await expect.poll(() => padding(preview)).toEqual(['24px', '24px', '0px', '0px'])
  await preset(app, 'axis-first')
  await expect(merged).toHaveText('px-3 pr-4')
  await expect.poll(() => padding(preview)).toEqual(['12px', '16px', '0px', '0px'])
  await preset(app, 'side-first')
  await expect(merged).toHaveText('px-3')
  await expect.poll(() => padding(preview)).toEqual(['12px', '12px', '0px', '0px'])

  await preset(app, 'responsive')
  await expect(merged).toHaveText('p-4 md:p-6')
  await expect.poll(() => padding(preview)).toEqual(['24px', '24px', '24px', '24px'])
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(() => padding(preview)).toEqual(['16px', '16px', '16px', '16px'])
  await expect
    .poll(() => app.evaluate((element) => element.scrollWidth <= element.clientWidth + 1))
    .toBe(true)
  await page.setViewportSize({ width: 1280, height: 1000 })
  await preset(app, 'hover')
  await expect(merged).toHaveText('bg-slate-100 hover:bg-green-500')
  const idleColor = await color(preview)
  await preview.hover()
  await expect.poll(() => color(preview)).not.toBe(idleColor)

  await preset(app, 'custom')
  await expect(app.getByTestId('c21-default')).toHaveText('c21-pad-compact c21-pad-roomy')
  await expect(merged).toHaveText('c21-pad-compact c21-pad-roomy')
  await app.getByLabel('启用自定义 px 规则', { exact: true }).check()
  await expect(app.getByTestId('c21-default')).toHaveText('c21-pad-compact c21-pad-roomy')
  await expect(merged).toHaveText('c21-pad-roomy')
  await expect(preview).toHaveAttribute('class', 'c21-pad-roomy')
  await expect.poll(() => padding(preview)).toEqual(['24px', '24px', '0px', '0px'])
  await caller.fill('px-6')
  await expect(merged).toHaveText('px-6')
  await app.getByText('查看 SDK 默认方向冲突组', { exact: true }).click()
  const config = JSON.parse((await app.getByTestId('c21-conflicts').textContent()) || '{}') as {
    px: string[]
    pr: string[]
  }
  expect(config.px).toContain('pr')
  expect(config.pr).not.toContain('px')

  await app.getByRole('button', { name: '重置合并实验', exact: true }).click()
  await expect(app.getByLabel('实验预设', { exact: true })).toHaveValue('component')
  await expect(app.getByLabel('选中变体', { exact: true })).not.toBeChecked()
  await expect(app.getByLabel('卡片尺寸', { exact: true })).toHaveValue('compact')
  await expect(app.getByLabel('启用自定义 px 规则', { exact: true })).not.toBeChecked()
  await expect(merged).toHaveText('rounded-lg border px-3 py-2 bg-slate-100 pr-8')
  const held = await app.elementHandle()
  if (!held) throw new Error('Missing real workshop before stop')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  expect(await held.evaluate((element) => element.isConnected)).toBe(false)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(app.getByLabel('启用自定义 px 规则', { exact: true })).not.toBeChecked()
  await expect(merged).toHaveText('rounded-lg border px-3 py-2 bg-slate-100 pr-8')
})
