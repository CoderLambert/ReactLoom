import { expect, test } from '@playwright/test'

const appName = 'wavesurfer真实音频实验'
type AudioProbe = { media: HTMLAudioElement; pause: number; drop: number; load: number }
type WaveProbe = {
  audios: AudioProbe[]
  created: string[]
  revoked: string[]
  contexts: number
  closed: number
}
async function install(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const p: WaveProbe = { audios: [], created: [], revoked: [], contexts: 0, closed: 0 }
    Object.assign(window, { e18Probe: p })
    const create = document.createElement
    document.createElement = new Proxy(create, {
      apply(target, receiver, args) {
        const element = Reflect.apply(target, receiver, args)
        if (String(args[0]).toLowerCase() === 'audio') {
          const media = element as HTMLAudioElement,
            probe = { media, pause: 0, drop: 0, load: 0 }
          p.audios.push(probe)
          const pause = media.pause,
            remove = media.removeAttribute,
            load = media.load
          media.pause = function () {
            probe.pause++
            return pause.call(this)
          }
          media.removeAttribute = function (name) {
            if (name === 'src') probe.drop++
            return remove.call(this, name)
          }
          media.load = function () {
            probe.load++
            return load.call(this)
          }
        }
        return element
      },
    })
    const createURL = URL.createObjectURL,
      revokeURL = URL.revokeObjectURL
    URL.createObjectURL = function (blob) {
      const url = createURL.call(this, blob)
      p.created.push(url)
      return url
    }
    URL.revokeObjectURL = function (url) {
      p.revoked.push(url)
      return revokeURL.call(this, url)
    }
    if (window.AudioContext) {
      window.AudioContext = new Proxy(window.AudioContext, {
        construct(target, args) {
          const context = Reflect.construct(target, args) as AudioContext
          p.contexts++
          const close = context.close
          context.close = function () {
            return close.call(this).then(() => {
              p.closed++
            })
          }
          return context
        },
      })
    }
  })
}
test('@E18 actual decode/play/seek/rate/visible zoom and native cleanup', async ({ page }) => {
  await install(page)
  await page.goto('/libraries/wavesurferjs8?tab=demo&example=basic')
  const app = page.getByRole('region', { name: appName, exact: true })
  await expect(app.locator('p[role="status"]')).toHaveText('真实WAV已解码，可以播放')
  await expect(app.getByTestId('wave-duration')).toHaveText('1.60')
  await expect(app.locator('canvas').first()).toBeVisible()
  await app.getByRole('button', { name: '播放', exact: true }).click()
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { e18Probe: WaveProbe }).e18Probe.audios.at(-1)?.media
            .currentTime ?? 0,
      ),
    )
    .toBeGreaterThan(0)
  await app.getByRole('button', { name: '暂停', exact: true }).click()
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('business')
  await expect(app.locator('p[role="status"]')).toHaveText('真实WAV已解码，可以播放')
  await app.getByRole('button', { name: '跳到0.8秒', exact: true }).click()
  await expect(app.getByTestId('wave-current')).toHaveText('0.80')
  await page.getByRole('combobox', { name: '学习场景' }).selectOption('advanced')
  await expect(app.locator('p[role="status"]')).toHaveText('真实WAV已解码，可以播放')
  await app.getByRole('combobox', { name: '倍速' }).selectOption('1.5')
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { e18Probe: WaveProbe }).e18Probe.audios.at(-1)?.media.playbackRate,
    ),
  ).toBe(1.5)
  const scroll = app.locator('[part="scroll"]')
  await app.getByRole('button', { name: '放大波形', exact: true }).click()
  await expect.poll(() => scroll.evaluate((el) => el.scrollWidth > el.clientWidth * 1.5)).toBe(true)
  await app.getByRole('button', { name: '复原', exact: true }).click()
  await expect.poll(() => scroll.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true)
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect
    .poll(() =>
      page.evaluate(() => {
        const p = (window as unknown as { e18Probe: WaveProbe }).e18Probe
        return (
          p.audios.length > 0 &&
          p.audios.every(
            (a) =>
              a.pause > 0 &&
              a.drop > 0 &&
              a.load > 0 &&
              a.media.paused &&
              a.media.getAttribute('src') === null,
          )
        )
      }),
    )
    .toBe(true)
  await expect
    .poll(() =>
      page.evaluate(() => {
        const p = (window as unknown as { e18Probe: WaveProbe }).e18Probe
        return (
          p.created.length > 0 &&
          p.created.every((url) => p.revoked.includes(url)) &&
          p.contexts > 0 &&
          p.closed === p.contexts
        )
      }),
    )
    .toBe(true)
})

test('@E18 unloading during held blob fetch aborts the real fetch signal and releases URL', async ({
  page,
}) => {
  await install(page)
  await page.addInitScript(() => {
    const original = window.fetch
    const probe = { seen: false, aborted: false }
    Object.assign(window, { e18Fetch: probe })
    window.fetch = (input, init) => {
      if (typeof input === 'string' && input.startsWith('blob:')) {
        probe.seen = true
        return new Promise<Response>((_, reject) => {
          const fail = () => {
            probe.aborted = true
            reject(new DOMException('test abort', 'AbortError'))
          }
          if (init?.signal?.aborted) fail()
          else init?.signal?.addEventListener('abort', fail, { once: true })
        })
      }
      return original(input, init)
    }
  })
  await page.goto('/libraries/wavesurferjs8?tab=demo&example=basic')
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { e18Fetch: { seen: boolean } }).e18Fetch.seen),
    )
    .toBe(true)
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { e18Fetch: { aborted: boolean } }).e18Fetch.aborted,
      ),
    )
    .toBe(true)
})
