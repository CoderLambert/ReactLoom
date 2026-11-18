import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { chromium } from '@playwright/test'

// Existing candidate dist only. No trace/HAR, response body persistence, SDK patch or asset copy.
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1400 } })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('http://127.0.0.1:4319/libraries/rive-react?tab=demo&example=basic')
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  if (await run.isVisible()) await run.click()
  const app = page.getByTestId('b05-workshop')
  await app.getByText('查看真实Rive对象与绘制事件', { exact: true }).click()
  const read = async () => {
    await app.getByRole('button', { name: '读取真实播放器', exact: true }).click()
    return JSON.parse((await app.getByTestId('b05-sdk-state').textContent()) || 'null')
  }
  let initial
  for (let attempt = 0; attempt < 100; attempt++) {
    initial = await read()
    if (initial?.contractMatches && initial.isPlaying) break
    await page.waitForTimeout(200)
  }
  assert.equal(initial?.isPlaying, true)
  const samples = []
  for (let index = 0; index < 4; index++) {
    await page.waitForTimeout(180)
    const png = await app.getByTestId('b05-canvas').screenshot()
    samples.push({
      state: await read(),
      canvasPngSha256: createHash('sha256').update(png).digest('hex'),
    })
  }
  console.log(JSON.stringify({ initial, samples }, null, 2))
  assert.ok(
    samples.at(-1).state.observedDrawEvents > initial.observedDrawEvents,
    'actual Draw count must advance',
  )
} finally {
  await browser.close()
}
