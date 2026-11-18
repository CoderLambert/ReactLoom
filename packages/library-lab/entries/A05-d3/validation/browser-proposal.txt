// NOT_RUN proposal: integrate only after building the matching entry candidate.
// Real D3-created SVG, native controls and pointer/keyboard events. No SDK mock or fake SVG.
import { expect, type Locator, type Page, test } from '@playwright/test'

type Snapshot = {
  width: number
  height: number
  xDomain: string[]
  xRange: number[]
  yDomain: number[]
  yRange: number[]
  bandwidth: number
  joined: { entered: number; updated: number; exited: number }
  marks: { day: string; x: string; y: string; selected: string }[]
  paths: { series: string; d: string }[]
}
async function state(app: Locator): Promise<Snapshot> {
  return JSON.parse((await app.getByTestId('a05-observation').textContent()) || 'null')
}
async function open(page: Page, level: 'basic' | 'business' | 'advanced') {
  await page.goto(`/libraries/d3?tab=demo&example=${level}`)
  const app = page.getByRole('region', { name: 'D3 可视化实战', exact: true })
  await app.getByText('查看比例尺、数据联结与真实SVG结果', { exact: true }).click()
  await expect.poll(async () => (await state(app))?.marks.length ?? 0).toBe(7)
  return app
}

test('@A05 actual scale axes and bars share pointer and keyboard table selection', async ({
  page,
}, info) => {
  const app = await open(page, 'basic')
  const svg = app.getByTestId('a05-svg')
  const bars = svg.locator('rect.a05-bar')
  await expect(bars).toHaveCount(7)
  await expect(svg.locator('.a05-x-axis')).toHaveCount(1)
  await expect(svg.locator('.a05-y-axis')).toHaveCount(1)
  expect(await svg.locator('.a05-x-axis .tick text').allTextContents()).toContain('周一')
  expect(await svg.locator('.a05-y-axis .tick').count()).toBeGreaterThan(1)
  const snapshot = await state(app)
  expect(snapshot.xDomain).toEqual(['周一', '周二', '周三', '周四', '周五', '周六', '周日'])
  expect(snapshot.bandwidth).toBeGreaterThan(0)
  expect(snapshot.yRange).toEqual([234, 24])
  const actual = await bars.evaluateAll((nodes) =>
    nodes.map((node) => ({
      day: node.getAttribute('data-day'),
      y: Number(node.getAttribute('y')),
      height: Number(node.getAttribute('height')),
    })),
  )
  for (const bar of actual) {
    expect(bar.y).toBeGreaterThanOrEqual(24)
    expect(bar.height).toBeGreaterThan(0)
    expect(bar.y + bar.height).toBeCloseTo(234, 6)
  }
  expect(actual.find((bar) => bar.day === '周六')?.y).toBeLessThan(
    actual.find((bar) => bar.day === '周一')?.y ?? 0,
  )
  await svg.locator('.a05-bar[data-day="周一"]').hover()
  await expect(app.getByTestId('a05-status')).toHaveText('周一：阅读 48，收藏 13')
  await expect(app.getByRole('button', { name: '周一', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  const thursday = app.getByRole('button', { name: '周四', exact: true })
  await thursday.focus()
  await page.keyboard.press('Enter')
  await expect(app.getByTestId('a05-status')).toHaveText('周四：阅读 96，收藏 35')
  await expect(svg.locator('.a05-bar[data-day="周四"]')).toHaveAttribute('data-selected', 'true')
  await expect(thursday).toHaveAttribute('aria-pressed', 'true')
  await info.attach('actual-d3-bars.png', {
    body: await svg.screenshot(),
    contentType: 'image/png',
  })
})

test('@A05 two actual metric paths contain D3 geometry and retain original values', async ({
  page,
}) => {
  const app = await open(page, 'business')
  const svg = app.getByTestId('a05-svg')
  await expect(svg.locator('.a05-line')).toHaveCount(2)
  await expect(svg.locator('.a05-dot')).toHaveCount(7)
  await expect(svg.locator('.a05-bar')).toHaveCount(0)
  const snapshot = await state(app)
  const paths = await svg.locator('.a05-line').evaluateAll((nodes) =>
    nodes.map((node) => ({
      series: node.getAttribute('data-series'),
      d: node.getAttribute('d'),
    })),
  )
  expect(paths).toEqual(snapshot.paths)
  expect(paths.map((path) => path.series)).toEqual(['views', 'saves'])
  for (const path of paths) {
    expect(path.d).toMatch(/^M/)
    expect(path.d).toContain('C')
    expect(path.d).not.toMatch(/NaN|Infinity/)
  }
  expect(paths[0]?.d).not.toBe(paths[1]?.d)
  await svg.locator('.a05-dot[data-day="周日"]').hover()
  await expect(app.getByTestId('a05-status')).toHaveText('周日：阅读 103，收藏 39')
  const rows = app.getByRole('table').locator('tbody tr')
  await expect(rows).toHaveCount(7)
  await expect(rows.last()).toContainText('103')
  await expect(rows.last()).toContainText('39')
})

test('@A05 keyed identity survives filtering and actual resize, exits and teardown remove owned nodes', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const app = await open(page, 'advanced')
  const svg = app.getByTestId('a05-svg')
  const heldSvg = await svg.elementHandle()
  const sunday = await svg.locator('.a05-dot[data-day="周日"]').elementHandle()
  const monday = await svg.locator('.a05-dot[data-day="周一"]').elementHandle()
  if (!heldSvg || !sunday || !monday) throw new Error('Missing actual D3-created nodes')
  await app.getByRole('combobox', { name: '日期窗口', exact: true }).selectOption('3')
  await expect(svg.locator('.a05-dot')).toHaveCount(3)
  await expect(app.getByRole('table').locator('tbody tr')).toHaveCount(3)
  expect(
    await sunday.evaluate(
      (node) =>
        node instanceof SVGElement &&
        node === node.ownerSVGElement?.querySelector('.a05-dot[data-day="周日"]'),
    ),
  ).toBe(true)
  expect(await monday.evaluate((node) => node.isConnected)).toBe(false)
  await app.getByRole('button', { name: '周五', exact: true }).click()
  const threshold = app.getByRole('slider', { name: '阅读阈值', exact: true })
  await threshold.focus()
  // Native range keyboard events: End=115, then 15 decrements=100. Never set value or dispatch events.
  await threshold.press('End')
  for (let i = 0; i < 15; i++) await threshold.press('ArrowLeft')
  await expect(threshold).toHaveValue('100')
  await expect(svg.locator('.a05-dot')).toHaveCount(2)
  await expect(app.getByRole('table').locator('tbody tr')).toHaveCount(3)
  await expect(app.getByRole('button', { name: '周五', exact: true })).toBeDisabled()
  await expect(app.getByTestId('a05-status')).toHaveText('原选中日期不在当前绘制结果中')
  await threshold.press('End')
  await expect(threshold).toHaveValue('115')
  await expect(svg.locator('.a05-dot')).toHaveCount(0)
  await expect(svg.locator('.a05-line')).toHaveCount(0)
  await expect(app.getByTestId('a05-status')).toHaveText('当前筛选没有可绘制的数据')
  await app.getByRole('button', { name: '恢复', exact: true }).click()
  await expect(svg.locator('.a05-dot')).toHaveCount(7)
  await expect(app.getByRole('combobox', { name: '日期窗口', exact: true })).toHaveValue('7')
  await expect(threshold).toHaveValue('0')
  const restoredSunday = await svg.locator('.a05-dot[data-day="周日"]').elementHandle()
  if (!restoredSunday) throw new Error('Missing restored Sunday')
  const wideWidth = (await state(app)).width
  const wideBox = await svg.boundingBox()
  if (!wideBox) throw new Error('Actual SVG has no layout')
  await app.getByRole('checkbox', { name: '使用窄面板', exact: true }).check()
  await expect.poll(async () => (await state(app)).width).toBeLessThan(wideWidth)
  await expect
    .poll(async () => (await svg.boundingBox())?.width ?? wideBox.width)
    .toBeLessThan(wideBox.width)
  expect(
    await restoredSunday.evaluate(
      (node) =>
        node instanceof SVGElement &&
        node === node.ownerSVGElement?.querySelector('.a05-dot[data-day="周日"]'),
    ),
  ).toBe(true)
  await expect(svg.locator('.a05-x-axis')).toHaveCount(1)
  await expect(svg.locator('.a05-y-axis')).toHaveCount(1)
  const resized = await state(app)
  await expect(svg).toHaveAttribute('viewBox', `0 0 ${resized.width} 280`)
  expect(resized.marks).toHaveLength(7)
  // This marker is app-owned and written after actual clearChart; child removal is asserted separately.
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  expect(
    await heldSvg.evaluate((node) => ({
      connected: node.isConnected,
      children: node.childElementCount,
      cleaned: node.getAttribute('data-d3-cleaned'),
    })),
  ).toEqual({ connected: false, children: 0, cleaned: 'true' })
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect.poll(async () => (await state(app))?.marks.length ?? 0).toBe(7)
  await expect(app.getByRole('checkbox', { name: '使用窄面板', exact: true })).not.toBeChecked()
  expect(errors).toEqual([])
})

// Not executed here. Not coverage for high-volume data, touch, screen readers, native listener census,
// transitions (this example has none), brush/zoom or production performance.
