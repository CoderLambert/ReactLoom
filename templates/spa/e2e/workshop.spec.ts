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
  await otherTab.goto('/tasks')
  await expect(otherTab.getByText('Dress the loom')).toBeVisible()

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(otherTab.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await expect(otherTab.getByText('Dress the loom')).toHaveCount(0)
  expect(await otherTab.evaluate(() => sessionStorage.getItem('reactloom.session'))).toBeNull()
  expect(await otherTab.evaluate(() => sessionStorage.getItem('reactloom.session.id'))).toBeNull()
})
