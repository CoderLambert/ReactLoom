import {test, expect} from '@playwright/test'
import {subscriptionPage} from './fixtures'

const cases = [
  {status: 200, body: {ok: true}, expected: '订阅成功'},
  {status: 422, body: {message: '邮箱格式错误'}, expected: '邮箱格式错误'},
  {status: 503, body: {message: '服务暂不可用'}, expected: '服务暂不可用'},
  {status: 200, body: {ok: false}, expected: '响应格式异常'},
  {status: 422, body: {}, expected: '响应格式异常'},
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

test('business: network failure is not confused with HTTP 422/503', async ({page}) => {
  let requests = 0
  await page.route('https://api.lab.invalid/subscribe**', route => {
    requests++
    return route.abort('failed')
  })
  await page.setContent(subscriptionPage)
  await page.getByRole('textbox', {name: '邮箱'}).fill('reader@example.test')
  await page.getByRole('button', {name: '提交订阅'}).click()
  await expect(page.getByRole('status')).toHaveText('网络不可用')
  expect(requests).toBe(1)
})

test('business: malformed JSON is rejected independently of HTTP success', async ({page}) => {
  await page.route('https://api.lab.invalid/subscribe**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {'access-control-allow-origin': '*'},
      body: '{invalid-json',
    }),
  )
  await page.setContent(subscriptionPage)
  await page.getByRole('textbox', {name: '邮箱'}).fill('reader@example.test')
  await page.getByRole('button', {name: '提交订阅'}).click()
  await expect(page.getByRole('status')).toHaveText('响应格式异常')
})

test('business: pending request blocks duplicate submission and releases button', async ({page}) => {
  let release!: () => void
  let intercepted!: () => void
  const blocked = new Promise<void>(resolve => {release = resolve})
  const started = new Promise<void>(resolve => {intercepted = resolve})
  let calls = 0
  await page.route('https://api.lab.invalid/subscribe**', async route => {
    calls++
    intercepted()
    try {
      await blocked
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {'access-control-allow-origin': '*'},
        body: JSON.stringify({ok: true}),
      })
    } catch {
      // Context teardown may cancel a route after a failed assertion.
    }
  })
  try {
    await page.setContent(subscriptionPage)
    await page.getByRole('textbox', {name: '邮箱'}).fill('reader@example.test')
    const button = page.getByRole('button', {name: '提交订阅'})
    await button.click()
    await started
    await expect(button).toBeDisabled()
    release()
    await expect(page.getByRole('status')).toHaveText('订阅成功')
    await expect(button).toBeEnabled()
    expect(calls).toBe(1)
  } finally {
    release()
  }
})
