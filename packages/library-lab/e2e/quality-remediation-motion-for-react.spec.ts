// NOT_RUN proposal. Real Motion DOM, computed CSS, native RAF/media and keyboard events only.
// Observers below read the actual DOM; they do not replace RAF, timers, SDK or animation targets.
import { type ElementHandle, expect, type Page, test } from '@playwright/test'

async function watch(element: ElementHandle<HTMLElement | SVGElement>, milliseconds = 700) {
  return element.evaluate(
    (node, duration) =>
      new Promise<
        {
          present: string | null
          opacity: number
          transform: string
          displaced: boolean
          inert: boolean
          hidden: string | null
          disabled: boolean
        }[]
      >((resolve) => {
        const start = performance.now()
        const frames: {
          present: string | null
          opacity: number
          transform: string
          displaced: boolean
          inert: boolean
          hidden: string | null
          disabled: boolean
        }[] = []
        function tick() {
          if (!node.isConnected || performance.now() - start > duration) {
            resolve(frames)
            return
          }
          const css = getComputedStyle(node)
          const matrix = css.transform === 'none' ? null : new DOMMatrixReadOnly(css.transform)
          const displaced = matrix
            ? Math.abs(matrix.m41) +
                Math.abs(matrix.m42) +
                Math.abs(matrix.m11 - 1) +
                Math.abs(matrix.m22 - 1) >
              0.001
            : false
          frames.push({
            present: node.getAttribute('data-present'),
            opacity: Number(css.opacity),
            transform: css.transform,
            displaced,
            inert: node.hasAttribute('inert'),
            hidden: node.getAttribute('aria-hidden'),
            disabled: node.querySelector('button')?.hasAttribute('disabled') ?? false,
          })
          requestAnimationFrame(tick)
        }
        tick()
      }),
    milliseconds,
  )
}
async function open(page: Page, level: 'basic' | 'business' | 'advanced') {
  await page.setViewportSize({ width: 1100, height: 1000 })
  await page.goto(`/libraries/motion-for-react?tab=demo&example=${level}`)
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  if (await run.isVisible()) await run.click()
  return page.getByRole('region', { name: 'Motion for React 实际动画演示', exact: true })
}

test('@B01 true presence retains exiting DOM while the business value already changed', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const app = await open(page, 'basic')
  const notice = app.getByTestId('b01-notice')
  await expect(notice).toHaveCSS('opacity', '1')
  const held = await notice.elementHandle()
  if (!held) throw new Error('No actual notice DOM')
  const animation = watch(held, 1500)
  await app.getByRole('button', { name: '隐藏提示卡片', exact: true }).click()
  await expect(app.getByTestId('b01-visible')).toHaveText('业务visible：false')
  const frames = await animation
  expect(
    frames.some((frame) => frame.present === 'false' && frame.inert && frame.hidden === 'true'),
  ).toBe(true)
  expect(frames.some((frame) => frame.opacity > 0 && frame.opacity < 1)).toBe(true)
  await expect(notice).toHaveCount(0)
  await expect(app.getByTestId('b01-exits')).toContainText('1 次')
  expect(await held.evaluate((node) => node.isConnected)).toBe(false)
  await app.getByRole('button', { name: '显示提示卡片', exact: true }).click()
  await expect(notice).toHaveCount(1)
  await expect(notice).toHaveAttribute('data-present', 'true')
  await expect(notice).toHaveCSS('opacity', '1')
  // Real rapid opposite intents converge to the final React state without duplicate keys.
  await app.getByRole('button', { name: '隐藏提示卡片', exact: true }).click()
  await app.getByRole('button', { name: '显示提示卡片', exact: true }).click()
  await expect(notice).toHaveCount(1)
  await expect(notice).toHaveCSS('opacity', '1')
  await info.attach('b01-presence-frames.json', {
    body: JSON.stringify(frames),
    contentType: 'application/json',
  })
})

test('@B01 actual list identities, exit isolation and keyboard focus follow committed data', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const app = await open(page, 'business')
  const list = app.getByTestId('b01-list')
  const first = await list.locator('[data-card-id="1"]').elementHandle()
  if (!first) throw new Error('No real first task')
  const add = app.getByRole('button', { name: '添加任务（最多12项）', exact: true })
  await add.click()
  await expect(app).toHaveAttribute('data-order', '1,2,3,4')
  await expect(list.locator('[data-card-id="4"]')).toHaveCSS('opacity', '1')
  const archived = list.locator('[data-card-id="2"]')
  const button = archived.getByRole('button', { name: '归档 业务场景测试', exact: true })
  const removedNode = await archived.elementHandle()
  if (!removedNode) throw new Error('No actual task to archive')
  const isolation = watch(removedNode)
  await button.focus()
  await page.keyboard.press('Enter')
  await expect(app).toHaveAttribute('data-order', '1,3,4')
  await expect(app.getByTestId('b01-count')).toHaveText('当前任务：3 项')
  await expect(add).toBeFocused()
  expect(
    (await isolation).some(
      (frame) =>
        frame.present === 'false' && frame.inert && frame.hidden === 'true' && frame.disabled,
    ),
  ).toBe(true)
  await expect(archived).toHaveCount(0)
  expect(
    await first.evaluate(
      (node) => node === node.parentElement?.querySelector('[data-card-id="1"]'),
    ),
  ).toBe(true)
  // Native UI capacity: policy tests separately prove the pure boundary.
  for (let i = 0; i < 9; i++) await add.click()
  await expect(app.getByTestId('b01-count')).toHaveText('当前任务：12 项')
  await expect(add).toBeDisabled()
  const active = list.locator('[data-present="true"]')
  for (let remaining = 12; remaining > 0; remaining--) {
    const remove = active.first().getByRole('button')
    await remove.focus()
    await page.keyboard.press('Enter')
    await expect(app.getByTestId('b01-count')).toHaveText(`当前任务：${remaining - 1} 项`)
    await expect(add).toBeFocused()
  }
  await expect(list.locator('li')).toHaveCount(0)
  await expect(app.getByTestId('b01-empty')).toBeVisible()
  await add.click()
  await expect(app.getByTestId('b01-count')).toHaveText('当前任务：1 项')
})

test('@B01 real layout transforms preserve nodes and native media changes remove then restore motion', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const app = await open(page, 'advanced')
  const list = app.getByTestId('b01-list')
  const first = await list.locator('[data-card-id="1"]').elementHandle()
  if (!first) throw new Error('No real first task')
  const before = await first.boundingBox()
  if (!before) throw new Error('Task has no layout')
  const movement = watch(first)
  await app.getByRole('button', { name: '把第一项移到最后', exact: true }).click()
  await expect(app).toHaveAttribute('data-order', '2,3,1')
  const frames = await movement
  expect(frames.some((frame) => frame.displaced)).toBe(true)
  expect(
    await first.evaluate(
      (node) => node === node.parentElement?.querySelector('[data-card-id="1"]'),
    ),
  ).toBe(true)
  await expect(list.locator('[data-card-id="1"]')).toHaveCSS('transform', 'none')
  expect((await first.boundingBox())?.y ?? 0).toBeGreaterThan(before.y)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(app).toHaveAttribute('data-reduced', 'true')
  const noMovement = watch(first, 400)
  await app.getByRole('button', { name: '把第一项移到最后', exact: true }).click()
  await expect(app).toHaveAttribute('data-order', '3,1,2')
  expect((await noMovement).every((frame) => !frame.displaced)).toBe(true)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(app).toHaveAttribute('data-reduced', 'false')
  const restoredMovement = watch(first)
  await app.getByRole('button', { name: '把第一项移到最后', exact: true }).click()
  await expect(app).toHaveAttribute('data-order', '1,2,3')
  expect((await restoredMovement).some((frame) => frame.displaced)).toBe(true)
  const held = await app.elementHandle()
  if (!held) throw new Error('Missing actual app')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  expect(await held.evaluate((node) => node.isConnected)).toBe(false)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(app).toHaveAttribute('data-order', '1,2,3')
  await expect(app).toHaveAttribute('data-reduced', 'true')
  expect(errors).toEqual([])
  await info.attach('b01-layout-frames.json', {
    body: JSON.stringify(frames),
    contentType: 'application/json',
  })
})

// Still NOT_RUN: changing reduced motion during an already-exiting animation, browser CPU profiles,
// touch/screen-reader acceptance, large lists and a native listener/animation resource census.
