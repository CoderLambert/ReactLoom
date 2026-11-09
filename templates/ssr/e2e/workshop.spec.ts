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

test('announces invalid login fields and accepts corrections', async ({ page }) => {
  await page.goto('/login')
  const email = page.getByLabel('Email')
  const password = page.getByLabel('Password')
  await email.fill('not-an-email')
  await password.fill('short')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page).toHaveURL(/\/login(?:\?.*)?$/)
  await expect(page.locator('#email-error')).toHaveAttribute('role', 'alert')
  await expect(page.locator('#password-error')).toHaveAttribute('role', 'alert')
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(email).toHaveAttribute('aria-describedby', 'email-error')
  await expect(password).toHaveAttribute('aria-invalid', 'true')
  await expect(password).toHaveAttribute('aria-describedby', 'password-error')
  await expect(page.locator('#email-error')).not.toBeEmpty()
  await expect(page.locator('#password-error')).not.toBeEmpty()
  await expect(email).toBeFocused()

  await email.fill('ada@reactloom.dev')
  await password.fill('loom-demo')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Warp board' })).toBeVisible()
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

test('conceals private tasks during delayed sign-out and restores the draft on failure', async ({
  page,
  context,
}) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('ada@reactloom.dev')
  await page.getByLabel('Password').fill('loom-demo')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText('Dress the loom')).toBeVisible()

  const logoutStarted = Promise.withResolvers<void>()
  const releaseLogout = Promise.withResolvers<void>()
  await page.route('**/api/session', async (route) => {
    if (route.request().method() !== 'DELETE') {
      await route.continue()
      return
    }
    logoutStarted.resolve()
    await releaseLogout.promise
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Session service unavailable.' }),
    })
  })

  try {
    const draft = page.getByLabel('Task title')
    await draft.fill('Draft before sign-out')
    await page.getByRole('button', { name: 'Sign out' }).click()
    await logoutStarted.promise

    await expect(page.getByRole('button', { name: 'Signing out…' })).toBeDisabled()
    await expect(page.getByRole('status')).toHaveText('Confirming sign-out…')
    await expect(page.getByText('Dress the loom')).toBeHidden()
    await expect(draft).toBeHidden()

    releaseLogout.resolve()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByText('Dress the loom')).toBeVisible()
    await expect(draft).toHaveValue('Draft before sign-out')
    expect((await context.cookies()).some((cookie) => cookie.name === 'rl_session')).toBe(true)
  } finally {
    releaseLogout.resolve()
    await page.unroute('**/api/session')
  }
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

test('revokes a second tab via storage when session BroadcastChannel is denied', async ({
  page,
  context,
}) => {
  // Block only this template's channel, not other libraries' channels.
  await context.addInitScript(() => {
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
  await expect(page.getByText('Dress the loom')).toBeVisible()

  const secondTab = await context.newPage()
  await secondTab.goto('/tasks')
  await expect(secondTab.getByText('Dress the loom')).toBeVisible()

  // A 401 on the original (background) tab proves immediate storage
  // notification, not a focus event or the 30-second polling fallback.
  const revokedSession = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/session' &&
      response.request().method() === 'GET' &&
      response.status() === 401,
  )
  await secondTab.getByRole('button', { name: 'Sign out' }).click()
  await revokedSession
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/)
  await expect(page.getByText('Dress the loom')).toHaveCount(0)
})

test('rechecks a stale 401 before revoking a session replaced during the request', async ({
  page,
  context,
}) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('ada@reactloom.dev')
  await page.getByLabel('Password').fill('loom-demo')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText('Dress the loom')).toBeVisible()

  const started = Promise.withResolvers<void>()
  const release = Promise.withResolvers<void>()
  let held = false
  await page.route('**/api/session', async (route) => {
    if (route.request().method() !== 'GET' || held) {
      await route.continue()
      return
    }
    held = true
    started.resolve()
    await release.promise
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Sign in is required.' }),
    })
  })

  try {
    const oldResponse = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/api/session' &&
        response.request().method() === 'GET' &&
        response.status() === 401,
    )
    const freshResponse = page.waitForResponse(
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
    await started.promise

    // Replace the cookie without emitting a session event. The delayed
    // response belongs to the old request, not the current authentication.
    const login = await context.request.post('/api/session', {
      data: { email: 'ada@reactloom.dev', password: 'loom-demo' },
    })
    expect(login.status()).toBe(200)
    release.resolve()

    await oldResponse
    await freshResponse
    await expect(page).toHaveURL(/\/tasks(?:\?.*)?$/)
    await expect(page.getByText('Dress the loom')).toBeVisible()
  } finally {
    release.resolve()
    await page.unroute('**/api/session')
  }
})

test('confirms the latest 401 when rapid session events share an error timestamp', async ({
  page,
  context,
}) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('ada@reactloom.dev')
  await page.getByLabel('Password').fill('loom-demo')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText('Dress the loom')).toBeVisible()

  // React Query's errorUpdatedAt uses Date.now(), so two requests can fail
  // in the same millisecond. Freeze the clock to make the collision reliable.
  await page.evaluate(() => {
    const now = Date.now()
    Date.now = () => now
  })
  await context.clearCookies()

  const confirmationStarted = Promise.withResolvers<void>()
  const releaseFirstConfirmation = Promise.withResolvers<void>()
  let getCount = 0
  await page.route('**/api/session', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }
    getCount += 1
    if (getCount === 2) {
      confirmationStarted.resolve()
      await releaseFirstConfirmation.promise
      // A newer confirmed 401 redirects while this obsolete request remains
      // intercepted. Navigation may already have canceled its Route.
      try {
        await route.abort('aborted')
      } catch (error) {
        if (!(error instanceof Error && error.message.includes('Route is already handled'))) {
          throw error
        }
      }
      return
    }
    await route.continue()
  })

  const notify = () => {
    const channel = new BroadcastChannel('reactloom-session')
    channel.postMessage('signed-out')
    channel.close()
  }
  try {
    await page.evaluate(notify)
    // First event refetch: 401. Its confirmation is held in flight.
    await confirmationStarted.promise

    // A second event must confirm its own 401 even though the two Query
    // errors have identical errorUpdatedAt values. The first confirmation
    // cannot be allowed to decide the newer event's authorization.
    await page.evaluate(notify)
    await expect(page).toHaveURL(/\/login(?:\?.*)?$/)
    expect(getCount).toBeGreaterThanOrEqual(4)
    await expect(page.getByText('Dress the loom')).toHaveCount(0)
  } finally {
    releaseFirstConfirmation.resolve()
    await page.unroute('**/api/session')
  }
})
