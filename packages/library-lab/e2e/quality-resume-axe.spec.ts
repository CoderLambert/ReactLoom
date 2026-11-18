import { expect, test } from '@playwright/test'

const region = 'axe-core 真实可访问性规则演示'

test('@F17 real axe reports scoped rule ids and removes findings after DOM repair', async ({
  page,
}) => {
  await page.goto('/libraries/axe-core?tab=demo&example=basic')
  const app = page.getByRole('region', { name: region, exact: true })
  const scan = app.getByRole('button', { name: '运行 axe-core 审计' })
  const repair = app.getByRole('checkbox', { name: '使用修复版DOM' })
  const count = app.getByTestId('axe-violation-count')
  await app.waitFor()
  // A real visible unnamed button and image outside the target container must not
  // affect its repair result. They are intentionally part of this test only.
  await page.evaluate(() => {
    const outside = document.createElement('aside')
    const button = document.createElement('button')
    button.style.cssText = 'width:40px;height:40px'
    const image = document.createElement('img')
    image.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
    image.width = 40
    image.height = 40
    outside.append(button, image)
    document.body.prepend(outside)
  })
  for (const [level, ids] of [
    ['basic', ['image-alt']],
    ['business', ['label']],
    ['advanced', ['button-name', 'image-alt', 'label']],
  ] as const) {
    await page.getByRole('combobox', { name: '学习场景' }).selectOption(level)
    await expect(repair).not.toBeChecked()
    await scan.click()
    await expect(count).toHaveText(String(ids.length))
    for (const id of ids) await expect(app.getByText(id, { exact: true })).toBeVisible()
    await repair.check()
    await expect(count).toHaveCount(0)
    await scan.click()
    await expect(count).toHaveText('0')
  }
})

type AuditProbe = { starts: number; finished: number; release?: () => void }

test('@F17 a real scan finishing after unmount cannot publish to a new mount', async ({ page }) => {
  await page.goto('/libraries/axe-core?tab=demo&example=advanced')
  const app = page.getByRole('region', { name: region, exact: true })
  const scan = app.getByRole('button', { name: '运行 axe-core 审计' })
  await app.waitFor()
  await page.evaluate(() => {
    const root = window as unknown as {
      axe: { version: string; run: (...args: unknown[]) => Promise<unknown> }
      auditProbe: AuditProbe
    }
    if (root.axe.version !== '4.14.0') throw new Error('Expected the pinned axe engine')
    const probe: AuditProbe = { starts: 0, finished: 0 }
    root.auditProbe = probe
    const original = root.axe.run
    root.axe.run = async (...args) => {
      const turn = ++probe.starts
      const result = await Reflect.apply(original, root.axe, args)
      probe.finished++
      if (turn === 1)
        await new Promise<void>((resolve) => {
          probe.release = resolve
        })
      return result
    }
  })
  const state = () =>
    page.evaluate(() => {
      const p = (window as unknown as { auditProbe: AuditProbe }).auditProbe
      return { starts: p.starts, finished: p.finished }
    })
  await scan.click()
  await expect.poll(state).toEqual({ starts: 1, finished: 1 })
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(app.getByTestId('axe-violation-count')).toHaveCount(0)
  await scan.click()
  await expect(app.getByRole('button', { name: '扫描中…' })).toBeDisabled()
  expect(await state()).toEqual({ starts: 1, finished: 1 })
  await page.evaluate(() =>
    (window as unknown as { auditProbe: AuditProbe }).auditProbe.release?.(),
  )
  await expect(app.getByTestId('axe-violation-count')).toHaveText('3')
  expect(await state()).toEqual({ starts: 2, finished: 2 })
})
