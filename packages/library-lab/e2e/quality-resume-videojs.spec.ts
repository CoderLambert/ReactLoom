import { expect, type Page, test } from '@playwright/test'

type MediaProbe = {
  tracks: MediaStreamTrack[]
  stopped: number
  created: string[]
  revoked: string[]
  blobs: Blob[]
  recorders: MediaRecorder[]
}
async function installProbe(page: Page) {
  await page.addInitScript(() => {
    const p: MediaProbe = {
      tracks: [],
      stopped: 0,
      created: [],
      revoked: [],
      blobs: [],
      recorders: [],
    }
    Object.assign(window, { mediaProbe: p })
    const capture = HTMLCanvasElement.prototype.captureStream
    HTMLCanvasElement.prototype.captureStream = function (...args) {
      const stream = capture.apply(this, args)
      for (const track of stream.getTracks()) {
        p.tracks.push(track)
        const stop = track.stop.bind(track)
        track.stop = () => {
          p.stopped++
          stop()
        }
      }
      return stream
    }
    const start = MediaRecorder.prototype.start
    MediaRecorder.prototype.start = function (...args) {
      p.recorders.push(this)
      return start.apply(this, args)
    }
    const create = URL.createObjectURL,
      revoke = URL.revokeObjectURL
    URL.createObjectURL = (blob) => {
      const url = create(blob)
      if (blob instanceof Blob && blob.type.startsWith('video/')) {
        p.created.push(url)
        p.blobs.push(blob)
      }
      return url
    }
    URL.revokeObjectURL = (url) => {
      p.revoked.push(url)
      revoke(url)
    }
  })
}
async function state(page: Page) {
  return page.evaluate(() => {
    const p = (window as unknown as { mediaProbe: MediaProbe }).mediaProbe
    return {
      tracks: p.tracks.length,
      ended: p.tracks.every((t) => t.readyState === 'ended'),
      stopped: p.stopped,
      created: p.created,
      revoked: p.revoked,
      inactive: p.recorders.every((r) => r.state === 'inactive'),
    }
  })
}
const name = 'Video.js v10真实播放器'
test('@E16 original WebM decoding, real playback, replacement and local import', async ({
  page,
}) => {
  await installProbe(page)
  await page.goto('/libraries/videojs-v10?tab=demo&example=basic')
  const app = page.getByRole('region', { name, exact: true })
  await expect(app.locator('video')).toHaveCount(0)
  await app.getByRole('button', { name: '制作本地片头', exact: true }).click()
  await expect(app.locator('p[role=status]')).toContainText('已加载本地素材')
  await expect
    .poll(async () => app.locator('video').evaluate((v) => (v as HTMLVideoElement).readyState))
    .toBeGreaterThanOrEqual(2)
  expect(
    await app
      .locator('video')
      .evaluate((v) => [(v as HTMLVideoElement).videoWidth, (v as HTMLVideoElement).videoHeight]),
  ).toEqual([320, 180])
  await app
    .getByRole('button', { name: /^(Play|Play video)$/i })
    .first()
    .click()
  await expect
    .poll(async () => app.locator('video').evaluate((v) => (v as HTMLVideoElement).currentTime))
    .toBeGreaterThan(0)
  expect((await state(page)).ended).toBe(true)
  const encoded = await page.evaluate(async () => {
    const blob = (window as unknown as { mediaProbe: MediaProbe }).mediaProbe.blobs[0]
    const bytes = new Uint8Array(await blob.arrayBuffer())
    let binary = ''
    for (const byte of bytes) binary += String.fromCharCode(byte)
    return btoa(binary)
  })
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('business')
  await app.getByRole('button', { name: '制作本地片头', exact: true }).click()
  await expect(app.locator('p[role=status]')).toContainText('已加载本地素材')
  const old = await app.locator('video').getAttribute('src')
  await app.locator('video').evaluate((video) => {
    Object.assign(window, { e16OldVideo: video })
  })
  await app.getByRole('button', { name: '切换深色片头', exact: true }).click()
  await expect.poll(async () => app.locator('video').getAttribute('src')).not.toBe(old)
  await expect.poll(async () => (await state(page)).revoked).toContain(old)
  expect(
    await page.evaluate(
      () => (window as unknown as { e16OldVideo: HTMLVideoElement }).e16OldVideo.isConnected,
    ),
  ).toBe(false)
  await expect
    .poll(() =>
      page.evaluate(() => {
        const old = (window as unknown as { e16OldVideo: HTMLVideoElement }).e16OldVideo
        return old.paused && old.getAttribute('src') === null && old.readyState === 0
      }),
    )
    .toBe(true)
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('advanced')
  const input = app.getByLabel('导入本地视频', { exact: true })
  await input.setInputFiles({
    name: 'original.webm',
    mimeType: 'video/webm',
    buffer: Buffer.from(encoded, 'base64'),
  })
  await expect
    .poll(async () => app.locator('video').evaluate((v) => (v as HTMLVideoElement).readyState))
    .toBeGreaterThanOrEqual(2)
  const current = await app.locator('video').getAttribute('src')
  await input.setInputFiles({
    name: 'bad.webm',
    mimeType: 'video/webm',
    buffer: Buffer.from('this is not real video content'),
  })
  await expect(app.locator('p[role=status]')).toContainText('文件校验失败')
  await expect(app.locator('video')).toHaveAttribute('src', current ?? '')
  await app.getByRole('button', { name: '移除与释放', exact: true }).click()
  await expect(app.locator('video')).toHaveCount(0)
  await expect
    .poll(async () => {
      const p = await state(page)
      return p.created.every((url) => p.revoked.includes(url))
    })
    .toBe(true)
})

test('@E16 removal and host unmount stop actual active recording tracks', async ({ page }) => {
  await installProbe(page)
  await page.goto('/libraries/videojs-v10?tab=demo&example=advanced')
  const app = page.getByRole('region', { name, exact: true })
  await app.getByRole('button', { name: '制作本地片头', exact: true }).click()
  await expect.poll(async () => (await state(page)).tracks).toBe(1)
  expect((await state(page)).ended).toBe(false)
  await app.getByRole('button', { name: '移除与释放', exact: true }).click()
  await expect.poll(async () => (await state(page)).ended).toBe(true)
  expect((await state(page)).inactive).toBe(true)
  expect((await state(page)).created).toEqual([])
  await app.getByRole('button', { name: '制作本地片头', exact: true }).click()
  await expect.poll(async () => (await state(page)).tracks).toBe(2)
  expect((await state(page)).ended).toBe(false)
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect.poll(async () => (await state(page)).ended).toBe(true)
  const final = await state(page)
  expect(final.stopped).toBe(2)
  expect(final.inactive).toBe(true)
  expect(final.created).toEqual([])
})
