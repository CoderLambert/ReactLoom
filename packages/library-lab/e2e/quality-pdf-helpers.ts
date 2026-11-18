import type { Page } from '@playwright/test'
export function originalPdf(label = 'Owned local PDF', width = 612, height = 792) {
  const content = `BT /F1 20 Tf 40 700 Td (${label}) Tj ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf))
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  }
  const start = Buffer.byteLength(pdf)
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`
  return { name: 'original.pdf', mimeType: 'application/pdf', buffer: Buffer.from(pdf) }
}
export type WorkerProbe = { created: string[]; terminated: number[]; actions: string[] }
export async function installPdfWorkers(page: Page) {
  await page.addInitScript(() => {
    const p: WorkerProbe = { created: [], terminated: [], actions: [] }
    Object.assign(window, { pdfWorkers: p })
    window.Worker = new Proxy(window.Worker, {
      construct(target, args) {
        const worker = Reflect.construct(target, args) as Worker
        const url = String(args[0])
        if (url.includes('pdf.worker')) {
          const id = p.created.length
          p.created.push(url)
          worker.addEventListener('message', (event) => {
            if (typeof event.data?.action === 'string') p.actions.push(event.data.action)
          })
          const terminate = worker.terminate.bind(worker)
          worker.terminate = () => {
            if (!p.terminated.includes(id)) p.terminated.push(id)
            terminate()
          }
        }
        return worker
      },
    })
  })
}
export async function pdfWorkerState(page: Page) {
  return page.evaluate(() => (window as unknown as { pdfWorkers: WorkerProbe }).pdfWorkers)
}
