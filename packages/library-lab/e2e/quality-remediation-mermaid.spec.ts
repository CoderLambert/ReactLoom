import { expect, type Page, test } from '@playwright/test'

async function openMermaid(page: Page, level: 'basic' | 'business' | 'advanced') {
  await page.goto(`/libraries/mermaid?tab=demo&example=${level}`)
  const app = page.getByRole('region', { name: 'Mermaid 预设DSL图示', exact: true })
  await expect(app.getByRole('status')).toHaveText('Mermaid 图已生成')
  return app
}

const frameSelector = 'iframe[title="沙箱 Mermaid SVG 预览"]'

test('@A08 flowchart renders actual SVG and deduplication changes source and topology', async ({
  page,
}, info) => {
  const app = await openMermaid(page, 'basic')
  const frame = page.frameLocator(frameSelector)
  const svg = frame.locator('svg')
  await expect(svg).toBeVisible()
  await expect(svg).toContainText('正文抓取')
  await expect(svg.locator('title')).toHaveText('RSS文章处理流程')
  const before = await svg.getAttribute('id')
  const dimensions = await svg.boundingBox()
  expect(dimensions?.width).toBeGreaterThan(50)
  expect(dimensions?.height).toBeGreaterThan(20)
  await expect(app.locator('iframe')).toHaveAttribute('sandbox', '')
  expect(
    await app
      .locator('iframe')
      .evaluate((element) => (element as HTMLIFrameElement).contentDocument),
  ).toBeNull()
  await app.getByRole('checkbox', { name: '显示去重分支', exact: true }).check()
  await expect(svg).toContainText('跳过入库')
  await expect(svg).not.toHaveAttribute('id', before ?? '')
  await expect(app.getByTestId('a08-source')).toContainText('D -->|是| S[跳过入库]')
  await expect(
    app.getByText('文本替代：RSS源进入抓取；重复文章跳过入库，其余进入索引。'),
  ).toBeVisible()
  await info.attach('actual-mermaid-flowchart.png', {
    body: await app.locator('iframe').screenshot(),
    contentType: 'image/png',
  })
  await app.getByRole('checkbox', { name: '显示去重分支', exact: true }).uncheck()
  await expect(svg).not.toContainText('跳过入库')
})

test('@A08 sequence cache path changes real messages while retaining participants', async ({
  page,
}) => {
  const app = await openMermaid(page, 'business')
  const svg = page.frameLocator(frameSelector).locator('svg')
  await expect(svg).toContainText('获取已处理结果')
  await expect(svg).toContainText('返回摘要')
  await app.getByRole('checkbox', { name: '使用缓存命中路径', exact: true }).check()
  await expect(svg).toContainText('命中缓存')
  await expect(svg).toContainText('返回缓存摘要')
  await expect(svg).toContainText('Worker')
  await expect(svg).not.toContainText('获取已处理结果')
  await expect(app.getByTestId('a08-source')).toContainText('Note over API: 命中缓存')
  await app.getByRole('checkbox', { name: '使用缓存命中路径', exact: true }).uncheck()
  await expect(svg).toContainText('获取已处理结果')
})

test('@A08 real parse failure removes prior SVG, rapid recovery and host teardown stay current', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const app = await openMermaid(page, 'advanced')
  const svg = page.frameLocator(frameSelector).locator('svg')
  await expect(svg).toContainText('Loading')
  const before = await svg.getAttribute('id')
  await app.getByRole('button', { name: '尝试无效语法', exact: true }).click()
  await expect(app.getByRole('status')).toContainText('DSL 语法校验未通过')
  await expect(app.locator('iframe')).toHaveCount(0)
  await expect(app.getByTestId('a08-source')).toContainText('ThisIsNot -->')
  await app.getByRole('button', { name: '恢复合法状态图', exact: true }).click()
  await expect(svg).toContainText('Loading')
  await expect(svg).not.toHaveAttribute('id', before ?? '')
  for (let i = 0; i < 3; i++) {
    await app.getByRole('button', { name: '尝试无效语法', exact: true }).click()
    await app.getByRole('button', { name: '恢复合法状态图', exact: true }).click()
  }
  await expect(app.getByRole('status')).toHaveText('Mermaid 图已生成')
  await expect(svg).toContainText('Success')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  await expect(page.locator(frameSelector)).toHaveCount(0)
  await expect(page.locator('body > [id^="drl-mermaid-"]')).toHaveCount(0)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(page.frameLocator(frameSelector).locator('svg')).toContainText('Loading')
  expect(errors).toEqual([])
})

test('@A08 original Chinese README has immutable provenance and explicit homepage status', async ({
  page,
}) => {
  await page.goto('/libraries/mermaid?tab=readme')
  await expect(page.getByRole('heading', { name: '官方 README 原文', exact: true })).toBeVisible()
  await expect(page.locator('.prose')).not.toBeEmpty()
  await expect(page.getByRole('link', { name: '打开上游原文' })).toHaveAttribute(
    'href',
    /\/1fb7869866dd619168d840291c9c54b4f129758b\/README.zh-CN.md/u,
  )
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.getByRole('tab', { name: '官网预览', exact: true }).click()
  await expect(page.getByRole('link', { name: /打开官网/u })).toHaveAttribute('href', /^https:/u)
  await expect(page.locator('iframe')).toHaveCount(0)
})
