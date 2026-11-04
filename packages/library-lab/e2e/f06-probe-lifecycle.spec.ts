import { expect, test } from '@playwright/test'

declare global {
  interface Window {
    __pdfProbeGate: { arm: () => void; release: () => void; pending: () => number }
  }
}

test('@F06 repeated corrupt probes and unmount release actual Workers before delayed parse rejection', async ({
  page,
}) => {
  // Delay only the real parser's terminal error after its Worker handshake/setup.
  // All other messages, including Terminate ACK, reach the actual PDF.js runtime.
  await page.addInitScript(() => {
    const NativeWorker = window.Worker
    let holding = false
    const queued: (() => void)[] = []
    const gate = {
      arm: () => {
        holding = true
      },
      release: () => {
        holding = false
        for (const deliver of queued.splice(0)) deliver()
      },
      pending: () => queued.length,
    }
    class DelayedPdfWorker extends NativeWorker {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options)
        this.addEventListener(
          'message',
          (event: MessageEvent) => {
            if (!holding || event.data?.action !== 'DocException') return
            event.stopImmediatePropagation()
            const data: unknown = event.data
            queued.push(() => this.dispatchEvent(new MessageEvent('message', { data })))
          },
          { capture: true },
        )
      }
    }
    window.Worker = DelayedPdfWorker
    Object.assign(window, { __pdfProbeGate: gate })
  })
  await page.goto('/libraries/pdfjs?tab=demo&example=advanced')
  await page.getByRole('button', { name: '运行当前示例' }).click()
  const region = page.getByRole('region', { name: 'PDF.js 真实页面渲染' })
  await expect(region.getByRole('status')).toContainText('页渲染成功')
  const probe = region.getByRole('button', { name: '验证损坏文档不覆盖当前页' })
  const gateState = () => page.evaluate(() => window.__pdfProbeGate.pending())
  await page.evaluate(() => window.__pdfProbeGate.arm())
  try {
    const firstCreated = page.waitForEvent('worker', { timeout: 10_000 })
    await probe.click()
    const first = await firstCreated
    await expect.poll(gateState, { timeout: 10_000 }).toBe(1)
    const firstClosed = first.waitForEvent('close', { timeout: 5_000 })
    const secondCreated = page.waitForEvent('worker', { timeout: 10_000 })
    await probe.click()
    const [second] = await Promise.all([secondCreated, firstClosed])
    await expect.poll(gateState, { timeout: 10_000 }).toBe(2)
    const secondClosed = second.waitForEvent('close', { timeout: 5_000 })
    await page.getByRole('button', { name: '停止并卸载' }).click()
    await secondClosed
    await expect(region).toHaveCount(0)
  } finally {
    await page.evaluate(() => window.__pdfProbeGate.release())
  }
})
