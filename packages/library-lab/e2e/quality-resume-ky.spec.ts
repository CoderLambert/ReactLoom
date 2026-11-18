import { expect, test } from '@playwright/test'

test('D08 real Ky request, race, IME, cancellation and protocol boundaries @D08', async ({
  page,
}) => {
  await page.goto('/libraries/ky?tab=demo&example=basic')
  const demo = page.getByRole('region', { name: 'Ky HTTP 客户端演示' })
  await demo.getByRole('button', { name: 'GET 来源列表', exact: true }).click()
  await expect(demo.getByRole('listitem')).toHaveCount(3)
  await page.goto('/libraries/ky?tab=demo&example=business')
  const input = demo.getByRole('textbox', { name: '来源关键词' })
  await input.fill('不存在')
  await input.dispatchEvent('compositionstart')
  await demo.getByRole('button', { name: '搜索来源', exact: true }).click()
  await expect(demo.getByRole('status')).toContainText('待执行')
  await input.dispatchEvent('compositionend')
  await demo.getByRole('button', { name: '搜索来源', exact: true }).click()
  await expect(demo.getByRole('status')).toContainText('0 条')
  await demo.getByRole('button', { name: '模拟先慢后快的搜索' }).click()
  await expect(demo.getByRole('status')).toContainText('关键词：fast')
  await expect(demo.getByRole('listitem')).toHaveCount(1)
  await expect(demo.getByRole('listitem')).toContainText('React 工程')
  await input.fill('slow')
  await demo.getByRole('button', { name: '搜索来源', exact: true }).click()
  await demo.getByRole('button', { name: '取消当前请求' }).click()
  await expect(demo.getByRole('status')).toContainText('已取消旧请求')
  await page.goto('/libraries/ky?tab=demo&example=advanced')
  for (let run = 0; run < 2; run++) {
    await demo.getByRole('button', { name: 'GET 503 → 有限重试' }).click()
    await expect(demo.getByRole('status')).toContainText('实际请求次数：2')
  }
  for (const [name, output] of [
    ['POST 409 → 不重试', 'HTTP 409'],
    ['200 ms 响应 → 30 ms 超时', '超时'],
    ['200 JSON → 自建 schema 拒绝', '只能使用HTTPS来源'],
    ['响应体 1 KiB → 100 B 上限', '响应体超出限制'],
    ['DELETE 204 空正文', 'DELETE 204'],
  ]) {
    await demo.getByRole('button', { name, exact: true }).click()
    await expect(demo.getByRole('status')).toContainText(output)
  }
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(demo).toHaveCount(0)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(demo.getByRole('status')).toHaveText('')
})
