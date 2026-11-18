import { expect, test } from '@playwright/test'

test('E08 actual isolated frame, sanitized channels, UTF8 error clears output and reset @E08', async ({
  page,
}) => {
  const requests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('example.invalid/e08-')) requests.push(request.url())
  })
  await page.goto('/libraries/rehype?tab=demo&example=basic')
  let region = page.getByRole('region', { name: 'rehype 实际 HTML 净化' })
  let input = region.getByRole('textbox', { name: 'rehype HTML 输入' })
  await expect(region.locator('iframe')).toHaveCount(0)
  await input.fill('<h2>accepted heading</h2><p><strong>retained</strong></p>')
  await region.getByRole('button', { name: '运行安全处理器', exact: true }).click()
  await expect(region.getByTestId('rehype-output')).toContainText('<strong>retained</strong>')
  let frame = region.frameLocator('iframe')
  await expect(frame.getByRole('heading', { name: 'accepted heading' })).toBeVisible()
  await expect(region.locator('iframe')).toHaveAttribute('sandbox', '')
  expect(
    await region
      .locator('iframe')
      .evaluate((element) => (element as HTMLIFrameElement).contentDocument === null),
  ).toBe(true)
  await page.goto('/libraries/rehype?tab=demo&example=business')
  region = page.getByRole('region', { name: 'rehype 实际 HTML 净化' })
  await region.getByRole('button', { name: '运行安全处理器', exact: true }).click()
  await expect(region.getByTestId('rehype-output')).not.toContainText('href=')
  await expect(region.frameLocator('iframe').getByText('原始来源')).toBeVisible()
  await expect(region.frameLocator('iframe').locator('a[href]')).toHaveCount(0)
  await page.goto('/libraries/rehype?tab=demo&example=advanced')
  region = page.getByRole('region', { name: 'rehype 实际 HTML 净化' })
  input = region.getByRole('textbox', { name: 'rehype HTML 输入' })
  await page.evaluate(() => {
    ;(window as Window & { __E08Executed?: boolean }).__E08Executed = false
  })
  await input.fill(
    '<h2 onclick="parent.__E08Executed=true">kept</h2><script>parent.__E08Executed=true</script><img src="https://example.invalid/e08-image" onerror="parent.__E08Executed=true"><a href="https://example.invalid/e08-nav">text</a><iframe src="https://example.invalid/e08-frame"></iframe><style>@import url(https://example.invalid/e08-style)</style>',
  )
  await region.getByRole('button', { name: '运行安全处理器', exact: true }).click()
  frame = region.frameLocator('iframe')
  await expect(frame.getByRole('heading', { name: 'kept' })).toBeVisible()
  await expect(frame.locator('script,img,iframe,style,[onclick],[onerror],a[href]')).toHaveCount(0)
  await expect(frame.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute(
    'content',
    /default-src 'none'/,
  )
  expect(
    await page.evaluate(() => (window as Window & { __E08Executed?: boolean }).__E08Executed),
  ).toBe(false)
  expect(requests).toEqual([])
  // Only 8334 UTF16 units, but 25002 UTF8 bytes: reachable below textarea maxLength.
  await input.fill('中'.repeat(8334))
  await region.getByRole('button', { name: '运行安全处理器', exact: true }).click()
  await expect(region.getByRole('alert')).toContainText('25000字节')
  await expect(region.getByTestId('rehype-output')).toHaveCount(0)
  await expect(region.locator('iframe')).toHaveCount(0)
  await region.getByRole('button', { name: '重置', exact: true }).click()
  await expect(region.getByRole('alert')).toHaveCount(0)
  await region.getByRole('button', { name: '运行安全处理器', exact: true }).click()
  await expect(region.locator('iframe')).toHaveCount(1)
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(region).toHaveCount(0)
  expect(requests).toEqual([])
})
