import {test, expect} from '@playwright/test'
import {racePage} from './fixtures'

test('advanced: abort and stale response cannot overwrite the newest result', async ({page}) => {
  // Deterministic barriers: the old request MUST be intercepted before new begins.
  let oldSeen!: () => void
  let releaseOld!: () => void
  let oldFinished!: () => void
  const interceptedOld = new Promise<void>(resolve => {oldSeen = resolve})
  const oldBarrier = new Promise<void>(resolve => {releaseOld = resolve})
  const finishedOld = new Promise<void>(resolve => {oldFinished = resolve})
  let oldHandlerRan = false
  await page.route('https://api.lab.invalid/items**', async route => {
    const q = new URL(route.request().url()).searchParams.get('q')
    if (q === 'old') {
      oldHandlerRan = true
      oldSeen()
      try {
        await oldBarrier
        // If AbortController already cancelled fetch, fulfill can reject; that's
        // expected. The important contract is the visible newest result.
        await route.fulfill({status: 200, contentType: 'application/json',
          headers: {'access-control-allow-origin': '*'},
          body: JSON.stringify({label: '旧结果'})})
      } catch {
        // The browser cancelled the old network request.
      } finally {
        oldFinished()
      }
    } else {
      await route.fulfill({status: 200, contentType: 'application/json',
        headers: {'access-control-allow-origin': '*'},
        body: JSON.stringify({label: '新结果'})})
    }
  })
  await page.setContent(racePage)
  try {
    await page.getByRole('button', {name: '旧版本'}).click()
  await interceptedOld
  await page.getByRole('button', {name: '新版本'}).click()
  await expect(page.getByRole('status')).toHaveText('新结果')
  releaseOld()
  await finishedOld
  await expect(page.getByRole('status')).toHaveText('新结果')
  expect(oldHandlerRan).toBe(true)
  } finally {
    // Also release a held route when an assertion fails before the normal release.
    releaseOld()
  }
})
