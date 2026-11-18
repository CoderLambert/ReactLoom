import { expect, test } from '@playwright/test'

test('@B19 @platform-document actual HTML-only official snapshot is readable without active HTML or remote images', async ({
  page,
}) => {
  const external: string[] = []
  page.on('request', (request) => {
    if (/^https?:/u.test(request.url()) && !request.url().startsWith('http://127.0.0.1:4319/'))
      external.push(request.url())
  })
  await page.goto('/libraries/embla-carousel?tab=readme')
  const body = page.locator('.prose')
  await expect(body).toContainText('Embla Carousel React')
  await expect(body.locator('pre code')).toContainText('<div align="center">')
  await expect(body.locator('img,iframe,script,style,svg,form,input')).toHaveCount(0)
  expect(external).toEqual([])
  await expect(page.getByRole('link', { name: '打开上游原文' })).toHaveAttribute(
    'href',
    /0fe65834136f1aa35e4c1a4a477e5ccb4bb5ee54/u,
  )
  await page.getByRole('tab', { name: '官网预览', exact: true }).click()
  await expect(page.getByRole('link', { name: '打开官网' })).toHaveAttribute('href', /^https:/u)
  await expect(page.getByRole('button', { name: '加载官网预览', exact: true })).toBeVisible()
  await expect(page.locator('iframe')).toHaveCount(0)
})

test('@platform-document controlled guide fixture retains the original HTML boundary', async ({
  page,
}) => {
  // A platform input-security fixture only; no SDK/library runtime is replaced.
  await page.route('**/raw/C20/guide.md', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/markdown; charset=utf-8',
      body: '# 文档安全夹具\n\n可读的 Markdown。\n\n<script>window.unsafeGuide = true</script>\n\n<img src="https://untrusted.invalid/pixel" onerror="alert(1)">\n\n<iframe src="https://untrusted.invalid/frame"></iframe>\n',
    }),
  )
  await page.goto('/libraries/clsx?tab=guide')
  const body = page.locator('.prose')
  await expect(body.getByRole('heading', { name: '文档安全夹具', exact: true })).toBeVisible()
  await expect(body).toContainText('可读的 Markdown。')
  await expect(body).not.toContainText('unsafeGuide')
  await expect(body.locator('img,iframe,script')).toHaveCount(0)
  expect(await page.evaluate(() => Reflect.has(window, 'unsafeGuide'))).toBe(false)
})
