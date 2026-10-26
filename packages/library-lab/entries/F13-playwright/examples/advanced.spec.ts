import {test, expect} from '@playwright/test'
import {racePage} from './fixtures'

test('advanced: stale aborted request never overwrites the newest result', async ({page}) => {
  let abortedOrLateOld = false
  await page.route('https://api.lab.invalid/items**', async route => {
    const q = new URL(route.request().url()).searchParams.get('q')
    if (q === 'old') {
      await new Promise(resolve => setTimeout(resolve, 280))
      try {
        await route.fulfill({status: 200, contentType: 'application/json',
          headers: {'access-control-allow-origin': '*'},
          body: JSON.stringify({label: '旧结果'})})
      } catch {
        abortedOrLateOld = true // Expected when browser aborts a pending fetch.
      }
    } else {
      await route.fulfill({status: 200, contentType: 'application/json',
        headers: {'access-control-allow-origin': '*'},
        body: JSON.stringify({label: '新结果'})})
    }
  })
  await page.setContent(racePage)
  await page.getByRole('button', {name: '旧版本'}).click()
  await page.getByRole('button', {name: '新版本'}).click()
  await expect(page.getByRole('status')).toHaveText('新结果')
  // The old response may be cancelled or arrive later. In neither case may it replace new.
  await page.waitForTimeout(350)
  await expect(page.getByRole('status')).toHaveText('新结果')
  expect(typeof abortedOrLateOld).toBe('boolean')
})
