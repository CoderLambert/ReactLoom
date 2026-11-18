import { expect, test } from '@playwright/test'

test('@E07 actual basic and GFM goals expose parsed structure and Markdown output', async ({
  page,
}) => {
  await page.goto('/libraries/remark?tab=demo&example=basic')
  let app = page.getByRole('region', { name: 'remark 真实处理实验', exact: true })
  await app.getByRole('button', { name: '解析与规范化', exact: true }).click()
  let audit = JSON.parse(await app.getByTestId('remark-audit').innerText())
  expect(audit.headings).toEqual(['ReactLoom Note', 'Getting started'])
  expect(audit.nodeTypes.list).toBe(1)
  await expect(app.getByTestId('remark-output')).toContainText('# ReactLoom Note')
  await page.goto('/libraries/remark?tab=demo&example=business')
  app = page.getByRole('region', { name: 'remark 真实处理实验', exact: true })
  await expect(app.getByTestId('remark-output')).toHaveCount(0)
  await app.getByRole('button', { name: '解析与规范化', exact: true }).click()
  audit = JSON.parse(await app.getByTestId('remark-audit').innerText())
  expect(audit.nodeTypes.table).toBe(1)
  expect(audit.nodeTypes.delete).toBe(1)
  await expect(app.getByTestId('remark-output')).toContainText('[x]')
  await expect(app.getByTestId('remark-output')).toContainText('~~旧方案~~')
  await expect(app.locator('table')).toHaveCount(0) // textual Markdown, not rendered GFM HTML.
})

test('@E07 audit is text-only; byte failure removes stale success and can recover', async ({
  page,
}) => {
  const unexpected: string[] = []
  page.on('request', (request) => {
    if (request.url().startsWith('https://tracking.invalid/')) unexpected.push(request.url())
  })
  await page.goto('/libraries/remark?tab=demo&example=advanced')
  const app = page.getByRole('region', { name: 'remark 真实处理实验', exact: true })
  const input = app.getByRole('textbox', { name: 'remark Markdown 原文', exact: true })
  const execute = app.getByRole('button', { name: '解析与规范化', exact: true })
  await execute.click()
  let audit = JSON.parse(await app.getByTestId('remark-audit').innerText())
  expect(
    audit.links.some(
      (link: { url: string; safe: boolean }) => link.url.startsWith('javascript:') && !link.safe,
    ),
  ).toBe(true)
  expect(
    audit.links.some(
      (link: { url: string; safe: boolean }) => link.url.startsWith('data:') && !link.safe,
    ),
  ).toBe(true)
  expect(audit.rawHtmlNodes).toBe(1)
  await page.evaluate(() => Object.assign(window, { __remarkScriptRan: false }))
  await input.fill(
    '# untrusted\n\n<script>window.__remarkScriptRan=true</script>\n\n![remote](https://tracking.invalid/pixel.gif)\n\n[bad](javascript:alert(1))',
  )
  await execute.click()
  await expect(app.getByTestId('remark-output')).toContainText(
    '<script>window.__remarkScriptRan=true</script>',
  )
  await expect(app.locator('img,script,iframe,a[href^="javascript:"]')).toHaveCount(0)
  expect(
    await page.evaluate(
      () => (window as unknown as { __remarkScriptRan: boolean }).__remarkScriptRan,
    ),
  ).toBe(false)
  expect(unexpected).toEqual([])
  await input.fill('中'.repeat(8001)) // 8,001 UTF16 units, 24,003 UTF8 bytes: UI limit permits this.
  await execute.click()
  await expect(app.getByRole('alert')).toContainText('24,000 UTF-8')
  await expect(app.getByTestId('remark-output')).toHaveCount(0)
  await expect(app.getByTestId('remark-audit')).toHaveCount(0)
  await app.getByRole('button', { name: '恢复案例', exact: true }).click()
  await expect(app.getByRole('alert')).toHaveCount(0)
  await execute.click()
  audit = JSON.parse(await app.getByTestId('remark-audit').innerText())
  expect(audit.rawHtmlNodes).toBe(1)
  expect(unexpected).toEqual([])
})
