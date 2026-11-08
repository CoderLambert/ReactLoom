import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('signs in and adds a task', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const accessibility = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze()
  expect(accessibility.violations).toEqual([])

  await page.getByRole('link', { name: 'Enter the workshop' }).click()
  await page.getByLabel('Email').fill('ada@reactloom.dev')
  await page.getByLabel('Password').fill('loom-demo')
  await page.getByRole('main').getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByRole('heading', { name: 'Warp board' })).toBeVisible()
  await page.getByLabel('Task title').fill('Warp the selvage')
  await page.getByRole('button', { name: 'Add task' }).click()
  await expect(page.getByText('Warp the selvage')).toBeVisible()
})

test('expires a private task view on focus after a suspended tab resumes', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('ada@reactloom.dev')
  await page.getByLabel('Password').fill('loom-demo')
  await page.getByRole('main').getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByRole('heading', { name: 'Warp board' })).toBeVisible()
  await expect(page.getByText('Dress the loom')).toBeVisible()

  // Advance the wall clock without firing the scheduled expiry timer, then focus.
  await page.evaluate(() => {
    const afterSleep = Date.now() + 2 * 60 * 60 * 1000
    Date.now = () => afterSleep
    window.dispatchEvent(new Event('focus'))
  })

  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Warp board' })).toHaveCount(0)
  await expect(page.getByText('Dress the loom')).toHaveCount(0)
  expect(await page.evaluate(() => sessionStorage.getItem('reactloom.session'))).toBeNull()
})

test('rejects legacy session storage without a revocation nonce after reload', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('ada@reactloom.dev')
  await page.getByLabel('Password').fill('loom-demo')
  await page.getByRole('main').getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Warp board' })).toBeVisible()

  const legacySession = await page.evaluate(() => {
    sessionStorage.removeItem('reactloom.session.id')
    return sessionStorage.getItem('reactloom.session')
  })
  expect(legacySession).not.toBeNull()
  await page.reload()

  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Warp board' })).toHaveCount(0)
  expect(await page.evaluate(() => sessionStorage.getItem('reactloom.session'))).toBeNull()
  expect(await page.evaluate(() => sessionStorage.getItem('reactloom.session.id'))).toBeNull()
})

test('signing out revokes the same copied session in another tab', async ({ page, context }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('ada@reactloom.dev')
  await page.getByLabel('Password').fill('loom-demo')
  await page.getByRole('main').getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Warp board' })).toBeVisible()

  // Duplicated tabs receive an initial copy of sessionStorage, but later
  // mutations are isolated; reproduce that browser behavior deterministically.
  const stored = await page.evaluate(() => ({
    session: sessionStorage.getItem('reactloom.session'),
    id: sessionStorage.getItem('reactloom.session.id'),
  }))
  expect(stored.session).not.toBeNull()
  expect(stored.id).not.toBeNull()
  const otherTab = await context.newPage()
  await otherTab.addInitScript(({ session, id }) => {
    if (session) sessionStorage.setItem('reactloom.session', session)
    if (id) sessionStorage.setItem('reactloom.session.id', id)
  }, stored)
  // Each browser tab starts a distinct MSW worker/fixture registry. Prime the
  // copied tab's demo token server-side without changing its stored session id.
  await otherTab.goto('/')
  // SPA rendering waits for worker.start(); do not race the mock registration.
  await expect(otherTab.getByRole('heading', { level: 1 })).toBeVisible()
  expect(
    await otherTab.evaluate(async () => {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ada@reactloom.dev', password: 'loom-demo' }),
      })
      return response.ok
    }),
  ).toBe(true)
  // Client-side navigation preserves the tab-local MSW fixture registry.
  await otherTab
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name: 'Tasks' })
    .click()
  await expect(otherTab.getByText('Dress the loom')).toBeVisible()

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(otherTab.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await expect(otherTab.getByText('Dress the loom')).toHaveCount(0)
  expect(await otherTab.evaluate(() => sessionStorage.getItem('reactloom.session'))).toBeNull()
  expect(await otherTab.evaluate(() => sessionStorage.getItem('reactloom.session.id'))).toBeNull()
})

test('replacing a session revokes copied tabs but preserves the replacement', async ({
  page,
  context,
}) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('ada@reactloom.dev')
  await page.getByLabel('Password').fill('loom-demo')
  await page.getByRole('main').getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Warp board' })).toBeVisible()

  const original = await page.evaluate(() => ({
    session: sessionStorage.getItem('reactloom.session'),
    id: sessionStorage.getItem('reactloom.session.id'),
  }))
  expect(original.session).not.toBeNull()
  expect(original.id).not.toBeNull()

  const copiedTab = await context.newPage()
  await copiedTab.addInitScript(({ session, id }) => {
    if (session) sessionStorage.setItem('reactloom.session', session)
    if (id) sessionStorage.setItem('reactloom.session.id', id)
  }, original)
  await copiedTab.goto('/')
  await expect(copiedTab.getByRole('heading', { level: 1 })).toBeVisible()

  // The demo MSW worker has a separate token registry for each tab. Prime
  // the copied tab without changing its sessionStorage nonce.
  expect(
    await copiedTab.evaluate(async () => {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ada@reactloom.dev', password: 'loom-demo' }),
      })
      return response.ok
    }),
  ).toBe(true)
  await copiedTab
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name: 'Tasks' })
    .click()
  await expect(copiedTab.getByText('Dress the loom')).toBeVisible()

  // /login remains public for an authenticated tab; signing in again rotates
  // this tab's nonce, which must revoke only tabs holding the previous nonce.
  await page.goto('/login')
  await page.getByLabel('Email').fill('ada@reactloom.dev')
  await page.getByLabel('Password').fill('loom-demo')
  await page.getByRole('main').getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Warp board' })).toBeVisible()

  const replacement = await page.evaluate(() => ({
    session: sessionStorage.getItem('reactloom.session'),
    id: sessionStorage.getItem('reactloom.session.id'),
  }))
  expect(replacement.session).not.toBeNull()
  expect(replacement.id).not.toBeNull()
  expect(replacement.id).not.toBe(original.id)

  await expect(copiedTab.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await expect(copiedTab.getByText('Dress the loom')).toHaveCount(0)
  expect(await copiedTab.evaluate(() => sessionStorage.getItem('reactloom.session'))).toBeNull()
  expect(await copiedTab.evaluate(() => sessionStorage.getItem('reactloom.session.id'))).toBeNull()

  // A delayed old-session revocation must not log out the replacement tab.
  await expect(page.getByText('Dress the loom')).toBeVisible()
  expect(await page.evaluate(() => sessionStorage.getItem('reactloom.session.id'))).toBe(
    replacement.id,
  )
})

test('revokes copied private tasks when the session BroadcastChannel is blocked', async ({
  page,
  context,
}) => {
  // Keep MSW's own BroadcastChannel available while simulating a browser
  // that refuses the application's cross-tab session channel.
  await context.addInitScript(() => {
    const NativeChannel = window.BroadcastChannel
    window.BroadcastChannel = class extends NativeChannel {
      constructor(name: string) {
        if (name === 'reactloom.session-logout') throw new Error('channel blocked')
        super(name)
      }
    }
  })

  await page.goto('/login')
  await page.getByLabel('Email').fill('ada@reactloom.dev')
  await page.getByLabel('Password').fill('loom-demo')
  await page.getByRole('main').getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText('Dress the loom')).toBeVisible()

  const stored = await page.evaluate(() => ({
    session: sessionStorage.getItem('reactloom.session'),
    id: sessionStorage.getItem('reactloom.session.id'),
  }))
  expect(stored.session).not.toBeNull()
  expect(stored.id).not.toBeNull()

  const copied = await context.newPage()
  await copied.addInitScript(({ session, id }) => {
    if (session) sessionStorage.setItem('reactloom.session', session)
    if (id) sessionStorage.setItem('reactloom.session.id', id)
  }, stored)
  await copied.goto('/')
  await expect(copied.getByRole('heading', { level: 1 })).toBeVisible()
  expect(
    await copied.evaluate(async () => {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ada@reactloom.dev', password: 'loom-demo' }),
      })
      return response.ok
    }),
  ).toBe(true)
  await copied
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name: 'Tasks' })
    .click()
  await expect(copied.getByText('Dress the loom')).toBeVisible()

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(copied.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await expect(copied.getByText('Dress the loom')).toHaveCount(0)
  expect(await copied.evaluate(() => sessionStorage.getItem('reactloom.session'))).toBeNull()
  expect(await copied.evaluate(() => sessionStorage.getItem('reactloom.session.id'))).toBeNull()
  expect(
    await page.evaluate(() => localStorage.getItem('reactloom.session-logout-event')),
  ).toBeNull()
})

test('does not restore credentials on reload when storage deletion is blocked', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('ada@reactloom.dev')
  await page.getByLabel('Password').fill('loom-demo')
  await page.getByRole('main').getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Warp board' })).toBeVisible()

  await page.evaluate(() => {
    const originalRemove = Storage.prototype.removeItem
    Storage.prototype.removeItem = function (key: string) {
      if (this === sessionStorage) {
        throw new DOMException('Deletion denied', 'SecurityError')
      }
      return originalRemove.call(this, key)
    }
  })

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  expect(await page.evaluate(() => sessionStorage.getItem('reactloom.session'))).toBe('')
  expect(await page.evaluate(() => sessionStorage.getItem('reactloom.session.id'))).toBe('')

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Warp board' })).toHaveCount(0)
})
