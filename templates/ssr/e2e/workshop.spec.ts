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
