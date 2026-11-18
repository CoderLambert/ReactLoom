import { expect, test } from '@playwright/test'

test('@E10 real DOMPurify preserves limited formats and enforces exact link attributes', async ({
  page,
}) => {
  await page.goto('/libraries/dompurify?tab=demo&example=basic')
  let app = page.getByRole('region', { name: 'DOMPurify 安全净化实验', exact: true })
  await expect(app.getByTestId('purified-preview').locator('strong')).toHaveText('ReactLoom')
  const input = app.getByRole('textbox', { name: '输入 HTML 字符串', exact: true })
  await input.fill(
    '<p onclick="window.__purifyExecuted=true">text <strong>bold</strong><em>italic</em></p>',
  )
  await expect(app.getByTestId('purified-preview').locator('strong')).toHaveText('bold')
  await expect(app.getByTestId('purified-preview').locator('p')).not.toHaveAttribute('onclick')
  await app.getByRole('button', { name: '恢复场景', exact: true }).click()
  await expect(app.getByTestId('purified-preview').locator('strong')).toHaveText('ReactLoom')
  await page.goto('/libraries/dompurify?tab=demo&example=business')
  app = page.getByRole('region', { name: 'DOMPurify 安全净化实验', exact: true })
  const link = app
    .getByTestId('purified-preview')
    .getByRole('link', { name: '官方资料', exact: true })
  await expect(link).toHaveAttribute('href', 'https://github.com/cure53/DOMPurify')
  await expect(link).toHaveAttribute('title', '官方资料')
  expect(await link.evaluate((element) => element.getAttributeNames().sort())).toEqual([
    'href',
    'title',
  ])
  const preview = app.getByTestId('purified-preview')
  expect(await preview.innerHTML()).toBe(await app.getByTestId('purified-output').textContent())
})

test('@E10 harmful markup is stripped; markers and remote probes do not execute', async ({
  page,
}) => {
  const requests: string[] = []
  page.on('request', (request) => {
    if (request.url().startsWith('https://purify-probe.invalid/')) requests.push(request.url())
  })
  await page.addInitScript(() => Object.assign(window, { __purifyExecuted: false }))
  await page.goto('/libraries/dompurify?tab=demo&example=advanced')
  const app = page.getByRole('region', { name: 'DOMPurify 安全净化实验', exact: true })
  const input = app.getByRole('textbox', { name: '输入 HTML 字符串', exact: true })
  const preview = app.getByTestId('purified-preview')
  await expect(preview).toContainText('正常文案')
  await expect(preview.locator('script,svg,img,style,iframe,math,form')).toHaveCount(0)
  await expect(preview.locator('[onclick],[onload],[onerror],[style]')).toHaveCount(0)
  await expect(preview.getByText('注入链接', { exact: true })).not.toHaveAttribute('href')
  expect(
    await page.evaluate(
      () => (window as unknown as { __purifyExecuted: boolean }).__purifyExecuted,
    ),
  ).toBe(false)
  await input.fill(
    '<p onclick="window.__purifyExecuted=true" data-x="1" aria-label="x">click marker</p><a href="javascript:window.__purifyExecuted=true">bad</a><script>window.__purifyExecuted=true</script><svg onload="window.__purifyExecuted=true"></svg><img src="https://purify-probe.invalid/image" onerror="window.__purifyExecuted=true"><iframe src="https://purify-probe.invalid/frame"></iframe><a href="data:text/html,evil">data</a><a href="//purify-probe.invalid/link">relative</a>',
  )
  await preview.getByText('click marker', { exact: true }).click()
  await expect(
    preview.locator('script,svg,img,iframe,[onclick],[onerror],[onload],[data-x],[aria-label]'),
  ).toHaveCount(0)
  for (const name of ['bad', 'data', 'relative'])
    await expect(preview.getByText(name, { exact: true })).not.toHaveAttribute('href')
  await page.waitForTimeout(150) // One bounded window for unintended parser/sink resource requests.
  expect(requests).toEqual([])
  expect(
    await page.evaluate(
      () => (window as unknown as { __purifyExecuted: boolean }).__purifyExecuted,
    ),
  ).toBe(false)
  await app.getByRole('button', { name: '恢复场景', exact: true }).click()
  await expect(preview).toContainText('正常文案')
  await expect(preview).not.toContainText('click marker')
})

test('@E10 programmatic over-limit input clears prior preview and resets safely', async ({
  page,
}) => {
  await page.goto('/libraries/dompurify?tab=demo&example=basic')
  const app = page.getByRole('region', { name: 'DOMPurify 安全净化实验', exact: true })
  const input = app.getByRole('textbox', { name: '输入 HTML 字符串', exact: true })
  await expect(app.getByTestId('purified-preview').locator('strong')).toBeVisible()
  await input.evaluate((element) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
    if (!setter) throw new Error('Expected native textarea setter')
    setter.call(element, 'x'.repeat(12001))
    element.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await expect(app.getByRole('alert')).toContainText('12,000个UTF-16')
  await expect(app.getByTestId('purified-preview')).toHaveText('')
  await expect(app.getByTestId('purified-output')).toHaveText('')
  await app.getByRole('button', { name: '恢复场景', exact: true }).click()
  await expect(app.getByRole('alert')).toHaveCount(0)
  await expect(app.getByTestId('purified-preview').locator('strong')).toHaveText('ReactLoom')
})
