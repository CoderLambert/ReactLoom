// NOT_RUN: root adopts this into shared Playwright after a matching build.
// Actual Leaflet SVG/DOM and native controls only; no tile/provider requests or SDK mocks.
import { expect, type Locator, type Page, test } from '@playwright/test'

type Snapshot = {
  instance: number
  center: number[]
  zoom: number
  size: number[]
  resizeEvents: number
  tileLayers: number
  points: {
    id: string
    layerId: number
    latlng: number[]
    geojsonCoordinates: number[]
    containerPoint: number[]
    radius: number
    inGroup: boolean
    popupOpen: boolean
  }[]
}
async function state(app: Locator): Promise<Snapshot> {
  return JSON.parse((await app.getByTestId('a15-sdk-state').textContent()) ?? 'null')
}
async function open(page: Page, level: 'basic' | 'business' | 'advanced') {
  await page.setViewportSize({ width: 1280, height: 1600 })
  await page.goto(`/libraries/leaflet?tab=demo&example=${level}`)
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  if (await run.isVisible()) await run.click()
  const app = page.getByRole('region', { name: 'Leaflet 离线位置图', exact: true })
  await expect(app.getByTestId('a15-status')).toContainText('地图已就绪')
  await expect.poll(async () => (await state(app))?.points.length ?? 0).toBe(3)
  return app
}

test('@A15 actual coordinates, SVG hit, persistent popup and keyboard viewport', async ({
  page,
}, info) => {
  const requests: string[] = []
  page.on('request', (request) => {
    requests.push(request.url())
  })
  const app = await open(page, 'basic')
  const snapshot = await state(app)
  expect(snapshot.tileLayers).toBe(0)
  const seattle = snapshot.points.find((point) => point.id === 'sea')
  if (!seattle) throw new Error('No actual Seattle layer')
  expect(seattle.latlng).toEqual([47.6062, -122.3321])
  expect(seattle.geojsonCoordinates).toEqual([-122.3321, 47.6062])
  const map = app.getByTestId('a15-owned-map')
  await expect(map.locator('svg path[data-location-id]')).toHaveCount(3)
  const sf = map.locator('path[data-location-id="sfo"]')
  await expect(sf).toHaveAttribute('d', /M.+/)
  await sf.click()
  await expect(app.getByTestId('a15-selection')).toContainText('sfo')
  await expect(map.locator('.leaflet-popup-content')).toContainText('产品更新')
  await expect
    .poll(async () => (await state(app)).points.find((point) => point.id === 'sfo')?.popupOpen)
    .toBe(true)
  await expect
    .poll(async () => (await state(app)).points.find((point) => point.id === 'sfo')?.radius)
    .toBe(12)
  // Selection must retain the same SVG layer; rebuilding it would close the popup.
  expect((await state(app)).points.find((point) => point.id === 'sfo')?.layerId).toBe(
    snapshot.points.find((point) => point.id === 'sfo')?.layerId,
  )
  const nyc = app.getByRole('button', { name: '定位 行业资讯', exact: true })
  await nyc.focus()
  await nyc.press('Enter')
  await expect(map.locator('.leaflet-popup-content')).toContainText('行业资讯')
  await expect
    .poll(async () => {
      const current = await state(app)
      const point = current.points.find((point) => point.id === 'nyc')
      return point
        ? Math.max(
            Math.abs(point.containerPoint[0] - current.size[0] / 2),
            Math.abs(point.containerPoint[1] - current.size[1] / 2),
          )
        : Infinity
    })
    .toBeLessThanOrEqual(1)
  expect((await state(app)).points.find((point) => point.id === 'nyc')?.latlng[1]).toBe(-74.006)
  await map.scrollIntoViewIfNeeded()
  const nativeMap = page.getByRole('region', { name: '可平移缩放的Leaflet点位地图', exact: true })
  const beforePan = (await state(app)).center[1]
  await nativeMap.focus()
  await nativeMap.press('ArrowRight')
  await expect.poll(async () => (await state(app)).center[1]).toBeGreaterThan(beforePan)
  const zoom = (await state(app)).zoom
  await map.getByRole('button', { name: 'Zoom in', exact: true }).click()
  await expect.poll(async () => (await state(app)).zoom).toBe(zoom + 1)
  expect((await state(app)).points.find((point) => point.id === 'sfo')?.latlng).toEqual([
    37.7749, -122.4194,
  ])
  expect((await state(app)).points.find((point) => point.id === 'sfo')?.radius).toBe(8)
  const origin = new URL(page.url()).origin
  expect(
    requests.filter((request) => {
      const url = new URL(request)
      return ['http:', 'https:'].includes(url.protocol) && url.origin !== origin
    }),
  ).toEqual([])
  await app.getByTestId('a15-map').screenshot({ path: info.outputPath('a15-real-map.png') })
  await info.attach('a15-real-map.png', {
    path: info.outputPath('a15-real-map.png'),
    contentType: 'image/png',
  })
})

test('@A15 filter removes only exiting layers, falls back selection and preserves camera', async ({
  page,
}) => {
  const app = await open(page, 'business')
  const before = await state(app)
  await app.getByRole('button', { name: '定位 行业资讯', exact: true }).click()
  await expect
    .poll(async () => {
      const current = await state(app)
      const point = current.points.find((point) => point.id === 'nyc')
      return point
        ? Math.max(
            Math.abs(point.containerPoint[0] - current.size[0] / 2),
            Math.abs(point.containerPoint[1] - current.size[1] / 2),
          )
        : Infinity
    })
    .toBeLessThanOrEqual(1)
  expect((await state(app)).points.find((point) => point.id === 'nyc')?.latlng[1]).toBe(-74.006)
  const camera = (await state(app)).center
  const filter = app.getByRole('checkbox', { name: '仅显示已启用来源', exact: true })
  await filter.check()
  await expect.poll(async () => (await state(app)).points.length).toBe(2)
  await expect(app.getByTestId('a15-row-nyc')).toHaveCount(0)
  await expect(app.locator('.leaflet-popup-content')).toHaveCount(0)
  await expect(app.getByTestId('a15-selection')).toContainText('选中ID：sea')
  const after = await state(app)
  expect(after.instance).toBe(before.instance)
  expect(after.center).toEqual(camera)
  for (const point of after.points) {
    expect(point.layerId).toBe(before.points.find((item) => item.id === point.id)?.layerId)
    expect(point.inGroup).toBe(true)
  }
  await expect(app.getByTestId('a15-owned-map').locator('path[data-location-id]')).toHaveCount(2)
  await app.getByRole('button', { name: '定位 产品更新', exact: true }).click()
  await expect(app.locator('.leaflet-popup-content')).toContainText('产品更新')
  await filter.uncheck()
  await expect.poll(async () => (await state(app)).points.length).toBe(3)
  await expect
    .poll(async () => (await state(app)).points.find((point) => point.id === 'sfo')?.popupOpen)
    .toBe(true)
  expect((await state(app)).points.find((point) => point.id === 'sfo')?.layerId).toBe(
    before.points.find((point) => point.id === 'sfo')?.layerId,
  )
})

test('@A15 bounded local updates, empty state, true resize and map unload/remove', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const app = await open(page, 'advanced')
  const original = await state(app)
  const sea = original.points.find((point) => point.id === 'sea')
  if (!sea) throw new Error('No actual initial Seattle')
  await app.getByRole('button', { name: '模拟更新Seattle坐标', exact: true }).click()
  await expect
    .poll(async () => (await state(app)).points.find((point) => point.id === 'sea')?.latlng[0])
    .toBeCloseTo(47.8562, 6)
  const moved = (await state(app)).points.find((point) => point.id === 'sea')
  expect(moved?.latlng[1]).toBeCloseTo(-122.0821, 6)
  expect(moved?.layerId).toBe(sea.layerId)
  const filter = app.getByRole('checkbox', { name: '仅显示已启用来源', exact: true })
  await filter.check()
  const remove = app.getByRole('button', { name: '删除选中', exact: true })
  await remove.click() // sea, then visible-selection fallback sfo
  await remove.click()
  await expect(app.getByTestId('a15-empty')).toBeVisible()
  await expect.poll(async () => (await state(app)).points.length).toBe(0)
  await expect(remove).toBeDisabled()
  await expect(app.getByRole('button', { name: '定位全部可见点', exact: true })).toBeDisabled()
  await filter.uncheck()
  await expect.poll(async () => (await state(app)).points.length).toBe(1) // paused nyc remains
  const add = app.getByRole('button', { name: '新增模拟来源（同时最多40条）', exact: true })
  for (let i = 0; i < 40; i++) await add.click()
  await expect(add).toBeDisabled()
  await expect.poll(async () => (await state(app)).points.length).toBe(41)
  await expect(app.getByTestId('a15-selection')).toContainText('额外来源 40/40')
  await remove.click() // site-40
  await expect(add).toBeEnabled()
  await add.click()
  await expect
    .poll(async () => (await state(app)).points.some((point) => point.id === 'site-41'))
    .toBe(true)
  expect((await state(app)).points.some((point) => point.id === 'site-40')).toBe(false)
  expect(new Set((await state(app)).points.map((point) => point.id)).size).toBe(41)
  const beforeResize = await state(app)
  await app.getByRole('checkbox', { name: '使用窄容器', exact: true }).check()
  await expect.poll(async () => (await state(app)).size[0]).toBeLessThan(beforeResize.size[0])
  await expect
    .poll(async () => (await state(app)).resizeEvents)
    .toBeGreaterThan(beforeResize.resizeEvents)
  expect((await state(app)).instance).toBe(original.instance)
  await app.getByRole('button', { name: '定位全部可见点', exact: true }).click()
  const fit = await state(app)
  for (const point of fit.points) {
    expect(point.containerPoint[0]).toBeGreaterThanOrEqual(0)
    expect(point.containerPoint[0]).toBeLessThanOrEqual(fit.size[0])
    expect(point.containerPoint[1]).toBeGreaterThanOrEqual(0)
    expect(point.containerPoint[1]).toBeLessThanOrEqual(fit.size[1])
  }
  const oldMount = await app.getByTestId('a15-owned-map').elementHandle()
  if (!oldMount) throw new Error('No original owned map')
  await app.getByRole('button', { name: '重新创建地图', exact: true }).click()
  await expect.poll(async () => (await state(app)).instance).toBeGreaterThan(original.instance)
  expect(
    await oldMount.evaluate((element) => ({
      connected: element.isConnected,
      children: element.childElementCount,
      removed: element.getAttribute('data-map-removed'),
      unloaded: element.getAttribute('data-unload-events'),
    })),
  ).toEqual({ connected: false, children: 0, removed: 'true', unloaded: '1' })
  await expect(app.getByTestId('a15-owned-map')).toHaveCount(1)
  const current = await app.getByTestId('a15-owned-map').elementHandle()
  if (!current) throw new Error('No replacement map')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  expect(await current.getAttribute('data-map-removed')).toBe('true')
  expect(await current.getAttribute('data-unload-events')).toBe('1')
  expect(await current.getAttribute('data-cleanup-error')).toBeNull()
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect.poll(async () => (await state(app))?.points.length ?? 0).toBe(3)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(async () => (await state(app)).size[0]).toBeLessThanOrEqual(390)
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
  ).toBeLessThanOrEqual(1)
  expect(errors).toEqual([])
})

// These remain NOT_RUN until root executes actual Chromium. No Node numerical test, policy result,
// app-owned cleanup marker alone or fake SVG can satisfy map/DOM/network/resource behavior.
