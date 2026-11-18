import { expect, type Page, test } from '@playwright/test'

type Snapshot = {
  geometry: { uuid: string; type: string; positions: number }
  mesh: string
  material: string
  color: string
  rotation: { x: number; y: number }
  size: number[]
  drawingBuffer: number[]
  pixelRatio: number
  cameraAspect: number
  render: { frame: number; calls: number; triangles: number }
  memory: { geometries: number; textures: number }
  geometryDisposals: number
  materialDisposals: number
  loopActive: boolean
}
async function read(page: Page): Promise<Snapshot> {
  await page.getByRole('button', { name: '读取当前渲染状态', exact: true }).click()
  return JSON.parse((await page.getByTestId('a13-sdk-state').textContent()) || 'null')
}
async function open(page: Page, level: 'basic' | 'advanced') {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`/libraries/threejs?tab=demo&example=${level}`)
  const app = page.getByRole('region', { name: 'Three.js 真实三维场景', exact: true })
  await expect(app.getByTestId('a13-canvas-host').locator('canvas')).toHaveCount(1)
  await expect(app.getByRole('alert')).toHaveCount(0)
  await app.getByText('查看真实渲染器与资源', { exact: true }).click()
  return app
}
async function nonBackgroundPixels(page: Page, png: Buffer) {
  // Decode an actual compositor screenshot using the browser's native image decoder.
  // This temporary 2D canvas never replaces or supplies output to Three.js/WebGL.
  return page.evaluate(async (bytes) => {
    const bitmap = await createImageBitmap(new Blob([new Uint8Array(bytes)], { type: 'image/png' }))
    try {
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('native PNG decoding context unavailable')
      context.drawImage(bitmap, 0, 0)
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
      let count = 0
      for (let y = Math.floor(canvas.height * 0.2); y < canvas.height * 0.8; y++)
        for (let x = Math.floor(canvas.width * 0.2); x < canvas.width * 0.8; x++) {
          const index = (y * canvas.width + x) * 4
          if (
            Math.abs(pixels[index] - 234) +
              Math.abs(pixels[index + 1] - 240) +
              Math.abs(pixels[index + 2] - 233) >
            40
          )
            count++
        }
      return count
    } finally {
      bitmap.close()
    }
  }, Array.from(png))
}

test('@A13 actual WebGL2 geometry paints, material changes reuse objects and resize updates camera', async ({
  page,
}, info) => {
  const app = await open(page, 'basic')
  const canvas = app.getByTestId('a13-canvas-host').locator('canvas')
  const initial = await read(page)
  expect(initial.geometry.type).toBe('BoxGeometry')
  expect(initial.geometry.positions).toBe(24)
  expect(initial.render.calls).toBeGreaterThan(0)
  expect(initial.render.triangles).toBeGreaterThan(0)
  expect(initial.loopActive).toBe(false)
  expect(initial.cameraAspect).toBeCloseTo(initial.size[0] / initial.size[1], 5)
  expect(initial.drawingBuffer[0]).toBe(Math.floor(initial.size[0] * initial.pixelRatio))
  const png = await canvas.screenshot({ path: info.outputPath('actual-three-box.png') })
  expect(await nonBackgroundPixels(page, png)).toBeGreaterThan(1000)
  const held = await canvas.elementHandle()
  if (!held) throw new Error('real canvas missing')
  await app.getByRole('combobox', { name: /材质颜色/u }).selectOption('#c07b37')
  const changed = await read(page)
  expect(changed.color).toBe('c07b37')
  expect(changed.material).toBe(initial.material)
  expect(changed.mesh).toBe(initial.mesh)
  expect(changed.geometry.uuid).toBe(initial.geometry.uuid)
  const orange = await canvas.screenshot({ path: info.outputPath('actual-three-orange.png') })
  expect(orange.equals(png)).toBe(false)
  expect(await nonBackgroundPixels(page, orange)).toBeGreaterThan(1000)
  await app.getByRole('button', { name: '缩窄渲染容器', exact: true }).click()
  await expect.poll(async () => (await read(page)).size[0]).toBeLessThan(initial.size[0])
  const narrow = await read(page)
  expect(narrow.cameraAspect).toBeCloseTo(narrow.size[0] / 280, 5)
  expect(
    await held.evaluate(
      (node) => node === document.querySelector('[data-testid="a13-canvas-host"] canvas'),
    ),
  ).toBe(true)
  await app.getByRole('button', { name: '恢复渲染容器', exact: true }).click()
  await expect.poll(async () => (await read(page)).size[0]).toBe(initial.size[0])
})

test('@A13 real animation gate, geometry disposal and detached WebGL context cleanup', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const app = await open(page, 'advanced')
  const canvas = app.getByTestId('a13-canvas-host').locator('canvas')
  const still = await read(page)
  await page.waitForTimeout(160)
  expect((await read(page)).render.frame).toBe(still.render.frame)
  await app.getByRole('checkbox', { name: '允许显式覆盖减少动态偏好', exact: true }).check()
  await expect.poll(async () => (await read(page)).render.frame).toBeGreaterThan(still.render.frame)
  await app.getByRole('button', { name: '暂停动画', exact: true }).click()
  const paused = await read(page)
  expect(paused.loopActive).toBe(false)
  await page.waitForTimeout(160)
  expect((await read(page)).render.frame).toBe(paused.render.frame)
  const shape = app.getByRole('combobox', { name: '几何体', exact: true })
  for (const value of ['sphere', 'box', 'sphere']) await shape.selectOption(value)
  const final = await read(page)
  expect(final.geometry.type).toBe('SphereGeometry')
  expect(final.geometry.uuid).not.toBe(paused.geometry.uuid)
  expect(final.geometry.positions).toBeGreaterThan(24)
  expect(final.mesh).toBe(paused.mesh)
  expect(final.material).toBe(paused.material)
  expect(final.geometryDisposals).toBe(3)
  expect(final.materialDisposals).toBe(0)
  expect(final.memory.geometries).toBe(1)
  const screenshot = await canvas.screenshot({ path: info.outputPath('actual-three-sphere.png') })
  expect(await nonBackgroundPixels(page, screenshot)).toBeGreaterThan(1000)
  const retained = await canvas.elementHandle()
  if (!retained) throw new Error('canvas missing before cleanup')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  expect(
    await retained.evaluate((node) =>
      JSON.parse(node.getAttribute('data-three-cleanup') || 'null'),
    ),
  ).toEqual({ geometryDisposals: 4, materialDisposals: 1 })
  expect(await retained.evaluate((node) => node.isConnected)).toBe(false)
  await expect
    .poll(() =>
      retained.evaluate((node) => {
        if (!(node instanceof HTMLCanvasElement)) throw new Error('not Canvas')
        return node.getContext('webgl2')?.isContextLost() ?? false
      }),
    )
    .toBe(true)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(app.getByTestId('a13-canvas-host').locator('canvas')).toHaveCount(1)
  await page.getByRole('tab', { name: 'Agent 指南', exact: true }).click()
  await expect(page.getByTestId('a13-canvas-host')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('@A13 official matching release README and current homepage use shared panels', async ({
  page,
}) => {
  await page.goto('/libraries/threejs?tab=readme')
  await expect(page.getByRole('heading', { name: '官方 README 原文', exact: true })).toBeVisible()
  await expect(page.locator('.prose')).not.toBeEmpty()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByRole('link', { name: '打开上游原文' })).toHaveAttribute(
    'href',
    /\/148ef33ecb6d2502ff796d4554abd1549c95d519\/README.md/u,
  )
  await page.getByRole('tab', { name: '官网预览', exact: true }).click()
  await expect(page.getByRole('link', { name: /打开官网/u })).toHaveAttribute(
    'href',
    'https://threejs.org/',
  )
  await expect(page.locator('iframe')).toHaveCount(0)
})
