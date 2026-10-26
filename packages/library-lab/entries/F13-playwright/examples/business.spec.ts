import {test, expect} from '@playwright/test'
import {subscriptionPage} from './fixtures'

const cases = [
  {status: 200, body: {ok: true}, expected: '订阅成功'},
  {status: 422, body: {message: '邮箱格式错误'}, expected: '邮箱格式错误'},
  {status: 503, body: {message: '服务暂不可用'}, expected: '服务暂不可用'},
] as const

for (const scenario of cases) {
  test(`business: actual browser fetch mocked at HTTP boundary ${scenario.status}`, async ({page}) => {
    let intercepted = 0
    await page.route('https://api.lab.invalid/subscribe**', async route => {
      intercepted++
      await route.fulfill({
        status: scenario.status,
        contentType: 'application/json',
        headers: {'access-control-allow-origin': '*'},
        body: JSON.stringify(scenario.body),
      })
    })
    await page.setContent(subscriptionPage)
    await page.getByRole('textbox', {name: '邮箱'}).fill('reader@example.test')
    await page.getByRole('button', {name: '提交订阅'}).click()
    await expect(page.getByRole('status')).toHaveText(scenario.expected)
    expect(intercepted).toBe(1)
  })
}
