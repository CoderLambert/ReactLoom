import { expect, test } from '@playwright/test'

test('E06 editable markdown GFM and untrusted input without image requests @E06', async ({
  page,
}) => {
  const tracking: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('example.invalid/e06-tracker.png')) tracking.push(request.url())
  })
  await page.goto('/libraries/react-markdown?tab=demo&example=basic')
  let region = page.getByRole('region', { name: 'react-markdown 真实渲染实验' })
  let input = region.getByRole('textbox', { name: 'Markdown 输入' })
  let preview = region.getByTestId('markdown-preview')
  await input.fill('# Acceptance\n\n**rendered** [safe](https://example.com/doc)')
  await expect(preview.getByRole('heading', { name: 'Acceptance' })).toBeVisible()
  await expect(preview.locator('strong')).toHaveText('rendered')
  const link = preview.getByRole('link', { name: 'safe' })
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  await page.goto('/libraries/react-markdown?tab=demo&example=business')
  region = page.getByRole('region', { name: 'react-markdown 真实渲染实验' })
  input = region.getByRole('textbox', { name: 'Markdown 输入' })
  preview = region.getByTestId('markdown-preview')
  await expect(preview.getByRole('table')).toBeVisible()
  await expect(preview.getByRole('checkbox')).toHaveCount(2)
  await expect(preview.getByRole('checkbox').first()).toBeChecked()
  await expect(preview.getByRole('checkbox').first()).toBeDisabled()
  await input.fill('| Item | State |\n| --- | --- |\n| edited | ready |\n\n- [x] task')
  await expect(preview.getByRole('cell', { name: 'edited', exact: true })).toBeVisible()
  await page.goto('/libraries/react-markdown?tab=demo&example=advanced')
  region = page.getByRole('region', { name: 'react-markdown 真实渲染实验' })
  input = region.getByRole('textbox', { name: 'Markdown 输入' })
  preview = region.getByTestId('markdown-preview')
  await expect(preview).toContainText('图片外链被禁用')
  await page.evaluate(() => {
    ;(window as Window & { __E06Executed?: boolean }).__E06Executed = false
  })
  await input.fill(
    '[bad](javascript:alert%281%29)\n\n<script>window.__E06Executed=true</script>\n\n<img src=x onerror="window.__E06Executed=true">\n\n![tracker](https://example.invalid/e06-tracker.png)\n\n[auth](https://user:pw@example.com/)',
  )
  await expect(preview.locator('script,img,[onerror]')).toHaveCount(0)
  await expect(preview.locator('a')).toHaveCount(0)
  await expect(preview).toContainText('图片外链被禁用：tracker')
  expect(
    await page.evaluate(() => (window as Window & { __E06Executed?: boolean }).__E06Executed),
  ).toBe(false)
  expect(tracking).toEqual([])
  await region.getByRole('button', { name: '重置样例', exact: true }).click()
  await expect(input).toHaveValue(/不可信内容/)
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(region).toHaveCount(0)
  expect(tracking).toEqual([])
})
