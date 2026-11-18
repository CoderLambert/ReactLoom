import type { Page } from '@playwright/test'

export type ImageProbe = {
  created: string[]
  revoked: string[]
  closed: number
  holds: (() => void)[]
  holdBitmap: boolean
  holdBlob: boolean
}
export async function installImageProbe(page: Page) {
  await page.addInitScript(() => {
    const p: ImageProbe = {
      created: [],
      revoked: [],
      closed: 0,
      holds: [],
      holdBitmap: false,
      holdBlob: false,
    }
    Object.assign(window, { imageProbe: p })
    const create = URL.createObjectURL,
      revoke = URL.revokeObjectURL
    URL.createObjectURL = (value) => {
      const url = create(value)
      if (value instanceof Blob && value.type.startsWith('image/')) p.created.push(url)
      return url
    }
    URL.revokeObjectURL = (url) => {
      p.revoked.push(url)
      revoke(url)
    }
    const decode = window.createImageBitmap.bind(window)
    window.createImageBitmap = (async (...args: Parameters<typeof createImageBitmap>) => {
      const bitmap = await decode(...args)
      const close = bitmap.close.bind(bitmap)
      bitmap.close = () => {
        p.closed++
        close()
      }
      if (p.holdBitmap) await new Promise<void>((resolve) => p.holds.push(resolve))
      return bitmap
    }) as typeof window.createImageBitmap
    const toBlob = HTMLCanvasElement.prototype.toBlob
    HTMLCanvasElement.prototype.toBlob = function (callback, ...args) {
      toBlob.call(
        this,
        (blob) => {
          if (p.holdBlob) p.holds.push(() => callback(blob))
          else callback(blob)
        },
        ...args,
      )
    }
  })
}
export async function readImageProbe(page: Page) {
  return page.evaluate(() => {
    const p = (window as unknown as { imageProbe: ImageProbe }).imageProbe
    return { created: p.created, revoked: p.revoked, closed: p.closed, held: p.holds.length }
  })
}
export async function holdImageWork(page: Page, kind: 'holdBlob' | 'holdBitmap') {
  await page.evaluate((key) => {
    ;(window as unknown as { imageProbe: ImageProbe }).imageProbe[key] = true
  }, kind)
}
export async function releaseImageWork(page: Page) {
  await page.evaluate(() => {
    const p = (window as unknown as { imageProbe: ImageProbe }).imageProbe
    p.holdBitmap = false
    p.holdBlob = false
    for (const release of p.holds.splice(0)) release()
  })
}
export async function pngFixture(page: Page, width = 800, height = 600) {
  const encoded = await page.evaluate(
    ([w, h]) => {
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Missing canvas fixture context')
      context.fillStyle = '#1c8565'
      context.fillRect(0, 0, w, h)
      context.fillStyle = '#f4b33a'
      context.fillRect(w / 2, 0, w / 2, h)
      return canvas.toDataURL('image/png').split(',')[1]
    },
    [width, height],
  )
  return {
    name: 'original-test.png',
    mimeType: 'image/png',
    buffer: Buffer.from(encoded, 'base64'),
  }
}
