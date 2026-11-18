import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { expect, type Locator, type Page, type TestInfo, test } from '@playwright/test'
import { inspectPcmWav } from '../examples/wav-output-policy.mjs'

type WorkerEvent = { id: number; direction: 'send' | 'receive' | 'terminate'; type: string }
type Probe = {
  events: WorkerEvent[]
  reads: string[]
  urls: string[]
  revoked: string[]
  execTimeouts: number[]
  atLog?: { type: string; phase: string | null; receivedExec: boolean; message: string }
  cancelOnLog: boolean
}
async function probeState(page: Page) {
  return page.evaluate(() => (window as unknown as { e19Probe: Probe }).e19Probe)
}
async function open(page: Page, level: 'basic' | 'business' | 'advanced') {
  await page.addInitScript(() => {
    const p: Probe = {
      events: [],
      reads: [],
      urls: [],
      revoked: [],
      execTimeouts: [],
      cancelOnLog: false,
    }
    Object.assign(window, { e19Probe: p })
    const fileRead = File.prototype.arrayBuffer
    File.prototype.arrayBuffer = function () {
      p.reads.push(this.name)
      return fileRead.call(this)
    }
    const create = URL.createObjectURL
    const revoke = URL.revokeObjectURL
    URL.createObjectURL = (object) => {
      const url = create(object)
      if (object instanceof Blob && object.type === 'audio/wav') p.urls.push(url)
      return url
    }
    URL.revokeObjectURL = (url) => {
      p.revoked.push(url)
      revoke(url)
    }
    let nextId = 0
    window.Worker = new Proxy(window.Worker, {
      construct(target, args) {
        const worker = Reflect.construct(target, args) as Worker
        const id = ++nextId
        let tracked = false
        let pendingExec = false
        const post = worker.postMessage.bind(worker)
        const terminate = worker.terminate.bind(worker)
        worker.postMessage = (
          ...parameters: [message: unknown, options?: Transferable[] | StructuredSerializeOptions]
        ) => {
          const message = parameters[0]
          const type =
            message && typeof message === 'object' && 'type' in message ? String(message.type) : ''
          if (type === 'LOAD') tracked = true
          if (type === 'EXEC') {
            pendingExec = true
            const data = (message as { data?: { timeout?: unknown } }).data
            if (typeof data?.timeout === 'number') p.execTimeouts.push(data.timeout)
          }
          if (tracked) p.events.push({ id, direction: 'send', type })
          Reflect.apply(post, undefined, parameters)
        }
        worker.terminate = () => {
          if (tracked) p.events.push({ id, direction: 'terminate', type: '' })
          terminate()
        }
        worker.addEventListener('message', (event) => {
          if (!tracked) return
          const type = String(event.data?.type ?? '')
          p.events.push({ id, direction: 'receive', type })
          if (type === 'EXEC') pendingExec = false
          const message = String(event.data?.data?.message ?? '')
          if (p.cancelOnLog && pendingExec && type === 'LOG' && message.includes('Input #0')) {
            p.cancelOnLog = false
            const app = document.querySelector('[data-testid=e19-workshop]')
            p.atLog = {
              type,
              phase: app?.getAttribute('data-phase') ?? null,
              receivedExec: p.events.some(
                (e) => e.id === id && e.direction === 'receive' && e.type === 'EXEC',
              ),
              message,
            }
            const button = [...(app?.querySelectorAll('button') ?? [])].find(
              (item) => item.textContent === '立即取消并终止Worker',
            )
            button?.click()
          }
        })
        return worker
      },
    })
  })
  await page.goto(`/libraries/ffmpeg-wasm?tab=demo&example=${level}`)
  const app = page.getByTestId('e19-workshop')
  await expect(app).toBeVisible()
  return app
}
function stereoWav(seconds = 1) {
  const rate = 48_000
  const samples = rate * seconds
  const bytes = Buffer.alloc(44 + samples * 4)
  bytes.write('RIFF', 0)
  bytes.writeUInt32LE(bytes.length - 8, 4)
  bytes.write('WAVEfmt ', 8)
  bytes.writeUInt32LE(16, 16)
  bytes.writeUInt16LE(1, 20)
  bytes.writeUInt16LE(2, 22)
  bytes.writeUInt32LE(rate, 24)
  bytes.writeUInt32LE(rate * 4, 28)
  bytes.writeUInt16LE(4, 32)
  bytes.writeUInt16LE(16, 34)
  bytes.write('data', 36)
  bytes.writeUInt32LE(samples * 4, 40)
  for (let i = 0; i < samples; i++) {
    bytes.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / rate) * 9000), 44 + i * 4)
    bytes.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 660 * i) / rate) * 9000), 46 + i * 4)
  }
  return bytes
}
const load = (app: Locator) => app.getByRole('button', { name: '显式加载WASM引擎', exact: true })
const convert = (app: Locator) => app.getByRole('button', { name: '执行转换', exact: true })
const cancel = (app: Locator) =>
  app.getByRole('button', { name: '立即取消并终止Worker', exact: true })
const stop = (page: Page) => page.getByRole('button', { name: '停止并卸载', exact: true })
async function ready(app: Locator) {
  await load(app).click()
  await expect(app).toHaveAttribute('data-phase', 'ready', { timeout: 20_000 })
}
async function output(page: Page, app: Locator, info: TestInfo, filename: string, seconds: number) {
  await expect(app).toHaveAttribute('data-phase', 'done', { timeout: 15_000 })
  await expect(app.getByTestId('e19-exit-code')).toHaveText('0')
  await expect(app.getByTestId('e19-cleanup')).toContainText('2/2')
  const pending = page.waitForEvent('download')
  await app.getByRole('link', { name: '下载本次WAV', exact: true }).click()
  const download = await pending
  await download.saveAs(info.outputPath(filename))
  expect(await download.failure()).toBeNull()
  const bytes = await readFile(info.outputPath(filename))
  const observed = inspectPcmWav(bytes)
  expect(observed).toEqual(JSON.parse(await app.getByTestId('e19-output-info').innerText()))
  expect(observed.seconds).toBeCloseTo(seconds, 4)
  await expect
    .poll(() => app.getByTestId('e19-audio').evaluate((node: HTMLAudioElement) => node.duration))
    .toBeCloseTo(seconds, 3)
}

async function saveEvidence(info: TestInfo, name: string, value: unknown) {
  await mkdir(info.outputDir, { recursive: true })
  await writeFile(info.outputPath(name), `${JSON.stringify(value, null, 2)}\n`)
}

test.afterEach(async ({ page }, info) => {
  if (info.status === info.expectedStatus) return
  const state = await probeState(page).catch(() => null)
  const status = await page
    .getByTestId('e19-status')
    .allTextContents()
    .catch(() => [])
  await saveEvidence(info, 'failed-observation.json', { state, status })
})

test.beforeEach(async ({ context, baseURL }) => {
  if (!baseURL) throw new Error('Missing the isolated preview URL')
  const origin = new URL(baseURL).origin
  await context.route(/^https?:/u, (route) =>
    new URL(route.request().url()).origin === origin ? route.continue() : route.abort(),
  )
})

test('@E19 original input really converts and revokes the downloaded WAV on unmount', async ({
  page,
}, info) => {
  const core: { url: string; status: number }[] = []
  page.on('response', (response) => {
    if (/\/ffmpeg-core\/ffmpeg-core\.(?:js|wasm)$/u.test(response.url())) {
      core.push({ url: response.url(), status: response.status() })
    }
  })
  const app = await open(page, 'basic')
  expect(core).toEqual([])
  await expect(app.getByTestId('e19-command')).toContainText('-c:a pcm_s16le')
  await expect(app.getByTestId('e19-output-info')).toHaveCount(0)
  await ready(app)
  await convert(app).click()
  await output(page, app, info, 'original-tone.wav', 1)
  expect(core.map((item) => new URL(item.url).pathname).sort()).toEqual([
    '/ffmpeg-core/ffmpeg-core.js',
    '/ffmpeg-core/ffmpeg-core.wasm',
  ])
  expect(
    core.every(
      (item) => item.status === 200 && new URL(item.url).origin === new URL(page.url()).origin,
    ),
  ).toBe(true)
  const [url] = (await probeState(page)).urls
  expect(url).toMatch(/^blob:/u)
  await stop(page).click()
  await expect(app).toHaveCount(0)
  const p = await probeState(page)
  expect(p.revoked).toContain(url)
  expect(p.events.filter((e) => e.direction === 'send').map((e) => e.type)).toEqual([
    'LOAD',
    'WRITE_FILE',
    'EXEC',
    'READ_FILE',
    'DELETE_FILE',
    'DELETE_FILE',
  ])
  expect(p.events.filter((e) => e.direction === 'terminate')).toHaveLength(1)
  await saveEvidence(info, 'core-and-worker.json', { core, ...p })
})

test('@E19 reject oversize before File read and normalize a real 48 kHz stereo file', async ({
  page,
}, info) => {
  const app = await open(page, 'business')
  await ready(app)
  const input = app.locator('input[type=file]')
  const set = (name: string, buffer: Buffer, mimeType = 'audio/wav') =>
    input.setInputFiles({ name, mimeType, buffer })
  await set('oversize.wav', Buffer.alloc(4 * 1024 * 1024 + 1))
  await convert(app).click()
  await expect(app.getByTestId('e19-status')).toContainText('4MiB')
  await expect(convert(app)).toBeEnabled()
  expect((await probeState(page)).reads).toEqual([])
  await set('inherited.mp4', Buffer.from('1234ftyp5678'), 'constructor')
  await convert(app).click()
  await expect(app.getByTestId('e19-status')).toContainText('已知MIME')
  await expect(convert(app)).toBeEnabled()
  expect((await probeState(page)).reads).toEqual([])
  await set('spoof.wav', Buffer.from('not a WAV'))
  await convert(app).click()
  await expect(app.getByTestId('e19-status')).toContainText('文件头')
  await expect(app.getByTestId('e19-output-info')).toHaveCount(0)
  await expect(convert(app)).toBeEnabled()
  const rejected = await probeState(page)
  expect(rejected.reads).toEqual(['spoof.wav'])
  expect(rejected.events.filter((e) => e.direction === 'send').map((e) => e.type)).not.toContain(
    'WRITE_FILE',
  )
  await set('original-stereo-48k.wav', stereoWav())
  await convert(app).click()
  await output(page, app, info, 'normalized-stereo.wav', 1)
  await expect(app.getByTestId('e19-input-snapshot')).toContainText('original-stereo-48k.wav')
  const valid = await probeState(page)
  expect(valid.execTimeouts).toEqual([12000])
  // This malformed file clears the signature preflight and is then rejected by the real decoder.
  await set('truncated-riff.wav', Buffer.from('RIFF\x04\x00\x00\x00WAVE'))
  await convert(app).click()
  await expect(app).toHaveAttribute('data-phase', 'error')
  const exit = Number(await app.getByTestId('e19-exit-code').innerText())
  expect(Number.isInteger(exit) && exit !== 0).toBe(true)
  await expect(app.getByRole('link', { name: '下载本次WAV', exact: true })).toHaveCount(0)
  await expect(convert(app)).toBeEnabled()
  const failed = await probeState(page)
  expect(failed.revoked).toContain(valid.urls[0])
  expect(failed.execTimeouts).toEqual([12000, 12000])
  await set('recovery.wav', stereoWav())
  await convert(app).click()
  await output(page, app, info, 'recovered-stereo.wav', 1)
  await saveEvidence(info, 'file-preflight.json', {
    decoderExit: exit,
    ...(await probeState(page)),
  })
})

test('@E19 cancel while real WASM is requested, then reload and finish a half-second conversion', async ({
  page,
}, info) => {
  let release: () => void = () => {}
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  let requests = 0
  const pattern = '**/ffmpeg-core/ffmpeg-core.wasm'
  await page.route(pattern, async (route) => {
    requests++
    await gate
    await route.continue().catch(() => {})
  })
  const app = await open(page, 'advanced')
  try {
    await load(app).click()
    await expect.poll(() => requests, { timeout: 10_000 }).toBe(1)
    await expect(app).toHaveAttribute('data-phase', 'loading')
    await cancel(app).click()
    await expect(app).toHaveAttribute('data-phase', 'cancelled')
    await expect(convert(app)).toBeDisabled()
    const p = await probeState(page)
    expect(p.events.filter((e) => e.direction === 'terminate')).toHaveLength(1)
    expect(p.events.some((e) => e.direction === 'receive' && e.type === 'LOAD')).toBe(false)
  } finally {
    release()
    await page.unroute(pattern)
  }
  await ready(app)
  await convert(app).click()
  await output(page, app, info, 'half-second.wav', 0.5)
  await stop(page).click()
  const p = await probeState(page)
  expect(p.events.filter((e) => e.direction === 'terminate').map((e) => e.id)).toEqual([1, 2])
  expect(p.revoked).toContain(p.urls[0])
  await saveEvidence(info, 'load-cancel-and-restart.json', p)
})

test('@E19 a real EXEC log allows cancellation before an EXEC result is delivered', async ({
  page,
}, info) => {
  const app = await open(page, 'advanced')
  await ready(app)
  await app.locator('input[type=file]').setInputFiles({
    name: 'original-stereo-20s.wav',
    mimeType: 'audio/wav',
    buffer: stereoWav(20),
  })
  await page.evaluate(() => {
    ;(window as unknown as { e19Probe: Probe }).e19Probe.cancelOnLog = true
  })
  await convert(app).click()
  await expect(app).toHaveAttribute('data-phase', 'cancelled')
  await expect(app.getByTestId('e19-output-info')).toHaveCount(0)
  await expect(convert(app)).toBeDisabled()
  await expect(app.getByTestId('e19-exit-code')).toHaveText('尚未返回')
  const p = await probeState(page)
  expect(p.atLog).toMatchObject({ type: 'LOG', phase: 'converting', receivedExec: false })
  expect(p.atLog?.message).toContain('Input #0')
  expect(p.events.filter((e) => e.direction === 'terminate')).toHaveLength(1)
  expect(p.events.some((e) => e.direction === 'send' && e.type === 'READ_FILE')).toBe(false)
  expect(p.urls).toEqual([])
  await saveEvidence(info, 'exec-cancel.json', p)
})
