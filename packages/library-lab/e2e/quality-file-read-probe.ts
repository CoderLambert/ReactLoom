import type { Page } from '@playwright/test'
export type FileReadProbe = {
  hold: boolean
  pending: (() => void)[]
  calls: number
  returned: number
}
export async function installFileReads(page: Page, method: 'text' | 'arrayBuffer') {
  await page.addInitScript((kind) => {
    const probe: FileReadProbe = { hold: false, pending: [], calls: 0, returned: 0 }
    Object.assign(window, { fileReadProbe: probe })
    const original = Blob.prototype[kind]
    Object.defineProperty(Blob.prototype, kind, {
      configurable: true,
      writable: true,
      value: async function (this: Blob) {
        probe.calls++
        const result = await Reflect.apply(original, this, [])
        if (probe.hold) await new Promise<void>((resolve) => probe.pending.push(resolve))
        probe.returned++
        return result
      },
    })
  }, method)
}
export async function readFileProbe(page: Page) {
  return page.evaluate(() => {
    const p = (window as unknown as { fileReadProbe: FileReadProbe }).fileReadProbe
    return { calls: p.calls, returned: p.returned, pending: p.pending.length }
  })
}
export async function holdFileReads(page: Page, hold = true) {
  await page.evaluate((value) => {
    ;(window as unknown as { fileReadProbe: FileReadProbe }).fileReadProbe.hold = value
  }, hold)
}
export async function releaseFileReads(page: Page) {
  await page.evaluate(() => {
    const p = (window as unknown as { fileReadProbe: FileReadProbe }).fileReadProbe
    p.hold = false
    for (const resume of p.pending.splice(0)) resume()
  })
  await page.evaluate(() => new Promise(requestAnimationFrame))
}
