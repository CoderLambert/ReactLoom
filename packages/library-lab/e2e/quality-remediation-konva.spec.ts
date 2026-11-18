import { expect, type Page, test } from '@playwright/test'

type Snapshot = {
  width: number
  zoom: number
  position: { x: number; y: number }
  registered: boolean
  cards: {
    id: string
    x: number
    y: number
    width: number
    height: number
    scaleX: number
    scaleY: number
    box: { x: number; y: number; width: number; height: number }
  }[]
  selected: string[]
  anchors: { name: string; x: number; y: number }[]
}
async function snapshot(page: Page): Promise<Snapshot> {
  return JSON.parse((await page.getByTestId('a11-sdk-state').textContent()) || 'null')
}
async function open(page: Page, level: 'basic' | 'business' | 'advanced') {
  await page.goto(`/libraries/konva?tab=demo&example=${level}`)
  const app = page.getByRole('region', { name: 'Konva 原生 Canvas 场景', exact: true })
  await app.getByText('查看真实场景节点与变换', { exact: true }).click()
  await expect.poll(async () => (await snapshot(page))?.cards.length ?? 0).toBe(2)
  return app
}

test('@A11 basic actual Canvas hit selection and keyboard controls update the same scene graph', async ({
  page,
}, info) => {
  const app = await open(page, 'basic')
  const host = app.getByTestId('a11-canvas-host')
  const canvas = host.locator('canvas')
  await expect(canvas).toHaveCount(1)
  const painted = await canvas.evaluate((element) => {
    if (!(element instanceof HTMLCanvasElement)) throw new Error('not Canvas')
    const context = element.getContext('2d')
    if (!context) throw new Error('no 2D context')
    const bytes = context.getImageData(0, 0, element.width, element.height).data
    let count = 0
    for (let i = 3; i < bytes.length; i += 4) if (bytes[i] > 0) count++
    return count
  })
  expect(painted).toBeGreaterThan(1000)
  await canvas.scrollIntoViewIfNeeded()
  const bounds = await canvas.boundingBox()
  const card = (await snapshot(page)).cards.find((card) => card.id === 'review')
  if (!bounds || !card) throw new Error('missing real geometry')
  await page.mouse.click(bounds.x + card.box.x + 25, bounds.y + card.box.y + 25)
  await expect(app.getByRole('combobox', { name: '当前选中', exact: true })).toHaveValue('review')
  const right = app.getByRole('button', { name: '向右 10px', exact: true })
  await right.focus()
  await page.keyboard.press('Enter')
  await expect
    .poll(async () => (await snapshot(page)).cards.find((card) => card.id === 'review')?.x)
    .toBe(235)
  await expect(app.getByTestId('a11-cards').locator('[data-card="review"]')).toContainText('x=235')
  expect((await snapshot(page)).selected).toEqual([])
  await info.attach('actual-konva-canvas.png', {
    body: await canvas.screenshot(),
    contentType: 'image/png',
  })
})

test('@A11 business pointer drag commits world coordinates and actual container resize preserves nodes', async ({
  page,
}) => {
  const app = await open(page, 'business')
  const canvas = app.getByTestId('a11-canvas-host').locator('canvas')
  await canvas.scrollIntoViewIfNeeded()
  const bounds = await canvas.boundingBox()
  const first = (await snapshot(page)).cards[0]
  if (!bounds) throw new Error('no real canvas')
  const x = bounds.x + first.box.x + 35,
    y = bounds.y + first.box.y + 30
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 55, y + 30, { steps: 10 })
  await page.mouse.up()
  await expect.poll(async () => (await snapshot(page)).cards[0].x).toBe(80)
  await expect.poll(async () => (await snapshot(page)).cards[0].y).toBe(65)
  await expect(app.getByTestId('a11-cards').locator('[data-card="rss"]')).toContainText(
    'x=80, y=65',
  )
  const original = await snapshot(page)
  await app.getByRole('button', { name: '缩窄画布容器', exact: true }).click()
  await expect.poll(async () => (await snapshot(page)).width).toBeLessThan(original.width)
  expect((await snapshot(page)).cards.map((card) => card.id)).toEqual(['rss', 'review'])
  expect((await snapshot(page)).cards[0].x).toBe(80)
  await app.getByRole('button', { name: '恢复画布容器', exact: true }).click()
  await expect.poll(async () => (await snapshot(page)).width).toBe(original.width)
})

test('@A11 actual Transformer folds scale, wheel keeps the world point, deletion and destruction release owned stage', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const app = await open(page, 'advanced')
  const host = app.getByTestId('a11-canvas-host')
  const canvas = host.locator('canvas')
  await canvas.scrollIntoViewIfNeeded()
  const bounds = await canvas.boundingBox()
  const initial = await snapshot(page)
  const anchor = initial.anchors.find((item) => item.name.includes('bottom-right'))
  if (!bounds || !anchor) throw new Error('SDK Transformer did not supply its real handle')
  expect(initial.selected).toEqual(['rss'])
  await page.mouse.move(bounds.x + anchor.x, bounds.y + anchor.y)
  await page.mouse.down()
  await page.mouse.move(bounds.x + anchor.x + 40, bounds.y + anchor.y + 20, { steps: 10 })
  await page.mouse.up()
  await expect.poll(async () => (await snapshot(page)).cards[0].width).toBeGreaterThan(150)
  const transformed = (await snapshot(page)).cards[0]
  expect(transformed.height).toBeGreaterThan(68)
  expect(transformed.scaleX).toBe(1)
  expect(transformed.scaleY).toBe(1)
  const before = await snapshot(page)
  const pointer = { x: 95, y: 90 }
  await page.mouse.move(bounds.x + pointer.x, bounds.y + pointer.y)
  await page.mouse.wheel(0, -120)
  await expect.poll(async () => (await snapshot(page)).zoom).toBeGreaterThan(1)
  const after = await snapshot(page)
  expect(after.cards[0].x).toBe(before.cards[0].x)
  expect((pointer.x - after.position.x) / after.zoom).toBeCloseTo(
    (pointer.x - before.position.x) / before.zoom,
    4,
  )
  expect((pointer.y - after.position.y) / after.zoom).toBeCloseTo(
    (pointer.y - before.position.y) / before.zoom,
    4,
  )
  const zoomedAnchor = after.anchors.find((item) => item.name.includes('bottom-right'))
  if (!zoomedAnchor) throw new Error('Zoomed Transformer has no real handle')
  await page.mouse.move(bounds.x + zoomedAnchor.x, bounds.y + zoomedAnchor.y)
  await page.mouse.down()
  await page.mouse.move(
    bounds.x + zoomedAnchor.x - (after.cards[0].width - 65) * after.zoom,
    bounds.y + zoomedAnchor.y,
    { steps: 30 },
  )
  await page.mouse.up()
  await expect
    .poll(async () => (await snapshot(page)).cards[0].width)
    .toBeLessThan(after.cards[0].width)
  expect((await snapshot(page)).cards[0].width).toBeGreaterThanOrEqual(85)
  expect((await snapshot(page)).cards[0].height).toBeGreaterThanOrEqual(48)
  expect((await snapshot(page)).cards[0].scaleX).toBe(1)
  await app.getByRole('button', { name: '还原缩放', exact: true }).click()
  await expect.poll(async () => (await snapshot(page)).zoom).toBe(1)
  await app.getByRole('button', { name: '新增卡片', exact: true }).click()
  await expect.poll(async () => (await snapshot(page)).cards.length).toBe(3)
  await app.getByRole('combobox', { name: '当前选中', exact: true }).selectOption('node-1')
  await expect.poll(async () => (await snapshot(page)).selected).toEqual(['node-1'])
  await app.getByRole('button', { name: '删除选中', exact: true }).click()
  await expect.poll(async () => (await snapshot(page)).cards.length).toBe(2)
  expect((await snapshot(page)).cards.some((card) => card.id === 'node-1')).toBe(false)
  const retained = await host.elementHandle()
  if (!retained) throw new Error('host missing')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  expect(
    await retained.evaluate((element) =>
      JSON.parse(element.getAttribute('data-konva-cleanup') || 'null'),
    ),
  ).toEqual({ registered: false, children: 0, canvases: 0 })
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(page.getByTestId('a11-canvas-host').locator('canvas')).toHaveCount(1)
  await page.getByRole('tab', { name: 'Agent 指南', exact: true }).click()
  await expect(page.locator('.konvajs-content')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('@A11 pinned official README and checked homepage use shared panels', async ({ page }) => {
  await page.goto('/libraries/konva?tab=readme')
  await expect(page.getByRole('heading', { name: '官方 README 原文', exact: true })).toBeVisible()
  await expect(page.locator('.prose')).not.toBeEmpty()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByRole('link', { name: '打开上游原文' })).toHaveAttribute(
    'href',
    /\/d95eed6d46e785efba6ab5e9eaf5a1d6bbb528c6\/README.md/u,
  )
  await page.getByRole('tab', { name: '官网预览', exact: true }).click()
  await expect(page.getByRole('link', { name: /打开官网/u })).toHaveAttribute(
    'href',
    'https://konvajs.org/',
  )
  await expect(page.locator('iframe')).toHaveCount(0)
  await page.getByText(/查看检查依据/u).click()
  await expect(page.getByText(/X-Frame-Options: SAMEORIGIN/u)).toBeVisible()
})
