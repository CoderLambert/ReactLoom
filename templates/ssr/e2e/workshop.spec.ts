import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('signs in with a cookie session and adds a task', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const accessibility = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze()
  expect(accessibility.violations).toEqual([])

  await page.getByRole('link', { name: 'Enter the workshop' }).click()
  await page.getByLabel('Email').fill('ada@reactloom.dev')
  await page.getByLabel('Password').fill('loom-demo')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Warp board' })).toBeVisible()
  await expect(page.getByText('Dress the loom')).toBeVisible()

  await page.getByLabel('Task title').fill('Warp the selvage')
  await page.getByRole('button', { name: 'Add task' }).click()
  await expect(page.getByText('Warp the selvage')).toBeVisible()
})

test('sign out removes the session cookie and blocks access to private tasks', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('ada@reactloom.dev')
  await page.getByLabel('Password').fill('loom-demo')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Warp board' })).toBeVisible()
  await expect(page.getByText('Dress the loom')).toBeVisible()

  const sessionCookies = await page.context().cookies()
  expect(sessionCookies.some((cookie) => cookie.name === 'rl_session')).toBe(true)

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/)
  expect((await page.context().cookies()).some((cookie) => cookie.name === 'rl_session')).toBe(
    false,
  )

  await page.goto('/tasks')
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/)
  await expect(page.getByText('Dress the loom')).toHaveCount(0)
})

test('revokes the cached view in another tab after sign-out', async ({ page, context }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('ada@reactloom.dev')
  await page.getByLabel('Password').fill('loom-demo')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Warp board' })).toBeVisible()
  await expect(page.getByText('Dress the loom')).toBeVisible()

  const secondTab = await context.newPage()
  await secondTab.goto('/tasks')
  await expect(secondTab.getByRole('heading', { name: 'Warp board' })).toBeVisible()
  await secondTab.getByRole('button', { name: 'Sign out' }).click()
  await expect(secondTab).toHaveURL(/\/login(?:\?.*)?$/)

  // BroadcastChannel delivers the revocation even when Chromium does not
  // dispatch a visibilitychange after bringToFront in headless mode.
  await page.bringToFront()
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/)
  await expect(page.getByText('Dress the loom')).toHaveCount(0)
})

test('rechecks a delayed sign-out event instead of revoking a newer cookie session', async ({
  page,
  context,
}) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('ada@reactloom.dev')
  await page.getByLabel('Password').fill('loom-demo')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Warp board' })).toBeVisible()

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/)
  await page.getByLabel('Email').fill('ada@reactloom.dev')
  await page.getByLabel('Password').fill('loom-demo')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText('Dress the loom')).toBeVisible()
  expect((await context.cookies()).some((cookie) => cookie.name === 'rl_session')).toBe(true)

  // Simulate delivery of an old tab's queued sign-out after a replacement
  // login has already established an authorized cookie.
  const recheckedSession = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/session' &&
      response.request().method() === 'GET' &&
      response.status() === 200,
  )
  await page.evaluate(() => {
    const channel = new BroadcastChannel('reactloom-session')
    channel.postMessage('signed-out')
    channel.close()
  })
  await recheckedSession
  await expect(page).toHaveURL(/\/tasks(?:\?.*)?$/)
  await expect(page.getByText('Dress the loom')).toBeVisible()
})

test('revalidates a foreground tab after its session cookie is revoked externally', async ({
  page,
  context,
}) => {
  // Install before navigation so TanStack Query's interval uses the test clock.
  // The browser stays in the foreground: no focus/visibility event or channel message.
  await page.clock.install()
  await page.goto('/login')
  await page.getByLabel('Email').fill('ada@reactloom.dev')
  await page.getByLabel('Password').fill('loom-demo')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Warp board' })).toBeVisible()
  await expect(page.getByText('Dress the loom')).toBeVisible()

  // Simulates cookie expiry/revocation outside the template, not a UI sign-out.
  await context.clearCookies()
  await expect(page.getByText('Dress the loom')).toBeVisible()

  const rejectedSession = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/session' &&
      response.request().method() === 'GET' &&
      response.status() === 401,
  )
  await page.clock.fastForward(30_001)
  await rejectedSession
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/)
  await expect(page.getByText('Dress the loom')).toHaveCount(0)
})

test('keeps sign-in and sign-out usable when session BroadcastChannel is denied', async ({
  page,
  context,
}) => {
  // Some restricted browser contexts expose BroadcastChannel but reject
  // construction. Only the template session channel is blocked in this test.
  await page.addInitScript(() => {
    const NativeChannel = window.BroadcastChannel
    window.BroadcastChannel = class extends NativeChannel {
      constructor(name: string) {
        if (name === 'reactloom-session') {
          throw new DOMException('Session messaging is denied', 'SecurityError')
        }
        super(name)
      }
    }
  })

  await page.goto('/login')
  await page.getByLabel('Email').fill('ada@reactloom.dev')
  await page.getByLabel('Password').fill('loom-demo')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Warp board' })).toBeVisible()
  await expect(page.getByText('Dress the loom')).toBeVisible()

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/)
  expect((await context.cookies()).some((cookie) => cookie.name === 'rl_session')).toBe(false)
})

test('hides cached tasks while an offline session refresh is paused', async ({ page, context }) => {
  // Drive the foreground session timer without waiting 30 seconds in real time.
  await page.clock.install()
  await page.goto('/login')
  await page.getByLabel('Email').fill('ada@reactloom.dev')
  await page.getByLabel('Password').fill('loom-demo')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Warp board' })).toBeVisible()
  await expect(page.getByText('Dress the loom')).toBeVisible()

  // TanStack Query preserves successful data during an offline refetch, but
  // switches fetchStatus to 'paused' (isFetching is false). Hide private UI
  // until the cookie can be verified again.
  await context.setOffline(true)
  await page.clock.fastForward(30_001)
  await expect(page.getByText('Checking session…')).toBeVisible()
  await expect(page.getByText('Dress the loom')).toBeHidden()

  // A successful server revalidation restores the same draft and task view.
  await context.setOffline(false)
  await expect(page.getByRole('heading', { name: 'Warp board' })).toBeVisible()
  await expect(page.getByText('Dress the loom')).toBeVisible()
})
