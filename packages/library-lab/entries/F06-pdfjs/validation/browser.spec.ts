// Proposal for controller-owned Lab Playwright suite, not an executed receipt.
import { expect, test } from '@playwright/test'

// The controller supplies navigation/start and an outer Worker constructor proxy
// BEFORE navigation. Record each real URL and wrap each instance.terminate;
// do not synthesize lifecycle DOM events or count this file as browser PASS.
test('F06: actual Canvas, pages, text, rapid scale and corrupt probe', async ({ page }) => {
  await page.goto('/?entry=F06') // adapt to current host route; select advanced and start
  const region = page.getByRole('region', { name: 'PDF.js 真实页面渲染' })
  await expect(region.getByRole('status')).toContainText('渲染成功')
  await expect(region.getByTestId('pdf-text')).toContainText('Page One')
  const canvas = region.locator('canvas')
  expect(
    await canvas.evaluate((c) => {
      const pixels = c.getContext('2d')?.getImageData(0, 0, c.width, c.height).data
      return !!pixels?.some((value, i) => i % 4 !== 3 && value < 240)
    }),
  ).toBe(true)
  await region.getByRole('button', { name: '下一页' }).click()
  await expect(region.getByTestId('pdf-text')).toContainText('Page Two')
  for (const value of ['2', '0.8', '1.5', '1']) await region.getByLabel('缩放').selectOption(value)
  await expect(region.getByRole('status')).toContainText('渲染成功')
  await expect(region.getByTestId('pdf-text')).toContainText('Page Two')
  const before = await canvas.evaluate((c) => c.toDataURL())
  await region.getByRole('button', { name: '验证损坏文档不覆盖当前页' }).click()
  await expect(region.getByRole('status')).toContainText('已正确捕获损坏 PDF')
  expect(await canvas.evaluate((c) => c.toDataURL())).toBe(before)
  await expect(region.getByTestId('pdf-text')).toContainText('Page Two')
})

// Additional controller scenarios use new original PDFs, never remote files:
// 1. one-page valid PDF -> loaded/rendered; corrupt .pdf -> parse failure retaining
//    that exact canvas/text/document. Empty / >3MiB / wrong suffix are pre-read rejects.
// 2. valid tiny PDF MediaBox [0 0 5000 3000] -> render budget error; canvas width/height
//    become 0 and old text is absent. Observe native width/height setters: no value>4096
//    or product>8_000_000 is allocated, including DPR=2.
// 3. hold only File.prototype.arrayBuffer for named old.pdf (resolve actual bytes later).
//    Select old.pdf -> select invalid.txt -> release -> status remains suffix rejection,
//    old document/text/pixels persist. Repeat with learning-level switch/unmount;
//    late completion must not mutate the new keyed session / create another Worker.
// 4. outer real Worker proxy: actual pdf.worker*.mjs request and constructor URL;
//    candidate failure/probe -> their instances terminate; accepted replacement / level
//    switch / stop -> previous accepted Worker terminates exactly once eventually.
//    Do not treat Node legacy SDK (fake worker) or DOM removal as this proof.
// 5. collect pageerror/console errors and assert no same-Canvas concurrency error after
//    fast page+zoom changes. Wait for last render before checking result, not fixed sleep.
